import * as tf from '@tensorflow/tfjs';

/**
 * @param modelUrl
 * @returns
 */
export async function loadModel(modelUrl: string): Promise<tf.GraphModel> {
  try {
    const model = await tf.loadGraphModel(modelUrl, {
      onProgress: (fraction) => {
        console.log(`Прогресс загрузки модели: ${Math.round(fraction * 100)}%`);
      }
    });
    
    const dummyInput = tf.zeros([1, 64, 64, 3]);
    const warmupResult = model.predict(dummyInput) as tf.Tensor;
    
    tf.dispose([dummyInput, warmupResult]);
    
    console.log('Модель загружена успешно');
    return model;
  } catch (error) {
    console.error('Ошибка загрузки модели:', error);
    throw new Error(`Не удалось загрузить модель: ${(error as Error).message}`);
  }
}

/**
 * @returns
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * @returns
 */
export function isWasmSupported(): boolean {
  return typeof WebAssembly === 'object' && 
         typeof WebAssembly.instantiate === 'function';
}

/**
  @returns
 */
export function getBestBackend(): string {
  if (isWebGLSupported()) {
    return 'webgl';
  } else if (isWasmSupported()) {
    return 'wasm';
  } else {
    return 'cpu';
  }
}