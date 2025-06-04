import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useUpscaler } from '../hooks/useUpscaler';

interface UpscalableImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  showComparison?: boolean;
}

const UpscalableImage: React.FC<UpscalableImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  showComparison = false,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  
  const { isIntersecting } = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '100px',
  });
  
  const { upscaleImage, isModelLoading } = useUpscaler();
  
  const [upscaledSrc, setUpscaledSrc] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [comparisonValue, setComparisonValue] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setComparisonValue(percentage);
  }, []);

  useEffect(() => {
    if (showComparison && upscaledSrc) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [showComparison, upscaledSrc, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    let isMounted = true;
    
    const processImage = async () => {
      if (!imageRef.current || isModelLoading || isUpscaling || upscaledSrc) return;
      
      try {
        setIsUpscaling(true);
        setError(null);
        
        if (!imageRef.current.complete) {
          await new Promise<void>((resolve) => {
            if (imageRef.current) {
              imageRef.current.onload = () => resolve();
              imageRef.current.onerror = () => {
                throw new Error('Failed to load image');
              };
            }
          });
        }
        
        const result = await upscaleImage(imageRef.current);
        
        if (isMounted) {
          if (result) {
            setUpscaledSrc(result);
          } else {
            setError('Failed to upscale image');
          }
          setIsUpscaling(false);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setIsUpscaling(false);
        }
      }
    };
    
    if (isIntersecting && !upscaledSrc) {
      processImage();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isIntersecting, upscaleImage, isModelLoading, isUpscaling, upscaledSrc]);
    
  useEffect(() => {
    setUpscaledSrc(null);
    setIsUpscaling(false);
    setError(null);
  }, [src]);
  
  if (showComparison) {
    return (
      <div 
        ref={containerRef}
        className="relative inline-block select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >

        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-opacity duration-300`}
          data-upscale="true"
          crossOrigin="anonymous"
        />
        
        {upscaledSrc && (
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ 
              clipPath: `inset(0 ${100 - comparisonValue}% 0 0)`
            }}
          >
            <img
              src={upscaledSrc}
              alt={`${alt} (upscaled)`}
              width={width}
              height={height}
              className={className}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {upscaledSrc && (
          <>
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
              style={{ left: `${comparisonValue}%` }}
            />
            
            <div
              className="absolute w-8 h-8 rounded-full bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
              style={{ 
                left: `${comparisonValue}%`, 
                top: '50%', 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-1 h-4 bg-gray-400 rounded-full mx-0.5" />
              <div className="w-1 h-4 bg-gray-400 rounded-full mx-0.5" />
            </div>

            <div className="absolute bottom-4 left-4 text-white text-sm font-medium shadow-sm pointer-events-none">OFF</div>
            <div className="absolute bottom-4 right-4 text-white text-sm font-medium shadow-sm pointer-events-none">ON</div>
          </>
        )}

        {isUpscaling && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-40">
            <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
                <span className="text-sm font-medium">Upscaling...</span>
              </div>
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs p-1 text-center">
            {error}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative inline-block">
      <img
        ref={imageRef}
        src={upscaledSrc || src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-all duration-500 ${isUpscaling ? 'blur-sm' : ''}`}
        data-upscale="true"
        crossOrigin="anonymous"
      />
      
      {isUpscaling && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-sm font-medium">Upscaling...</span>
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs p-1 text-center">
          {error}
        </div>
      )}
      
      {upscaledSrc && !isUpscaling && !showComparison && (
        <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full opacity-80 hover:opacity-100 transition-opacity">
          Upscaled
        </div>
      )}
    </div>
  );
};

export default UpscalableImage;