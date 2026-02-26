import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;

    // Validate assetId is a proper UUID
    if (!isValidUUID(assetId)) {
      console.warn(`Invalid asset ID format attempted: ${assetId}`);
      return new NextResponse("Invalid asset ID format", { status: 400 });
    }

    // Create a stable ETag based on assetId (assets don't change)
    const etag = `"asset-${assetId}"`;

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const baseUrl = process.env.IMMICH_URL;
    const response = await axios.get(
      `${baseUrl}/assets/${assetId}/thumbnail?size=preview`,
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
        "Cache-Control": "public, max-age=31536000, immutable", // 1 year, immutable
        "ETag": etag,
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
