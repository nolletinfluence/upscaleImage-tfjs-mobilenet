import React, { useEffect, useRef } from 'react';
import { useUpscaler } from '../hooks/useUpscaler';
import { UpscaleQueue } from './UpscaleQueue';

interface ImageUpscaledDetail {
  original: string;
  upscaled: string;
}

declare global {
  interface WindowEventMap {
    'imageUpscaled': CustomEvent<ImageUpscaledDetail>;
  }
}

const GlobalUpscaler: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const queueRef = useRef<UpscaleQueue>(new UpscaleQueue());
  const { upscaleImage, isModelLoading } = useUpscaler();

  useEffect(() => {
    console.log('GlobalUpscaler, модель загружается:', isModelLoading);
    
    if (isModelLoading) {
      console.log('Модель ещё загружается, ожидание...');
      return;
    }

    const queue = queueRef.current;
    console.log('Очередь инициализирована');

    const processImage = async (img: HTMLImageElement) => {
      console.log('Processing image:', img.src);
      if (img.dataset.upscaleProcessed === 'true') {
        console.log('Изображение уже обработано, пропуск:', img.src);
        return;
      }
      
      try {
        img.dataset.upscaleProcessed = 'true';
        console.log('Начало обработки изображения:', img.src);
        
        if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
          console.log('Изображение не полностью загружено, ожидание загрузки:', img.src);
          await new Promise<void>((resolve, reject) => {
            const onLoad = () => {
              console.log('Изображение успешно загружено:', img.src);
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
              resolve();
            };
            
            const onError = () => {
              console.error('Не удалось загрузить изображение:', img.src);
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
              reject(new Error('Не удалось загрузить изображение'));
            };
            
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
            
            if (img.complete && (!img.naturalWidth || !img.naturalHeight)) {
              const currentSrc = img.src;
              img.src = '';
              img.src = currentSrc;
            }
          });
        }

        if (!img.naturalWidth || !img.naturalHeight) {
          throw new Error('Изображение не имеет допустимых размеров после загрузки');
        }

        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        console.log('Исходные размеры:', originalWidth, 'x', originalHeight);

        console.log('Вызов функции upscaleImage');
        const upscaledDataUrl = await upscaleImage(img);
        console.log('Результат увеличения:', upscaledDataUrl ? 'успех' : 'неудача');
        
        if (upscaledDataUrl) {
          const event = new CustomEvent<ImageUpscaledDetail>('imageUpscaled', {
            detail: {
              original: img.src,
              upscaled: upscaledDataUrl
            }
          });
          window.dispatchEvent(event);
          console.log('Событие imageUpscaled выпущено');

          const upscaledImg = new Image();
          upscaledImg.crossOrigin = 'anonymous';
          upscaledImg.src = upscaledDataUrl;
          
          await new Promise<void>((resolve, reject) => {
            upscaledImg.onload = () => resolve();
            upscaledImg.onerror = () => reject(new Error('Не удалось загрузить увеличенное изображение'));
          });
          
          upscaledImg.style.width = '100%';
          upscaledImg.style.height = 'auto';
          upscaledImg.alt = img.alt;
          upscaledImg.className = img.className;
          upscaledImg.dataset.upscale = 'true';
          upscaledImg.dataset.upscaleProcessed = 'true';
          
          if (img.parentNode) {
            img.parentNode.replaceChild(upscaledImg, img);
            console.log('Изображение заменено на увеличенную версию');
          }
        }
      } catch (error) {
        console.error('Не удалось увеличить изображение:', error);
        img.dataset.upscaleProcessed = 'false';
      }
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        console.log('Пересечение наблюдателя активировано с', entries.length, 'записями');
        entries.forEach((entry) => {
          const img = entry.target as HTMLImageElement;
          console.log('Пересечение изображения:', img.src, entry.isIntersecting ? 'видимый' : 'скрытый');
          
          if (!img.dataset.upscaleQueued) {
            console.log('Добавление изображения в очередь:', img.src);
            const task = () => processImage(img);
            queue.add(task);
            img.dataset.upscaleQueued = 'true';
          }
        });
      },
      {
        rootMargin: '500px 0px',
        threshold: 0
      }
    );

    // Find and observe all upscalable images
    const findAndObserveImages = () => {
      console.log('Поиск изображений для увеличения...');
      const images = document.querySelectorAll<HTMLImageElement>('img[data-upscale="true"]');
      console.log('Найдено', images.length, 'изображений для увеличения');
      
      images.forEach(img => {
        if (!img.dataset.upscaleObserved) {
          console.log('Наблюдение за новым изображением:', img.src);
          observerRef.current?.observe(img);
          img.dataset.upscaleObserved = 'true';
        }
      });
    };

    findAndObserveImages();

    const mutationObserver = new MutationObserver((mutations) => {
      console.log('DOM изменение');
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          console.log('Добавлены новые узлы, проверка на изображения для увеличения');
          findAndObserveImages();
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      console.log('Очистка GlobalUpscaler');
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      queue.clear();
    };
  }, [upscaleImage, isModelLoading]);

  return null;
};

export default GlobalUpscaler;