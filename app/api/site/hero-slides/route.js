import { NextResponse } from "next/server";

import { bootstrapDatabase, HeroSlideModel } from "@/lib/database/register";

function normalizeSlide(doc) {
  if (!doc) return null;

  return {
    id: doc.id || doc._id?.toString(),
    order: Number(doc.order) || 0,
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
  };
}

export async function GET() {
  try {
    await bootstrapDatabase();
    const docs = await HeroSlideModel.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()
      .exec();
    return NextResponse.json({ slides: docs.map(normalizeSlide).filter(Boolean) });
  } catch (error) {
    console.error("[site/hero-slides] GET failed:", error);
    return NextResponse.json({ slides: [] }, { status: 200 });
  }
}