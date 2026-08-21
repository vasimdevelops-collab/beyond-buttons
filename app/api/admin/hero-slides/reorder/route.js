import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, HeroSlideModel } from "@/lib/database/register";

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const slides = Array.isArray(body?.slides) ? body.slides : [];

    if (!slides.length) {
      return NextResponse.json({ error: "Slides list is required" }, { status: 400 });
    }

    await Promise.all(
      slides.map((slide) => {
        const id = String(slide.id || "").trim();
        if (!id) return null;
        return HeroSlideModel.updateOne(
          { id },
          { $set: { order: Number(slide.order) || 0 } }
        ).exec();
      })
    );

    const docs = await HeroSlideModel.find({}).sort({ order: 1, createdAt: 1 }).lean().exec();
    return NextResponse.json({ ok: true, slides: docs });
  } catch (error) {
    console.error("[admin/hero-slides/reorder] PUT failed:", error);
    return NextResponse.json({ error: "Unable to reorder hero slides" }, { status: 500 });
  }
}