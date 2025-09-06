import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;

    const baseUrl = process.env.IMMICH_URL;
    const response = await axios.get(
      `${baseUrl}/assets/${assetId}/thumbnail`,
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
    const errorStatus = (error as { response?: { status?: number } })?.response?.status;
    console.error("Error fetching thumbnail:", {
      assetId: (await params).assetId,
      error: errorMessage,
      status: errorStatus,
    });
    return new NextResponse("Thumbnail not found", {
      status: errorStatus || 404
    });
  }
}
