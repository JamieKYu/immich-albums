"use client";
import Link from "next/link";

interface Album {
  id: string;
  albumName: string;
  albumThumbnailAssetId: string;
  [key: string]: unknown;
}

export default function AlbumGrid({ albums }: { albums: Album[] }) {
  // Generate deterministic rotation based on album ID
  const getRotation = (albumId: string) => {
    let hash = 0;
    for (let i = 0; i < albumId.length; i++) {
      const char = albumId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return (Math.abs(hash) % 600) / 100 - 3; // Range: -3 to 3 degrees
  };

  const getTextRotation = (albumId: string) => {
    let hash = 0;
    for (let i = 0; i < albumId.length; i++) {
      const char = albumId.charCodeAt(i);
      hash = ((hash << 3) - hash) + char;
      hash = hash & hash;
    }
    return (Math.abs(hash) % 400) / 100 - 2; // Range: -2 to 2 degrees
  };

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-6 p-6 space-y-6">
      {albums.map((album) => (
        <Link key={album.id} href={`/albums/${album.id}`}>
          <div 
            className="cursor-pointer break-inside-avoid mb-6 transform hover:scale-105 transition-all duration-300 hover:rotate-1"
            style={{
              transform: `rotate(${getRotation(album.id)}deg)`,
              filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))'
            }}
          >
            {/* Polaroid Frame */}
            <div className="bg-white p-3 pb-16 rounded-sm shadow-xl border border-gray-200">
              {/* Photo */}
              <div className="bg-gray-100 p-1 rounded-sm">
                <img
                  src={`/api/thumbnail/${album.albumThumbnailAssetId}`}
                  alt={album.albumName}
                  className="w-full object-cover rounded-sm"
                  style={{ aspectRatio: 'auto' }}
                />
              </div>
              
              {/* Handwritten Caption */}
              <div className="pt-4 px-2">
                <p 
                  className="text-center text-gray-700 leading-relaxed transform font-kalam italic"
                  style={{
                    fontSize: '18px',
                    fontWeight: '400',
                    transform: `rotate(${getTextRotation(album.id)}deg)`,
                    textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)'
                  }}
                >
                  {album.albumName}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
