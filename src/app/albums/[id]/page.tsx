import { getAlbum } from "@/lib/immich";
import PhotoGrid from "@/components/PhotoGrid";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);

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

  const startDate = formatDate(album.startDate);
  const endDate = formatDate(album.endDate);

  return (
    <main className="min-h-screen bg-stone-200">
      <div className="p-6">
        <h1 className="text-5xl font-bold text-left text-black font-caveat italic mb-4">
          {album.albumName}
        </h1>

        {/* Album metadata */}
        <div className="mb-4 text-gray-700 space-y-2">
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
      </div>

      <PhotoGrid photos={album.assets || []} />
    </main>
  );
}
