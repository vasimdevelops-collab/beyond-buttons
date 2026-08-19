/**
 * POST /api/media/upload
 *
 * Accepts a multipart/form-data file upload.
 *
 * When Cloudinary is configured (CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +
 * CLOUDINARY_API_SECRET), the file is uploaded there and the returned secure
 * URL is stored as `src`. When it is not configured, the file is stored as a
 * base64 payload in the Media collection and served via /api/media/[id] —
 * so the rest of the app never stores raw data-URIs in product records.
 *
 * Form fields:
 *   file     (required) — the uploaded file
 *   alt      (optional) — alt text
 *   folderId (optional) — media folder (default: "uncategorized")
 *
 * Max file size: 8 MB.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, MediaModel } from "@/lib/database/register";
import { getCloudinary, cloudinaryFolderFor } from "@/lib/media/cloudinary";

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const folderId = String(formData.get("folderId") || "uncategorized").trim();
    const alt = String(formData.get("alt") || file.name || "").trim();

    await bootstrapDatabase();

    // ── Try Cloudinary first ─────────────────────────────────────────────
    const cloudinary = getCloudinary();
    let storedSrc = dataUri;
    let cloudinaryId = "";
    let width = null;
    let height = null;

    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: cloudinaryFolderFor(folderId),
          resource_type: isVideo ? "video" : "image",
          overwrite: false,
        });
        storedSrc = result.secure_url || storedSrc;
        cloudinaryId = result.public_id || "";
        width = Number(result.width) || null;
        height = Number(result.height) || null;
      } catch (cloudError) {
        console.error(
          "[media/upload] Cloudinary upload failed, falling back to DB storage:",
          cloudError
        );
      }
    }

    // Consumers always get a stable URL: Cloudinary URL directly, or the
    // served /api/media/[id] endpoint for base64 fallback assets.
    const servedUrl = storedSrc.startsWith("data:")
      ? `/api/media/${id}`
      : storedSrc;

    const doc = await MediaModel.findOneAndUpdate(
      { id },
      {
        $set: {
          id,
          src: storedSrc,
          alt,
          filename: file.name || "uploaded-file",
          mimeType,
          width,
          height,
          size: file.size,
          type: isVideo ? "video" : "image",
          folderId,
          folderLabel: FOLDER_LABELS[folderId] || "Uncategorized",
          cloudinaryId: cloudinaryId || undefined,
          cloudinaryVersion: undefined,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    return NextResponse.json({
      id: doc.id,
      src: servedUrl,
      alt: doc.alt,
      filename: doc.filename,
      mimeType: doc.mimeType,
      width: doc.width,
      height: doc.height,
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