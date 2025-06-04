import React, { useRef, useState, useEffect } from 'react';

interface ImageComparisonProps {
  originalSrc: string;
  upscaledSrc: string;
  alt: string;
  className?: string;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalSrc,
  upscaledSrc,
  alt,
  className = ''
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relativeX = x - containerRect.left;
    const newPosition = (relativeX / containerRect.width) * 100;

    setPosition(Math.max(0, Math.min(100, newPosition)));
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleTouchMove = (e: TouchEvent) => handleMove(e);

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-col-resize ${className}`}
      onMouseDown={(e) => {
        isDragging.current = true;
        handleMove(e.nativeEvent);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        handleMove(e.nativeEvent);
      }}
    >
      <img
        src={originalSrc}
        alt={`Original ${alt}`}
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
      />

      <div
        className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={upscaledSrc}
          alt={`Upscaled ${alt}`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          style={{ width: `${100 * (100 / position)}%` }}
          crossOrigin="anonymous"
        />
      </div>

      <div
        className="absolute top-0 bottom-0"
        style={{ left: `${position}%` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white transform -translate-x-1/2">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Оригинал
      </div>
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Увеличенный
      </div>
    </div>
  );
};

export default ImageComparison; 