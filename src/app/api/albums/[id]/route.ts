import { NextRequest, NextResponse } from "next/server";
import { getAlbum } from "@/lib/immich";

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate id is a proper UUID
    if (!isValidUUID(id)) {
      console.warn(`Invalid album ID format attempted: ${id}`);
      return new NextResponse("Invalid album ID format", { status: 400 });
    }

    const album = await getAlbum(id);
    
    return NextResponse.json(album);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching album:", errorMessage);
    return new NextResponse("Album not found", {
      status: (error as { response?: { status?: number } })?.response?.status || 404
    });
  }
}