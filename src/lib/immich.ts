import axios from "axios";

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

export async function getAlbum(id: string) {
  const { data } = await client.get(`/albums/${id}`);
  return data;
}
