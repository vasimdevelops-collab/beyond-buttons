/**
 * GET  /api/admin/orders           — paginated list with optional filters
 * Query params:
 *   page          (default 1)
 *   limit         (default 50, max 200)
 *   paymentStatus (pending | paid | failed | refunded)
 *   shippingStatus (pending | processing | shipped | delivered | cancelled)
 *   search        (matches orderNumber or customer fullName)
 *   sort          (createdAt_desc | createdAt_asc | total_desc | total_asc)
 *                 defaults to createdAt_desc
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";

const SORT_MAP = {
  createdAt_desc: { createdAt: -1 },
  createdAt_asc: { createdAt: 1 },
  total_desc: { total: -1 },
  total_asc: { total: 1 },
};

const VALID_PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);
const VALID_SHIPPING_STATUSES = new Set([
  "pending", "processing", "shipped", "delivered", "cancelled",
]);

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const shippingStatus = searchParams.get("shippingStatus") || "";
    const search = String(searchParams.get("search") || "").trim();
    const sort = SORT_MAP[searchParams.get("sort") || ""] || SORT_MAP.createdAt_desc;

    const filter = {};

    if (paymentStatus && VALID_PAYMENT_STATUSES.has(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }
    if (shippingStatus && VALID_SHIPPING_STATUSES.has(shippingStatus)) {
      filter.shippingStatus = shippingStatus;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
      ];
    }

    await bootstrapDatabase();

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.shippingAddress?.fullName || "—",
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        subtotal: Number(order.subtotal || 0),
        shipping: Number(order.shipping || 0),
        discounts: Number(order.discounts || 0),
        total: Number(order.total || 0),
        currency: order.currency || "INR",
        paymentStatus: order.paymentStatus || "pending",
        shippingStatus: order.shippingStatus || "pending",
        couponCode: order.couponCode || "",
        tracking: order.tracking || "",
        courier: order.courier || "",
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[admin/orders] GET failed:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to fetch orders." },
      { status: 500 }
    );
  }
}
