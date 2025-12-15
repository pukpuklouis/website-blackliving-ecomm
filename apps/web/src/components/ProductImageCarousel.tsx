import { useState } from "react";

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function ProductImageCarousel({
  images,
  productName,
  className = "",
}: ProductImageCarouselProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayImages =
    images.length > 0 ? images : ["/images/placeholder-mattress.jpg"];
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
      <div className="group relative mb-4">
        <img
          alt={`${productName} - 主圖`}
          className="h-auto w-full cursor-zoom-in rounded-lg shadow-lg transition-transform hover:scale-[1.02]"
          onClick={handleImageClick}
          src={selectedImage}
        />

        {/* Navigation arrows for main image (only show if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              aria-label="上一張圖片"
              className="-translate-y-1/2 absolute top-1/2 left-2 rounded-full bg-white/80 p-2 text-gray-800 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
              onClick={handlePrevious}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <button
              aria-label="下一張圖片"
              className="-translate-y-1/2 absolute top-1/2 right-2 rounded-full bg-white/80 p-2 text-gray-800 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100"
              onClick={handleNext}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-sm text-white">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((image, index) => (
            <button
              className={`relative overflow-hidden rounded border-2 transition-all hover:border-gray-400 ${
                index === selectedImageIndex
                  ? "border-black ring-2 ring-black/20"
                  : "border-gray-200"
              }`}
              key={index}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                alt={`${productName} - 圖片 ${index + 1}`}
                className="h-20 w-full object-cover"
                src={image}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox/Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-h-full max-w-4xl">
            <button
              aria-label="關閉放大檢視"
              className="-top-12 absolute right-0 text-white text-xl hover:text-gray-300"
              onClick={handleCloseZoom}
            >
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <img
              alt={`${productName} - 放大檢視`}
              className="max-h-full max-w-full object-contain"
              src={selectedImage}
            />

            {/* Navigation in lightbox */}
            {displayImages.length > 1 && (
              <>
                <button
                  aria-label="上一張圖片"
                  className="-translate-y-1/2 absolute top-1/2 left-4 rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
                  onClick={handlePrevious}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15 19l-7-7 7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </button>
                <button
                  aria-label="下一張圖片"
                  className="-translate-y-1/2 absolute top-1/2 right-4 rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
                  onClick={handleNext}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
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
