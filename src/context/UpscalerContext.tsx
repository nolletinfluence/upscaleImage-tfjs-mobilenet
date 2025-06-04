import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { UpscaleQueue } from '../utils/UpscaleQueue';

const MODEL_CONFIG = {
  INPUT_SIZE: 384,
  SCALE_FACTOR: 2,
  BATCH_SIZE: 1,
  MIN_DIMENSION: 64
};

interface UpscalerContextType {
  model: mobilenet.MobileNet | null;
  isModelLoading: boolean;
  modelLoadingError: string | null;
  isGpuSupported: boolean;
  queueStatus: {
    total: number;
    processing: number;
    completed: number;
  };
  performance: {
    lastUpscaleTime: number | null;
    averageUpscaleTime: number | null;
    memoryUsage: tf.MemoryInfo | null;
  };
  upscaleImage: (imageElement: HTMLImageElement) => Promise<string | null>;
  resetPerformance: () => void;
}

const UpscalerContext = createContext<UpscalerContextType | undefined>(undefined);

interface UpscalerProviderProps {
  children: ReactNode;
}

export default function UpscalerProvider({ children }: UpscalerProviderProps) {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);  // Set initial value to true
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  const [isGpuSupported, setIsGpuSupported] = useState(false);
  const [queue] = useState(() => new UpscaleQueue());
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    processing: 0,
    completed: 0
  });
  const [performance, setPerformance] = useState({
    lastUpscaleTime: null as number | null,
    averageUpscaleTime: null as number | null,
    memoryUsage: null as tf.MemoryInfo | null
  });

  useEffect(() => {
    async function initialize() {
      try {
        console.log('Starting TensorFlow initialization...');
        setIsModelLoading(true);
        setModelLoadingError(null);
        
        // подгрузка бэка
        await tf.ready();
        console.log('TensorFlow.js initialized with backend:', tf.getBackend());
        
        // проверка поддержки WebGL
        const webGLSupported = tf.getBackend() === 'webgl';
        setIsGpuSupported(webGLSupported);
        console.log('WebGL support:', webGLSupported);
        
        // если поддерживается WebGL, иначе WASM
        if (webGLSupported) {
          await tf.setBackend('webgl');
          console.log('Using WebGL backend');
          
          // настройка WebGL для лучшей производительности
          const backend = tf.backend();
          if ('getGPGPUContext' in backend) {
            console.log('Configuring WebGL context...');
            const ctx = (backend as { getGPGPUContext(): { gl: WebGLRenderingContext } }).getGPGPUContext();
            if (ctx && ctx.gl) {
              const gl = ctx.gl;
          gl.disable(gl.DEPTH_TEST);
          gl.disable(gl.STENCIL_TEST);
          gl.disable(gl.BLEND);
          gl.disable(gl.DITHER);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.disable(gl.SAMPLE_COVERAGE);
          gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
              console.log('WebGL context optimized');
            }
          }
        } else {
          console.log('WebGL not supported, falling back to WASM backend');
          await tf.setBackend('wasm');
          console.log('Using WASM backend');
        }
        
        // загрузка модели
        console.log('Loading MobileNet model...');
        try {
          const loadedModel = await mobilenet.load();
          console.log('Model loaded successfully');
        setModel(loadedModel);
        } catch (modelError) {
          console.error('Failed to load model:', modelError);
          setModelLoadingError(`Failed to load model: ${(modelError as Error).message}`);
          throw modelError;
        }
        
        setIsModelLoading(false);
        console.log('Initialization complete');
      } catch (error) {
        console.error('Failed to initialize:', error);
        setModelLoadingError(`Initialization failed: ${(error as Error).message}`);
        setIsModelLoading(false);
      }
    }
    
    initialize();
    
    // очистка ресурсов TensorFlow при размонтировании
    return () => {
      console.log('Очистка ресурсов TensorFlow');
      tf.disposeVariables();
    };
  }, []);

  // отслеживание статуса очереди
  useEffect(() => {
    const statusUpdateHandler = (status: { total: number; processing: number; completed: number }) => {
      setQueueStatus(status);
    };
    
    queue.onStatusUpdate(statusUpdateHandler);
    
    return () => {
      queue.offStatusUpdate(statusUpdateHandler);
    };
  }, [queue]);

  // функция для увеличения изображения
  const upscaleImage = useCallback(async (imageElement: HTMLImageElement): Promise<string | null> => {
    console.log('upscaleImage вызвана с:', imageElement.src);
    
    if (!model) {
      console.error('Модель не загружена');
      return null;
    }
    
    try {
      const startTime = window.performance.now();
      console.log('Начало процесса увеличения изображения...');
      console.log('Размеры изображения:', imageElement.naturalWidth, 'x', imageElement.naturalHeight);
      
      // создание чистого холста для обработки изображений с разным происхождением
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = imageElement.naturalWidth;
      cleanCanvas.height = imageElement.naturalHeight;
      
      const inputCtx = cleanCanvas.getContext('2d', { willReadFrequently: true });
      if (!inputCtx) throw new Error('Could not get canvas context');
      
      // установка холста в качестве cross-origin чистого
      inputCtx.imageSmoothingEnabled = true;
      inputCtx.imageSmoothingQuality = 'high';
      
      // убедитесь, что изображение загружено
      if (!imageElement.complete) {
        await new Promise<void>((resolve, reject) => {
          imageElement.onload = () => resolve();
          imageElement.onerror = () => reject(new Error('Failed to load image'));
        });
      }
      
      // рисуем изображение на чистом холсте
      try {
        inputCtx.drawImage(imageElement, 0, 0);
        // проверяем, можем ли мы получить данные холста
        inputCtx.getImageData(0, 0, 1, 1);
      } catch (error) {
        console.error('Ошибка CORS:', error);
        console.log('Попытка загрузить изображение через прокси...');
        // если холст грязный, используем прокси
        const proxyImage = new Image();
        proxyImage.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          proxyImage.onload = () => resolve();
          proxyImage.onerror = () => reject(new Error('Failed to load image through proxy'));
          // используем сервис CORS прокси
          proxyImage.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageElement.src)}`;
        });
        // очистка и перерисовка с прокси изображением
        inputCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
        inputCtx.drawImage(proxyImage, 0, 0);
      }
      
      console.log('Изображение успешно нарисовано на холст');
      
      // преобразование чистого холста в тензор
      const imageTensor = tf.browser.fromPixels(cleanCanvas);
      console.log('Форма исходного тензора:', imageTensor.shape);
      
      // вычисление размеров, сохраняя соотношение сторон
      const [originalHeight, originalWidth] = imageTensor.shape.slice(0, 2);
      const aspectRatio = originalWidth / originalHeight;
      
      let resizeWidth = MODEL_CONFIG.INPUT_SIZE;
      let resizeHeight = MODEL_CONFIG.INPUT_SIZE;
      
      if (aspectRatio > 1) {
        // Landscape
        resizeHeight = Math.round(MODEL_CONFIG.INPUT_SIZE / aspectRatio);
      } else {
        // Portrait
        resizeWidth = Math.round(MODEL_CONFIG.INPUT_SIZE * aspectRatio);
      }
      
      // изменение размеров, сохраняя соотношение сторон
      const resized = tf.image.resizeBilinear(imageTensor, [resizeHeight, resizeWidth]);
      console.log('Форма измененного тензора:', resized.shape);
      
      // получение векторов признаков из MobileNet
      const embeddings = await model.infer(resized, true);
      console.log('Форма тензора векторов признаков:', embeddings.shape);
      
      // увеличение векторов признаков с использованием транспонированной свертки
      const upscaled = tf.tidy(() => {
        // получение информации о форме из векторов признаков
        const shape = embeddings.shape;
        console.log('Обработка векторов признаков с формой:', shape);
        
        // вычисление размеров выходного изображения, сохраняя соотношение сторон
        const outputHeight = resizeHeight * MODEL_CONFIG.SCALE_FACTOR;
        const outputWidth = resizeWidth * MODEL_CONFIG.SCALE_FACTOR;
        
        // изменение формы векторов признаков, если необходимо
        let reshapedEmbeddings: tf.Tensor4D;
        if (shape.length === 2) {
          const totalFeatures = shape[1]; // это 1024 из MobileNet
          
          // вычисление размеров, которые точно подойдут для наших признаков
          //  ширина * высота * каналы = totalFeatures
          // для 1024 признаков хорошим разделением будет 16x16x4 или 8x8x16
          const spatialDim = 16;
          const channels = totalFeatures / (spatialDim * spatialDim);
          
          console.log(`Изменение формы на [1, ${spatialDim}, ${spatialDim}, ${channels}]`);
          
          try {
            reshapedEmbeddings = embeddings.reshape([1, spatialDim, spatialDim, channels]) as tf.Tensor4D;
          } catch (error) {
            console.error('Первое изменение формы не удалось, попробуем альтернативный вариант:', error);
            // альтернативный вариант 8x8x16, если 16x16x4 не подходит
            const fallbackDim = 8;
            const fallbackChannels = totalFeatures / (fallbackDim * fallbackDim);
            console.log(`Альтернативный вариант: [1, ${fallbackDim}, ${fallbackDim}, ${fallbackChannels}]`);
            reshapedEmbeddings = embeddings.reshape([1, fallbackDim, fallbackDim, fallbackChannels]) as tf.Tensor4D;
          }
          
          console.log('Изменение формы 2D векторов признаков на пространственную форму:', reshapedEmbeddings.shape);
        } else {
          // гарантируем, что у нас есть все размеры перед изменением формы
          if (shape.length !== 4 || !shape[1] || !shape[2] || !shape[3]) {
            throw new Error('Invalid shape for embeddings tensor');
          }
          reshapedEmbeddings = embeddings.reshape([1, shape[1], shape[2], shape[3]]) as tf.Tensor4D;
          console.log('Использование существующих пространственных размеров:', reshapedEmbeddings.shape);
        }
        
        // создание слоев увеличения с отрегулированными параметрами
        const upscaleLayer1 = tf.layers.conv2dTranspose({
          filters: 64,
          kernelSize: 3,
          strides: 2,
          padding: 'same',
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        });
        
        const upscaleLayer2 = tf.layers.conv2dTranspose({
          filters: 32,
          kernelSize: 3,
          strides: 2,
          padding: 'same',
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        });
        
        const intermediateLayer = tf.layers.conv2d({
          filters: 16,
          kernelSize: 3,
          padding: 'same',
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        });
        
        const outputLayer = tf.layers.conv2d({
          filters: 3,
          kernelSize: 3,
          padding: 'same',
          activation: 'tanh',
          kernelInitializer: 'glorotNormal'
        });
        
        // применение увеличения
        const intermediate1 = upscaleLayer1.apply(reshapedEmbeddings) as tf.Tensor4D;
        console.log('Первый увеличенный размер:', intermediate1.shape);
        
        const intermediate2 = upscaleLayer2.apply(intermediate1) as tf.Tensor4D;
        console.log('Второй увеличенный размер:', intermediate2.shape);
        
        const intermediate3 = intermediateLayer.apply(intermediate2) as tf.Tensor4D;
        console.log('Третий увеличенный размер:', intermediate3.shape);
        
        const output = outputLayer.apply(intermediate3) as tf.Tensor4D;
        console.log('Финальный размер:', output.shape);
        
        // изменение размеров до желаемых выходных размеров и гарантируем, что это 4D тензор
        return tf.image.resizeBilinear(output, [outputHeight, outputWidth]) as tf.Tensor4D;
      });
      
      // преобразование в изображение
      const [, height, width] = upscaled.shape;
      console.log('Размеры выходного изображения:', width, 'x', height);
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('Не удалось получить контекст холста');
      
      // обработка значений тензора для отображения
      const scaled = tf.tidy(() => {
        // удаление размерности пакета
        const squeezed = upscaled.squeeze([0]);
        console.log('Форма сжатого тензора:', squeezed.shape);
        
        // нормализация значений от tanh (-1 до 1) до диапазона (0 до 1)
        const normalized = tf.add(squeezed, 1).mul(0.5);
        
        // применение усиления контраста
        const enhanced = tf.pow(normalized, 0.8); // коррекция гаммы для лучшего контраста
        
        // запись минимальных/максимальных значений перед отсечением
        const minVal = tf.min(enhanced).dataSync()[0];
        const maxVal = tf.max(enhanced).dataSync()[0];
        console.log('Диапазон значений перед отсечением:', minVal, 'до', maxVal);
        
        // гарантируем, что значения находятся в диапазоне [0, 1]
        const clipped = tf.clipByValue(enhanced, 0, 1);
        
        // преобразование в диапазон 0-255 и гарантируем, что значения являются целыми числами
        const result = tf.cast(tf.mul(clipped, 255), 'int32') as tf.Tensor3D;
        console.log('Финальная форма тензора:', result.shape);
        return result;
      });
      
      // преобразование в пиксели
      console.log('Преобразование в пиксели...');
      const pixels = await tf.browser.toPixels(scaled);
      console.log('Длина массива пикселей:', pixels.length);
      
      const imageData = new ImageData(
        new Uint8ClampedArray(pixels),
        width,
        height
      );
      outputCtx.putImageData(imageData, 0, 0);
      
      const dataUrl = outputCanvas.toDataURL('image/png');
      console.log('Процесс завершен успешно');
      
      // обновление метрик производительности
      const endTime = window.performance.now();
      const upscaleTime = endTime - startTime;
      
      setPerformance(prev => {
        const avgTime = prev.averageUpscaleTime 
          ? (prev.averageUpscaleTime + upscaleTime) / 2 
          : upscaleTime;
          
        return {
          lastUpscaleTime: upscaleTime,
          averageUpscaleTime: avgTime,
          memoryUsage: tf.memory()
        };
      });
      
      // очистка тензоров
      tf.dispose([imageTensor, resized, embeddings, upscaled, scaled]);
      
      return dataUrl;
    } catch (error) {
      console.error('Ошибка в upscaleImage:', error);
      return null;
    }
  }, [model]);

  // сброс метрик производительности
  const resetPerformance = useCallback(() => {
    setPerformance({
      lastUpscaleTime: null,
      averageUpscaleTime: null,
      memoryUsage: null
    });
  }, []);

  const value = {
    model,
    isModelLoading,
    modelLoadingError,
    isGpuSupported,
    queueStatus,
    performance,
    upscaleImage,
    resetPerformance
  };

  return (
    <UpscalerContext.Provider value={value}>
      {children}
    </UpscalerContext.Provider>
  );
}

// экспорт контекста для файла хука
export { UpscalerContext };
export type { UpscalerContextType };