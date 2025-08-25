import { useState } from 'react';

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function ProductImageCarousel({ 
  images, 
  productName, 
  className = '' 
}: ProductImageCarouselProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayImages = images.length > 0 ? images : ['/images/placeholder-mattress.jpg'];
  const selectedImage = displayImages[selectedImageIndex];

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleImageClick = () => {
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className={`product-image-carousel ${className}`}>
      {/* Main Image */}
      <div className="relative mb-4 group">
        <img
          src={selectedImage}
          alt={`${productName} - 主圖`}
          className="w-full h-auto rounded-lg shadow-lg cursor-zoom-in transition-transform hover:scale-[1.02]"
          onClick={handleImageClick}
        />
        
        {/* Navigation arrows for main image (only show if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              aria-label="上一張圖片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              aria-label="下一張圖片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative overflow-hidden rounded border-2 transition-all hover:border-gray-400 ${
                index === selectedImageIndex 
                  ? 'border-black ring-2 ring-black/20' 
                  : 'border-gray-200'
              }`}
            >
              <img
                src={image}
                alt={`${productName} - 圖片 ${index + 1}`}
                className="w-full h-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox/Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseZoom}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl"
              aria-label="關閉放大檢視"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt={`${productName} - 放大檢視`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation in lightbox */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3"
                  aria-label="上一張圖片"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3"
                  aria-label="下一張圖片"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}