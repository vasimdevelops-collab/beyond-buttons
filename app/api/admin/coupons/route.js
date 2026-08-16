import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, CouponModel } from "@/lib/database/register";

function normalizeCoupon(doc) {
  return {
    id: doc.id || doc.code || `coupon-${Date.now()}`,
    code: doc.code || "",
    type: doc.type || "percent",
    value: Number(doc.value) || 0,
    active: doc.active !== false,
    endsAt: doc.endsAt || "",
    usageLimit: Number(doc.usageLimit) || 0,
    usedCount: Number(doc.usedCount) || 0,
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const docs = await CouponModel.find({}).sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json(docs.map(normalizeCoupon));
  } catch (error) {
    console.error("[admin/coupons] GET failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const doc = {
      id: body.id || `${code}-${Date.now()}`,
      code,
      type: body.type === "fixed" ? "fixed" : "percent",
      value: Number(body.value) || 0,
      active: body.active !== false,
      endsAt: body.endsAt || "",
      usageLimit: Number(body.usageLimit) || 0,
      usedCount: 0,
    };

    const created = await CouponModel.findOneAndUpdate(
      { id: doc.id },
      { $set: doc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeCoupon(created || doc));
  } catch (error) {
    console.error("[admin/coupons] POST failed:", error);
    return NextResponse.json({ error: "Unable to create coupon" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
    }

    await CouponModel.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/coupons] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete coupon" }, { status: 500 });
  }
}
