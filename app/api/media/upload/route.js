/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data file upload. Stores the binary as a base64
 * payload in the Media collection and returns a stable served URL
 * (/api/media/[id]) as the asset's `src` — so the rest of the app
 * never stores raw data-URIs in MongoDB.
 *
 * Form fields:
 *   file     (required) — the uploaded file
 *   alt      (optional) — alt text
 *   folderId (optional) — media folder (default: "uncategorized")
 *
 * Max file size: 8 MB (enforced here; Next.js default body limit is 4 MB
 * for JSON but FormData uses streaming so it can be larger).
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, MediaModel } from "@/lib/database/register";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

const FOLDER_LABELS = {
  brand: "Brand",
  homepage: "Homepage",
  products: "Products",
  lifestyle: "Lifestyle",
  uncategorized: "Uncategorized",
};

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${MAX_FILE_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image and video files are supported." },
        { status: 415 }
      );
    }

    // Read the file as a Buffer and encode as base64 for storage.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const folderId = String(formData.get("folderId") || "uncategorized").trim();
    const alt = String(formData.get("alt") || file.name || "").trim();

    await bootstrapDatabase();

    // Store the data-URI in the `src` field temporarily. The GET /api/media/[id]
    // endpoint serves it back as the correct MIME type so the rest of the app
    // can use /api/media/[id] as a stable, browser-loadable URL.
    const servedUrl = `/api/media/${id}`;

    const doc = await MediaModel.findOneAndUpdate(
      { id },
      {
        $set: {
          id,
          // Store the raw data-URI so we can serve it from the DB.
          // External callers always use the `servedUrl` — never this field directly.
          src: dataUri,
          alt,
          filename: file.name || "uploaded-file",
          mimeType,
          width: null,
          height: null,
          size: file.size,
          type: isVideo ? "video" : "image",
          folderId,
          folderLabel: FOLDER_LABELS[folderId] || "Uncategorized",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    // Return the served URL as `src` — this is what the media library stores
    // in product records and what the storefront renders.
    return NextResponse.json({
      id: doc.id,
      src: servedUrl,
      alt: doc.alt,
      filename: doc.filename,
      mimeType: doc.mimeType,
      size: doc.size,
      type: doc.type,
      folderId: doc.folderId,
      folderLabel: doc.folderLabel,
    });
  } catch (error) {
    console.error("[media/upload] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
