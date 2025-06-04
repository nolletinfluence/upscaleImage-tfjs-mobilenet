import { Github } from 'lucide-react';
import UpscalerProvider from './context/UpscalerContext';
import GlobalUpscaler from './utils/GlobalUpscaler';
import DemoGallery from './components/DemoGallery';
import PerformanceMonitor from './components/PerformanceMonitor';

function App() {
  return (
    <UpscalerProvider>
      <GlobalUpscaler />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <section className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              AI-Powered Image Upscaler
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Использую TensorFlow.js - модель MobileNet для увеличения качества изображений.
            </p>
            
            <div className="flex justify-center mt-8">
              <a href="https://github.com/nolletinfluence/upscaleImage-tfjs-mobilenet" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-blue-500 transition-colors">
                <Github size={20} />
                Репозиторий
              </a>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Галерея</h2>
            <DemoGallery />
          </section>
          
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Мониторинг производительности</h2>
            <PerformanceMonitor />
          </section>
        </main>
      </div>
    </UpscalerProvider>
  );
}

export default App;