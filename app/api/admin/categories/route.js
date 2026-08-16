import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, CategoryModel } from "@/lib/database/register";

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

function normalizeDocument(doc) {
  return {
    id: doc.id || doc.slug || "category",
    name: doc.name || "Untitled category",
    slug: doc.slug || slugify(doc.name),
    description: doc.description || "",
    visibility: doc.visibility !== false,
    order: Number(doc.order) || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const docs = await CategoryModel.find({}).sort({ order: 1, createdAt: -1 }).lean().exec();
    return NextResponse.json(docs.map(normalizeDocument));
  } catch (error) {
    console.error("[admin/categories] GET failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const slug = slugify(body.slug || body.name);
    const doc = {
      id: body.id || `${slug}-${Date.now()}`,
      name: String(body.name || "Untitled category").trim(),
      slug,
      description: String(body.description || "").trim(),
      visibility: body.visibility !== false,
      order: Number(body.order) || 0,
    };

    const created = await CategoryModel.findOneAndUpdate(
      { id: doc.id },
      { $set: doc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeDocument(created || doc));
  } catch (error) {
    console.error("[admin/categories] POST failed:", error);
    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const slug = slugify(body.slug || body.name);
    const update = {
      name: String(body.name || "Untitled category").trim(),
      slug,
      description: String(body.description || "").trim(),
      visibility: body.visibility !== false,
      order: Number(body.order) || 0,
    };

    const doc = await CategoryModel.findOneAndUpdate(
      { id: body.id },
      { $set: update },
      { returnDocument: "after", upsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeDocument(doc || { ...update, id: body.id || slug }));
  } catch (error) {
    console.error("[admin/categories] PUT failed:", error);
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing category id" }, { status: 400 });
    }

    await CategoryModel.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/categories] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete category" }, { status: 500 });
  }
}
