"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Header } from "@jamiekyu/website-header";
import PhotoGrid from "@/components/PhotoGrid";
import { createApiUrl } from "@/lib/basePath";

interface Photo {
  id: string;
  type?: string;
  [key: string]: unknown;
}

interface Album {
  id: string;
  albumName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  assets?: Photo[];
  [key: string]: unknown;
}

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(createApiUrl(`/albums/${id}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch album: ${response.statusText}`);
        }
        const albumData = await response.json();
        setAlbum(albumData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  // Format dates if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-200">
        <Header/>
        <div className="page-padding">
          <div className="max-w-7xl mx-auto">
            <div className="py-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-300 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4 w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-2">
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mb-1 bg-gray-300 animate-pulse break-inside-avoid" style={{ aspectRatio: '3/4', minHeight: '200px' }}></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-stone-200">
        <Header/>
        <div className="page-padding">
          <div className="max-w-7xl mx-auto">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-700">{error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!album) {
    return (
      <main className="min-h-screen bg-stone-200">
        <Header/>
        <div className="page-padding">
          <div className="max-w-7xl mx-auto">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-600 mb-4">Album not found</h1>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const startDate = formatDate(album.startDate);
  const endDate = formatDate(album.endDate);

  return (
    <main className="min-h-screen bg-stone-200">
      <Header/>
      <div className="page-padding">
        <div className="max-w-7xl mx-auto">
          <div className="pb-6">
            <h1 className="section-heading">
              {album.albumName}
            </h1>

            {/* Album metadata */}
            <div className="mb-8 text-gray-700 space-y-2">
              {/* Album description */}
              {album.description && (
                <p className="text-lg text-gray-700 pt-2">{album.description}</p>
              )}

              {/* Date range */}
              {startDate && endDate && startDate !== endDate && (
                <div className="flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {startDate} - {endDate}
                </div>
              )}

              {startDate && (!endDate || startDate === endDate) && (
                <div className="flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {startDate}
                </div>
              )}
            </div>

            <PhotoGrid photos={album.assets || []} />
          </div>
        </div>
      </div>
    </main>
  );
}
