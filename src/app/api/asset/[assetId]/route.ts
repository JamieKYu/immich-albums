import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;

    const baseUrl = process.env.IMMICH_URL;
    const response = await axios.get(
      `${baseUrl}/assets/${assetId}/original`,
      {
        headers: {
          "x-api-key": process.env.IMMICH_API_KEY,
          "Accept": "application/octet-stream",
        },
        responseType: "arraybuffer",
      }
    );

    const buffer = Buffer.from(response.data);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching asset:", errorMessage);
    return new NextResponse("Asset not found", {
      status: (error as { response?: { status?: number } })?.response?.status || 404
    });
  }
}
