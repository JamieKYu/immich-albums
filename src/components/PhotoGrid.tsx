"use client";
import { useState, useEffect, useRef } from "react";
import { createApiUrl } from "@/lib/basePath";

interface Photo {
  id: string;
  type?: string;
  [key: string]: unknown;
}

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Cache for precomputed URLs to prevent refetching
  const [assetUrls] = useState<Map<string, string>>(() => {
    const urlMap = new Map<string, string>();
    photos.forEach(photo => {
      urlMap.set(photo.id, createApiUrl(`/asset/${photo.id}`));
    });
    return urlMap;
  });

  // Track prefetched images to avoid duplicates - use useRef to persist across renders
  const prefetchedImages = useRef<Set<string>>(new Set());

  // Prefetch adjacent images
  const prefetchImage = (photoId: string) => {
    if (prefetchedImages.current.has(photoId)) {
      console.log(`Skipping prefetch for ${photoId} - already prefetched`);
      return; // Already prefetched
    }

    const url = assetUrls.get(photoId);
    if (url) {
      console.log(`Prefetching image: ${photoId} -> ${url}`);

      // Mark as prefetched immediately to prevent duplicates
      prefetchedImages.current.add(photoId);

      // Use Image() for prefetching (simpler and more reliable)
      const img = new Image();
      img.onload = () => console.log(`Prefetch completed: ${photoId}`);
      img.onerror = () => console.log(`Prefetch failed: ${photoId}`);
      img.src = url;
    }
  };

  const prefetchAdjacentImages = (index: number) => {
    console.log(`Prefetching adjacent images for index ${index}`);
    // Prefetch next 2 images
    for (let i = 1; i <= 2 && index + i < photos.length; i++) {
      prefetchImage(photos[index + i].id);
    }
    // Prefetch previous 2 images
    for (let i = 1; i <= 2 && index - i >= 0; i++) {
      prefetchImage(photos[index - i].id);
    }
  };

  const openLightbox = (photoId: string, index: number) => {
    const fullUrl = assetUrls.get(photoId);
    if (fullUrl) {
      setSelectedImage(fullUrl);
      setCurrentIndex(index);
      // Prefetch adjacent images when lightbox opens
      prefetchAdjacentImages(index);
    }
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextUrl = assetUrls.get(photos[nextIndex].id);
      if (nextUrl) {
        setSelectedImage(nextUrl);
        // Only prefetch the next image in the direction we're going
        if (nextIndex + 1 < photos.length) {
          prefetchImage(photos[nextIndex + 1].id);
        }
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevUrl = assetUrls.get(photos[prevIndex].id);
      if (prevUrl) {
        setSelectedImage(prevUrl);
        // Only prefetch the previous image in the direction we're going
        if (prevIndex - 1 >= 0) {
          prefetchImage(photos[prevIndex - 1].id);
        }
      }
    }
  };

  // Handle touch events for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      e.stopPropagation(); // Prevent closing the lightbox when swiping
      if (isLeftSwipe) {
        goToNext();
      }
      if (isRightSwipe) {
        goToPrevious();
      }
    }
  };

  // Handle keyboard events with useEffect for global event listener
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape') {
        setSelectedImage(null);
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on unmount or when lightbox closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, currentIndex, photos]);

  const isVideo = (type?: string) => {
    return type && type.toLowerCase().includes('video');
  };

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set([...prev, photoId]));
  };

  if (photos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 text-center">No photos in this album</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-1">
        {photos.map((photo, index) => {
          const thumbUrl = createApiUrl(`/thumbnail/${photo.id}`);
          const isVideoAsset = isVideo(photo.type);
          const isLoaded = loadedImages.has(photo.id);

          return (
            <div
              key={photo.id}
              className="cursor-pointer break-inside-avoid mb-1 relative group overflow-hidden hover:opacity-90 transition-opacity duration-200"
              onClick={() => openLightbox(photo.id, index)}
            >
              {/* Loading skeleton - shows until image loads */}
              {!isLoaded && (
                <div 
                  className="w-full bg-gray-200 animate-pulse"
                  style={{ 
                    aspectRatio: '3/4', // Standard photo aspect ratio
                    minHeight: '200px' 
                  }}
                />
              )}
              
              <img
                src={thumbUrl}
                alt=""
                className={`w-full object-cover transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                loading="lazy"
                onLoad={() => handleImageLoad(photo.id)}
              />
              
              {/* Video overlay indicator */}
              {isVideoAsset && isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black bg-opacity-60 rounded-full p-2">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14.181 10.832a1 1 0 000-1.664l-4.626-2.832z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Custom Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ padding: '20px' }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {isVideo(photos[currentIndex]?.type) ? (
              <video
                src={selectedImage}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: 'calc(100vh - 40px)', maxWidth: 'calc(100vw - 40px)' }}
              />
            ) : (
              <img
                src={selectedImage}
                alt=""
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: 'calc(100vh - 40px)', maxWidth: 'calc(100vw - 40px)' }}
              />
            )}
            
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-90 z-10"
            >
              ×
            </button>
            
            {/* Previous button */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl bg-black bg-opacity-70 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 z-10"
              >
                ‹
              </button>
            )}
            
            {/* Next button */}
            {currentIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl bg-black bg-opacity-70 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 z-10"
              >
                ›
              </button>
            )}
            
            {/* Media counter */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 px-3 py-1 rounded z-10">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}