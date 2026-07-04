import axios, { AxiosResponse } from "axios";

const client = axios.create({
  baseURL: process.env.IMMICH_URL,
  headers: {
    "x-api-key": process.env.IMMICH_API_KEY,
  },
});

export async function getAlbums() {
  const { data } = await client.get("/albums");
  return data;
}

// Immich v3 removed the embedded `assets` array from GET /albums/{id}, which now
// returns only metadata + assetCount. Assets are fetched via the metadata search
// endpoint and re-attached so consumers can keep reading `album.assets`.
interface MetadataSearchResponse {
  assets?: {
    items?: unknown[];
    nextPage?: string | null;
  };
}

async function getAlbumAssets(albumId: string, order?: string) {
  const assets: unknown[] = [];
  let page: number | null = 1;

  while (page) {
    const response: AxiosResponse<MetadataSearchResponse> = await client.post(
      "/search/metadata",
      {
        albumIds: [albumId],
        ...(order ? { order } : {}),
        page,
        size: 1000,
      }
    );
    const result = response.data.assets;
    if (result?.items?.length) {
      assets.push(...result.items);
    }
    page = result?.nextPage ? Number(result.nextPage) : null;
  }

  return assets;
}

export async function getAlbum(id: string) {
  const { data: album } = await client.get(`/albums/${id}`);
  const assets = await getAlbumAssets(id, album?.order);
  return { ...album, assets };
}
