import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, MediaModel } from "@/lib/database/register";

function normalizeMedia(doc) {
  if (!doc) return null;

  const id = doc.id || doc._id?.toString() || `media-${Date.now()}`;

  // If the stored src is a raw data-URI, swap it for the served API URL.
  // This keeps the DB compact (consumers always go through the endpoint)
  // and avoids returning multi-MB base64 blobs in list responses.
  const rawSrc = doc.src || "";
  const src = rawSrc.startsWith("data:")
    ? `/api/media/${id}`
    : rawSrc;

  return {
    id,
    src,
    alt: doc.alt || "",
    filename: doc.filename || "",
    mimeType: doc.mimeType || "image/jpeg",
    width: Number(doc.width) || null,
    height: Number(doc.height) || null,
    size: Number(doc.size) || null,
    type: doc.type || "image",
    folderId: doc.folderId || "uncategorized",
    folderLabel: doc.folderLabel || "Uncategorized",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const docs = await MediaModel.find({}).sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json(docs.map(normalizeMedia).filter(Boolean));
  } catch (error) {
    console.error("[admin/media] GET failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();

    const rawSrc = String(body.src || "").trim();
    if (!rawSrc) {
      return NextResponse.json({ error: "Media src is required" }, { status: 400 });
    }

    const payload = {
      id: body.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      src: rawSrc,
      alt: String(body.alt || "").trim(),
      filename: String(body.filename || "uploaded-media").trim(),
      mimeType: String(body.mimeType || "image/jpeg").trim(),
      width: Number(body.width) || null,
      height: Number(body.height) || null,
      size: Number(body.size) || null,
      type: body.type === "video" ? "video" : body.type === "svg" ? "svg" : "image",
      folderId: String(body.folderId || "homepage").trim(),
      folderLabel: String(body.folderLabel || "Homepage").trim(),
    };

    const doc = await MediaModel.findOneAndUpdate(
      { id: payload.id },
      { $set: payload },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeMedia(doc || payload));
  } catch (error) {
    console.error("[admin/media] POST failed:", error);
    return NextResponse.json({ error: "Unable to create media asset" }, { status: 500 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Media id is required" }, { status: 400 });
    }

    const next = {
      src: String(body.src || "").trim(),
      alt: String(body.alt || "").trim(),
      filename: String(body.filename || "uploaded-media").trim(),
      mimeType: String(body.mimeType || "image/jpeg").trim(),
      width: Number(body.width) || null,
      height: Number(body.height) || null,
      size: Number(body.size) || null,
      type: body.type === "video" ? "video" : body.type === "svg" ? "svg" : "image",
      folderId: String(body.folderId || "homepage").trim(),
      folderLabel: String(body.folderLabel || "Homepage").trim(),
    };

    if (!next.src) {
      return NextResponse.json({ error: "Media src is required" }, { status: 400 });
    }

    const doc = await MediaModel.findOneAndUpdate(
      { id },
      { $set: next },
      { returnDocument: "after", upsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeMedia(doc || { id, ...next }));
  } catch (error) {
    console.error("[admin/media] PUT failed:", error);
    return NextResponse.json({ error: "Unable to update media asset" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing media id" }, { status: 400 });
    }

    await MediaModel.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/media] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete media asset" }, { status: 500 });
  }
}
