import { getAlbum } from "@/lib/immich";
import PhotoGrid from "@/components/PhotoGrid";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  
  return (
    <main className="min-h-screen bg-stone-200">
      <h1 className="text-4xl font-bold p-6 text-left text-black font-caveat italic">{album.albumName}</h1>
      <PhotoGrid photos={album.assets || []} />
    </main>
  );
}
