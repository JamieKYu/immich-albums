"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { createApiUrl } from "@/lib/basePath";

interface Photo {
  id: string;
  type?: string;
  [key: string]: unknown;
}

export default function PhotoGrid({ photos, albumId }: { photos: Photo[]; albumId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [hasTriggeredDeepLink, setHasTriggeredDeepLink] = useState(false);

  const isVideo = (type?: string) => {
    return type && type.toLowerCase().includes('video');
  };

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set([...prev, photoId]));
  };

  // Filter out videos - only show images
  const imagePhotos = photos.filter(photo => !isVideo(photo.type));

  // Handle deep linking - open carousel if assetId is in URL (only on initial load)
  useEffect(() => {
    const assetId = searchParams.get('assetId');
    if (assetId && imagePhotos.length > 0 && !hasTriggeredDeepLink) {
      const index = imagePhotos.findIndex(photo => photo.id === assetId);
      if (index !== -1) {
        setHasTriggeredDeepLink(true);
        // Find and click the corresponding image element
        setTimeout(() => {
          const imgElement = document.querySelector(`img[data-photo-id="${assetId}"]`) as HTMLElement;
          if (imgElement) {
            imgElement.click();
          }
        }, 100);
      }
    }
  }, [searchParams, imagePhotos, hasTriggeredDeepLink]);


  if (imagePhotos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="py-4 text-center">No photos in this album</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PhotoProvider
        onVisibleChange={(newVisible, index) => {
          if (newVisible && index !== undefined) {
            // Opening carousel - update URL
            const photo = imagePhotos[index];
            if (photo) {
              router.replace(`/albums/${albumId}?assetId=${photo.id}`, { scroll: false });
            }
          } else if (!newVisible) {
            // Closing carousel - clear URL
            router.replace(`/albums/${albumId}`, { scroll: false });
          }
        }}
        onIndexChange={(index) => {
          // Update URL with the new asset ID
          const photo = imagePhotos[index];
          if (photo) {
            router.replace(`/albums/${albumId}?assetId=${photo.id}`, { scroll: false });
          }
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 items-center">
          {imagePhotos.map((photo, idx) => {
            const thumbUrl = createApiUrl(`/thumbnail/${photo.id}`);
            const fullUrl = createApiUrl(`/asset/${photo.id}`);
            const isLoaded = loadedImages.has(photo.id);

            return (
              <div
                key={photo.id}
                className="relative group overflow-hidden"
              >
                {/* Loading skeleton - shows until image loads */}
                {!isLoaded && (
                  <div
                    className="w-full bg-gray-200 animate-pulse"
                    style={{
                      aspectRatio: '3/4',
                      minHeight: '200px'
                    }}
                  />
                )}

                <PhotoView src={fullUrl}>
                  <img
                    src={thumbUrl}
                    alt=""
                    data-photo-id={photo.id}
                    className={`w-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200 ${
                      isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                </PhotoView>
              </div>
            );
          })}
        </div>
      </PhotoProvider>
    </div>
  );
}
