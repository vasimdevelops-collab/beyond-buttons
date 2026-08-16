/**
 * GET   /api/admin/orders/[orderId]  — fetch single order with full detail
 * PATCH /api/admin/orders/[orderId]  — update paymentStatus, shippingStatus,
 *                                      tracking, courier, notes
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";

const VALID_PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);
const VALID_SHIPPING_STATUSES = new Set([
  "pending", "processing", "shipped", "delivered", "cancelled",
]);

export async function GET(request, { params }) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const orderId = String((await params)?.orderId || "");
    if (!orderId) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    await bootstrapDatabase();
    const order = await OrderModel.findOne({ id: orderId }).lean().exec();

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[admin/orders] GET single failed:", err);
    return NextResponse.json(
      { error: err?.message || "Unable to fetch order." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    const adminEmail = guard.email;
    const orderId = String((await params)?.orderId || "");
    if (!orderId) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const body = await request.json();
    const updates = {};
    const historyEntries = [];

    // Validate and stage paymentStatus update.
    if (body?.paymentStatus !== undefined) {
      const ps = String(body.paymentStatus);
      if (!VALID_PAYMENT_STATUSES.has(ps)) {
        return NextResponse.json(
          { error: `Invalid paymentStatus: ${ps}` },
          { status: 422 }
        );
      }
      updates.paymentStatus = ps;
    }

    // Validate and stage shippingStatus update.
    if (body?.shippingStatus !== undefined) {
      const ss = String(body.shippingStatus);
      if (!VALID_SHIPPING_STATUSES.has(ss)) {
        return NextResponse.json(
          { error: `Invalid shippingStatus: ${ss}` },
          { status: 422 }
        );
      }
      updates.shippingStatus = ss;
    }

    if (body?.tracking !== undefined) {
      updates.tracking = String(body.tracking || "").trim();
    }
    if (body?.courier !== undefined) {
      updates.courier = String(body.courier || "").trim();
    }
    if (body?.notes !== undefined) {
      updates.notes = String(body.notes || "").trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ id: orderId }).exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Build status history entries.
    if (updates.paymentStatus && updates.paymentStatus !== order.paymentStatus) {
      historyEntries.push({
        status: "payment",
        paymentStatus: updates.paymentStatus,
        previousPaymentStatus: order.paymentStatus,
        timestamp: new Date().toISOString(),
        actor: adminEmail,
      });
    }
    if (updates.shippingStatus && updates.shippingStatus !== order.shippingStatus) {
      historyEntries.push({
        status: "shipping",
        shippingStatus: updates.shippingStatus,
        previousShippingStatus: order.shippingStatus,
        timestamp: new Date().toISOString(),
        actor: adminEmail,
      });
    }

    Object.assign(order, updates);
    if (historyEntries.length > 0) {
      order.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        ...historyEntries,
      ];
    }

    await order.save();

    console.info(
      `[admin/orders] Updated order ${orderId} by ${adminEmail}: ` +
        JSON.stringify(updates)
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        tracking: order.tracking,
        courier: order.courier,
        notes: order.notes,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error("[admin/orders] PATCH failed:", err);
    return NextResponse.json(
      { error: err?.message || "Unable to update order." },
      { status: 500 }
    );
  }
}
