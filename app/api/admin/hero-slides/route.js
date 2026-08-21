import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, HeroSlideModel } from "@/lib/database/register";

function normalizeSlide(doc) {
  if (!doc) return null;

  return {
    id: doc.id || doc._id?.toString(),
    order: Number(doc.order) || 0,
    active: Boolean(doc.active),
    media: {
      id: doc.media?.id || "",
      src: doc.media?.src || "",
      alt: doc.media?.alt || "",
      type: doc.media?.type || "image",
    },
    headline: doc.headline || "",
    subtitle: doc.subtitle || "",
    ctaLabel: doc.ctaLabel || "",
    ctaHref: doc.ctaHref || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function makeSlideId() {
  return `hero-slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMediaInput(media) {
  if (!media || typeof media !== "object") return undefined;
  const src = String(media.src || "").trim();
  if (!src) return undefined;
  return {
    id: String(media.id || "").trim() || src,
    src,
    alt: String(media.alt || "").trim(),
    type: media.type === "video" ? "video" : "image",
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const docs = await HeroSlideModel.find({}).sort({ order: 1, createdAt: 1 }).lean().exec();
    return NextResponse.json(docs.map(normalizeSlide).filter(Boolean));
  } catch (error) {
    console.error("[admin/hero-slides] GET failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const media = toMediaInput(body.media);
    if (!media) {
      return NextResponse.json({ error: "Slide image is required" }, { status: 400 });
    }

    const last = await HeroSlideModel.findOne({}).sort({ order: -1 }).select("order").lean().exec();
    const nextOrder = last ? Number(last.order) + 1 : 0;

    const payload = {
      id: makeSlideId(),
      order: nextOrder,
      active: body.active !== false,
      media,
      headline: String(body.headline || "").trim(),
      subtitle: String(body.subtitle || "").trim(),
      ctaLabel: String(body.ctaLabel || "").trim(),
      ctaHref: String(body.ctaHref || "").trim(),
    };

    const doc = await HeroSlideModel.create(payload);
    return NextResponse.json(normalizeSlide(doc.toObject()), { status: 201 });
  } catch (error) {
    console.error("[admin/hero-slides] POST failed:", error);
    return NextResponse.json({ error: "Unable to create hero slide" }, { status: 500 });
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
      return NextResponse.json({ error: "Slide id is required" }, { status: 400 });
    }

    const next = {};
    if ("active" in body) next.active = Boolean(body.active);
    if ("order" in body) next.order = Number(body.order) || 0;
    if ("headline" in body) next.headline = String(body.headline || "").trim();
    if ("subtitle" in body) next.subtitle = String(body.subtitle || "").trim();
    if ("ctaLabel" in body) next.ctaLabel = String(body.ctaLabel || "").trim();
    if ("ctaHref" in body) next.ctaHref = String(body.ctaHref || "").trim();
    if (body.media !== undefined) {
      const media = toMediaInput(body.media);
      if (media) next.media = media;
    }

    const doc = await HeroSlideModel.findOneAndUpdate(
      { id },
      { $set: next },
      { returnDocument: "after" }
    ).lean().exec();

    if (!doc) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeSlide(doc));
  } catch (error) {
    console.error("[admin/hero-slides] PUT failed:", error);
    return NextResponse.json({ error: "Unable to update hero slide" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing slide id" }, { status: 400 });
    }

    await HeroSlideModel.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/hero-slides] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete hero slide" }, { status: 500 });
  }
}