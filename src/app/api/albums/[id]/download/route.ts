import { NextRequest, NextResponse } from "next/server";
import { getAlbum } from "@/lib/immich";

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

interface AlbumAsset {
  id: string;
}

// Build a safe Content-Disposition value. ASCII fallback for `filename`,
// RFC 5987 UTF-8 encoding for `filename*` so album names with accents/emoji
// still download with a sensible name.
function contentDisposition(name: string): string {
  const base = name.trim() || "album";
  const ascii = base.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(base);
  return `attachment; filename="${ascii}.zip"; filename*=UTF-8''${encoded}.zip`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      console.warn(`Invalid album ID format attempted: ${id}`);
      return new NextResponse("Invalid album ID format", { status: 400 });
    }

    const album = await getAlbum(id);
    const assetIds = ((album?.assets as AlbumAsset[] | undefined) ?? [])
      .map((asset) => asset.id)
      .filter(Boolean);

    if (assetIds.length === 0) {
      return new NextResponse("Album has no assets to download", { status: 404 });
    }

    // Immich's /download/archive takes explicit asset IDs (not an album ID) and
    // returns the ZIP as a single response. Stream it straight through so the
    // whole archive never has to sit in this server's memory.
    const immichResponse = await fetch(`${process.env.IMMICH_URL}/download/archive`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.IMMICH_API_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "application/octet-stream",
      },
      body: JSON.stringify({ assetIds, edited: false }),
    });

    if (!immichResponse.ok || !immichResponse.body) {
      console.error(
        `Immich archive request failed: ${immichResponse.status} ${immichResponse.statusText}`
      );
      return new NextResponse("Failed to build album archive", {
        status: immichResponse.status || 502,
      });
    }

    // Guard against a silent empty archive. Immich returns HTTP 200 with a
    // valid-but-empty 22-byte ZIP when it can't read the assets' original files
    // (e.g. a broken NAS mount) — download/info can't detect this since it only
    // reads DB metadata. A real archive begins with a local-file-header
    // signature (PK\x03\x04); an empty one is just an end-of-central-directory
    // record (PK\x05\x06). Peek the first bytes, then stream the rest untouched.
    const reader = immichResponse.body.getReader();
    const prefix: Uint8Array[] = [];
    let prefixLen = 0;
    let streamDone = false;
    while (prefixLen < 4 && !streamDone) {
      const { value, done } = await reader.read();
      if (value) {
        prefix.push(value);
        prefixLen += value.length;
      }
      streamDone = done;
    }

    const sig = new Uint8Array(4);
    let written = 0;
    for (const chunk of prefix) {
      for (let i = 0; i < chunk.length && written < 4; i++) sig[written++] = chunk[i];
    }
    const isEmptyArchive =
      prefixLen === 0 ||
      (sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 0x05 && sig[3] === 0x06);

    if (isEmptyArchive) {
      await reader.cancel();
      console.error(
        `Immich returned an empty archive for album ${id} (${assetIds.length} assets) — originals are likely unreadable on the server.`
      );
      return new NextResponse(
        "The album archive came back empty — Immich could not read the original files. Check the server's storage mounts.",
        { status: 502 }
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of prefix) controller.enqueue(chunk);
      },
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      },
      cancel(reason) {
        reader.cancel(reason);
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(album?.albumName ?? "album"),
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error downloading album:", errorMessage);
    return new NextResponse("Failed to download album", {
      status: (error as { response?: { status?: number } })?.response?.status || 500,
    });
  }
}
