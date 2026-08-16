import { NextResponse } from "next/server";

import { bootstrapDatabase } from "@/lib/database/register";
import { CouponModel } from "@/lib/database/models";

function nowMs() {
  return Date.now();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "").trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Enter a coupon code." },
        { status: 400 }
      );
    }

    await bootstrapDatabase();
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      active: true,
    }).lean().exec();

    if (!coupon) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Coupon not found or inactive." },
        { status: 404 }
      );
    }

    const now = nowMs();
    const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null;
    const endsAt = coupon.endsAt ? new Date(coupon.endsAt).getTime() : null;

    if (startsAt && now < startsAt) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Coupon is not active yet." },
        { status: 400 }
      );
    }

    if (endsAt && now > endsAt) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Coupon has expired." },
        { status: 400 }
      );
    }

    const minSubtotal = Number(coupon.minSubtotal || 0);
    const subtotal = Number(body?.subtotal || 0);
    if (subtotal > 0 && subtotal < minSubtotal) {
      return NextResponse.json(
        {
          valid: false,
          discount: 0,
          message: `Minimum order value for this coupon is ₹${minSubtotal}.`,
        },
        { status: 400 }
      );
    }

    const usageLimit = Number(coupon.usageLimit || 0);
    if (usageLimit > 0 && Number(coupon.usedCount || 0) >= usageLimit) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Coupon usage limit reached." },
        { status: 400 }
      );
    }

    const value = Number(coupon.value || 0);
    const discount = coupon.type === "percent" ? (subtotal > 0 ? (subtotal * value) / 100 : 0) : value;

    return NextResponse.json({
      valid: true,
      discount: Math.max(0, discount),
      message: "Coupon applied successfully.",
      type: coupon.type,
      value,
    });
  } catch (error) {
    console.error("[coupons] Validation failed:", error);
    return NextResponse.json(
      { valid: false, discount: 0, message: "Unable to validate coupon." },
      { status: 500 }
    );
  }
}
