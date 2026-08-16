import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { MediaModel } from "@/lib/database/models";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "beyond-buttons",
        resource_type: options.resourceType || "auto",
        transformation: options.transformation || [],
        context: options.context || {},
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    bufferToStream(buffer).pipe(stream);
  });
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Cloudinary not configured." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "beyond-buttons";
    const alt = formData.get("alt") || "";
    const type = formData.get("type") || "image";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "video/mp4", "video/webm"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: "File size exceeds 20MB limit." }, { status: 400 });
    }

    const resourceType = mimeType.startsWith("video/") ? "video" : "image";
    const uploadOptions = {
      folder,
      resourceType,
      context: { alt },
    };

    if (resourceType === "image") {
      uploadOptions.transformation = [
        { quality: "auto:good", fetch_format: "auto" },
        { width: 1920, height: 1920, crop: "limit" },
      ];
    }

    const result = await uploadToCloudinary(buffer, uploadOptions);

    await bootstrapDatabase();

    const mediaDoc = {
      id: `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      src: result.secure_url,
      alt,
      filename: file.name,
      mimeType,
      width: result.width,
      height: result.height,
      size: result.bytes,
      type: resourceType === "video" ? "video" : "image",
      cloudinaryId: result.public_id,
      cloudinaryVersion: result.version,
    };

    const created = await MediaModel.create(mediaDoc);

    return NextResponse.json({
      success: true,
      media: {
        id: created.id,
        src: created.src,
        alt: created.alt,
        filename: created.filename,
        mimeType: created.mimeType,
        width: created.width,
        height: created.height,
        size: created.size,
        type: created.type,
      },
    });
  } catch (error) {
    console.error("[media] Upload failed:", error);
    return NextResponse.json({ error: error?.message || "Upload failed." }, { status: 500 });
  }
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    await bootstrapDatabase();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const type = searchParams.get("type");
    const folder = searchParams.get("folder");
    const search = searchParams.get("search");

    const filter = {};
    if (type) filter.type = type;
    if (folder) filter.cloudinaryId = { $regex: `^${folder}/` };
    if (search) filter.$or = [{ filename: { $regex: search, $options: "i" } }, { alt: { $regex: search, $options: "i" } }];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MediaModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      MediaModel.countDocuments(filter).exec(),
    ]);

    return NextResponse.json({
      media: items.map((item) => ({
        id: item.id,
        src: item.src,
        alt: item.alt,
        filename: item.filename,
        mimeType: item.mimeType,
        width: item.width,
        height: item.height,
        size: item.size,
        type: item.type,
        cloudinaryId: item.cloudinaryId,
        createdAt: item.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[media] List failed:", error);
    return NextResponse.json({ error: "Unable to load media." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media ID required." }, { status: 400 });
    }

    await bootstrapDatabase();

    const media = await MediaModel.findOne({ id }).lean().exec();

    if (!media) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    if (media.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(media.cloudinaryId, { resource_type: media.type === "video" ? "video" : "image" });
      } catch (cloudinaryError) {
        console.warn("[media] Cloudinary delete failed:", cloudinaryError);
      }
    }

    await MediaModel.deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[media] Delete failed:", error);
    return NextResponse.json({ error: "Unable to delete media." }, { status: 500 });
  }
}