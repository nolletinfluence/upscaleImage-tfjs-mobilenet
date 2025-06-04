import React, { useState, useEffect } from 'react';
import ImageComparison from './ImageComparison';

interface ProcessedImage {
  original: string;
  upscaled: string | null;
}

interface ImageUpscaledDetail {
  original: string;
  upscaled: string;
}

declare global {
  interface WindowEventMap {
    'imageUpscaled': CustomEvent<ImageUpscaledDetail>;
  }
}

const DemoGallery: React.FC = () => {
  const [processedImages, setProcessedImages] = useState<Record<string, ProcessedImage>>({});

  const handleImageUpscaled = (originalSrc: string, upscaledSrc: string) => {
    setProcessedImages(prev => ({
      ...prev,
      [originalSrc]: {
        original: originalSrc,
        upscaled: upscaledSrc
      }
    }));
  };

  useEffect(() => {
    const handleUpscaleComplete = (event: CustomEvent<ImageUpscaledDetail>) => {
      handleImageUpscaled(event.detail.original, event.detail.upscaled);
    };

    window.addEventListener('imageUpscaled', handleUpscaleComplete);

    return () => {
      window.removeEventListener('imageUpscaled', handleUpscaleComplete);
    };
  }, []);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      alt: "Mountain landscape",
      needsUpscale: true
    },
    {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
      alt: "Forest landscape",
      needsUpscale: false
    },
    {
      src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
      alt: "City landscape",
      needsUpscale: true
    },
    {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      alt: "Beach landscape",
      needsUpscale: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {images.map((image, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            {image.needsUpscale ? 'С увеличением' : 'Без увеличения'}
          </h3>
          <p className="text-gray-600 mb-4">
            {image.needsUpscale 
              ? 'Это изображение имеет data-upscale="true"' 
              : "Это изображение не имеет data-upscale"}
          </p>
          
          {image.needsUpscale ? (
            processedImages[image.src]?.upscaled ? (
              <ImageComparison
                originalSrc={image.src}
                upscaledSrc={processedImages[image.src].upscaled!}
                alt={image.alt}
                className="w-full h-64 rounded"
              />
            ) : (
              <img
                src={image.src}
                alt={image.alt}
                className="w-full rounded"
                data-upscale="true"
                crossOrigin="anonymous"
              />
            )
          ) : (
            <img
              src={image.src}
              alt={image.alt}
              className="w-full rounded"
              crossOrigin="anonymous"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default DemoGallery;