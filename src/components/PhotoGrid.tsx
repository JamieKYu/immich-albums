"use client";
import { useState } from "react";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { createApiUrl } from "@/lib/basePath";

interface Photo {
  id: string;
  type?: string;
  [key: string]: unknown;
}

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const isVideo = (type?: string) => {
    return type && type.toLowerCase().includes('video');
  };

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set([...prev, photoId]));
  };

  // Filter out videos - only show images
  const imagePhotos = photos.filter(photo => !isVideo(photo.type));


  if (imagePhotos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="py-4 text-center">No photos in this album</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PhotoProvider>
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-1">
          {imagePhotos.map((photo) => {
            const thumbUrl = createApiUrl(`/thumbnail/${photo.id}`);
            const fullUrl = createApiUrl(`/asset/${photo.id}`);
            const isLoaded = loadedImages.has(photo.id);

            return (
              <div
                key={photo.id}
                className="break-inside-avoid mb-1 relative group overflow-hidden"
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
