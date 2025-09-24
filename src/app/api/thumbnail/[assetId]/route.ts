import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

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
      console.warn(`Invalid thumbnail asset ID format attempted: ${assetId}`);
      return new NextResponse("Invalid asset ID format", { status: 400 });
    }

    // Create a stable ETag based on assetId (thumbnails don't change)
    const etag = `"thumb-${assetId}"`;

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

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

    // Create a stable Last-Modified date based on assetId (for consistent caching)
    const hash = crypto.createHash('md5').update(assetId).digest('hex');
    const timestamp = parseInt(hash.substring(0, 8), 16) % (365 * 24 * 60 * 60 * 1000); // Within last year
    const lastModified = new Date(Date.now() - timestamp).toUTCString();

    // Also check If-Modified-Since header
    const ifModifiedSince = request.headers.get('if-modified-since');
    if (ifModifiedSince === lastModified) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=2592000, immutable",
        "ETag": etag,
        "Expires": new Date(Date.now() + 2592000 * 1000).toUTCString(),
        "Last-Modified": lastModified,
        "Content-Length": buffer.length.toString(),
        "Vary": "Accept-Encoding",
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
