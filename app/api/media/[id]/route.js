/**
 * GET /api/media/[id]
 *
 * Streams a media asset stored in the Media collection back to the browser.
 * Assets are stored as data-URIs in the `src` field; this endpoint parses
 * the data-URI and responds with the raw binary and correct Content-Type,
 * so /api/media/[id] is a stable, browser-loadable URL.
 *
 * Cache headers: immutable for 1 year (the ID is unique per upload).
 */

import { NextResponse } from "next/server";

import { bootstrapDatabase, MediaModel } from "@/lib/database/register";

export async function GET(request, { params }) {
  try {
    const id = String((await params)?.id || "");
    if (!id) {
      return new NextResponse("Not found", { status: 404 });
    }

    await bootstrapDatabase();
    const doc = await MediaModel.findOne({ id }).lean().exec();

    if (!doc) {
      return new NextResponse("Not found", { status: 404 });
    }

    const src = doc.src || "";

    // If src is a data-URI (new upload format), parse and serve it.
    if (src.startsWith("data:")) {
      const [header, base64] = src.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");
      const buffer = Buffer.from(base64, "base64");

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType || doc.mimeType || "application/octet-stream",
          "Content-Length": String(buffer.length),
          // Immutable — the ID is a unique timestamp-based hash.
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Media-Id": id,
        },
      });
    }

    // If src is an external URL, redirect to it.
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return NextResponse.redirect(src, { status: 302 });
    }

    return new NextResponse("Media not available", { status: 404 });
  } catch (error) {
    console.error("[media] GET failed:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
