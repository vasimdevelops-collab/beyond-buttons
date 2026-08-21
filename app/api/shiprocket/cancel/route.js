/**
 * POST /api/shiprocket/cancel
 * Cancels a shipment in Shiprocket.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { restoreOrderStockOnce } from "@/lib/shop/stock";
import { shiprocket, ShiprocketError } from "@/lib/shiprocket";

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  if (!shiprocket.isEnabled()) {
    return NextResponse.json(
      { error: "Shiprocket integration is not enabled" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();
    const reason = String(body?.reason || "Order cancelled by admin");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ id: orderId }).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.shiprocketShipmentId) {
      return NextResponse.json(
        { error: "Order not synced to Shiprocket" },
        { status: 400 }
      );
    }

    if (order.shiprocketStatus === "cancelled") {
      return NextResponse.json(
        { error: "Shipment already cancelled" },
        { status: 409 }
      );
    }

    if (["delivered", "rto_delivered"].includes(order.shiprocketStatus)) {
      return NextResponse.json(
        { error: "Cannot cancel delivered shipment" },
        { status: 400 }
      );
    }

    const result = await shiprocket.cancelShipment(order.shiprocketShipmentId, reason);

    await restoreOrderStockOnce(orderId, "shiprocket_cancel");

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          shiprocketStatus: "cancelled",
          shippingStatus: "cancelled",
        },
      },
      { new: true }
    ).lean().exec();

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        shiprocketStatus: updatedOrder.shiprocketStatus,
        shippingStatus: updatedOrder.shippingStatus,
      },
      shiprocketResponse: result,
    });
  } catch (error) {
    console.error("[shiprocket/cancel] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to cancel shipment" },
      { status: 500 }
    );
  }
}
