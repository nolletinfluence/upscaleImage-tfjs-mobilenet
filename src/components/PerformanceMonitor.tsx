import React, { useState } from 'react';
import { useUpscaler } from '../hooks/useUpscaler';

const PerformanceMonitor: React.FC = () => {
  const { performance, resetPerformance, isGpuSupported } = useUpscaler();
  const [expanded, setExpanded] = useState(false);
  
  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  
  const metrics = [
    {
      name: 'Backend',
      value: isGpuSupported ? 'WebGL (GPU)' : 'WASM/CPU',
      color: isGpuSupported ? 'text-green-600' : 'text-yellow-600'
    },
    {
      name: 'Last Upscale Time',
      value: formatTime(performance.lastUpscaleTime),
      color: 'text-blue-600'
    },
    {
      name: 'Average Upscale Time',
      value: formatTime(performance.averageUpscaleTime),
      color: 'text-purple-600'
    }
  ];
  
  const memoryMetrics = performance.memoryUsage ? [
    {
      name: 'Tensors',
      value: performance.memoryUsage.numTensors || 0,
      color: 'text-orange-600'
    },
    {
      name: 'Data Buffers',
      value: performance.memoryUsage.numDataBuffers || 0,
      color: 'text-teal-600'
    },
    {
      name: 'Used Memory',
      value: formatBytes(performance.memoryUsage.numBytes || 0),
      color: 'text-pink-600'
    }
  ] : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Метрики производительности</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={resetPerformance}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm transition-colors"
          >
            Сбросить
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors"
          >
            {expanded ? 'Меньше' : 'Больше'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">{metric.name}</p>
            <p className={`text-xl font-semibold ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>
      
      {expanded && (
        <>
          <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Использование памяти</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memoryMetrics.map((metric) => (
              <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">{metric.name}</p>
                <p className={`text-xl font-semibold ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Советы по производительности</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Меньшие изображения увеличиваются быстрее и используют меньше памяти</li>
              <li>• Современные браузеры с поддержкой WebGL будут использовать GPU-ускорение</li>
              <li>• Обработка будет приостановлена автоматически, когда изображения выйдут за пределы вашего вида</li>
              <li>• Изображения обрабатываются последовательно для оптимизации использования ресурсов</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceMonitor;