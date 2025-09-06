import axios from "axios";

const client = axios.create({
  baseURL: process.env.IMMICH_URL,
  headers: {
    "x-api-key": process.env.IMMICH_API_KEY,
  },
});

export async function GET() {
  try {
    const { data } = await client.get("/albums");
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return Response.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}
