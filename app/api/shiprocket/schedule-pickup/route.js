/**
 * POST /api/shiprocket/schedule-pickup
 * Schedules a pickup for a shipment.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
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
    const pickupDate = String(body?.pickupDate || "").trim(); // YYYY-MM-DD
    const pickupTimeSlot = String(body?.pickupTimeSlot || "").trim(); // e.g., "10:00-13:00"

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    if (!pickupDate) {
      return NextResponse.json({ error: "Pickup date is required (YYYY-MM-DD)" }, { status: 400 });
    }
    if (!pickupTimeSlot) {
      return NextResponse.json({ error: "Pickup time slot is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ id: orderId }).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.shiprocketShipmentId) {
      return NextResponse.json(
        { error: "Order not synced to Shiprocket. Create order first." },
        { status: 400 }
      );
    }

    if (!order.awbCode) {
      return NextResponse.json(
        { error: "AWB not assigned. Assign AWB first." },
        { status: 400 }
      );
    }

    const result = await shiprocket.schedulePickup({
      shipmentId: order.shiprocketShipmentId,
      pickupDate,
      pickupTimeSlot,
    });

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          pickupScheduledAt: new Date(`${pickupDate}T00:00:00`),
          pickupToken: result.pickup_token || "",
          shiprocketStatus: "pickup_scheduled",
        },
      },
      { new: true }
    ).lean().exec();

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pickupScheduledAt: updatedOrder.pickupScheduledAt,
        pickupToken: updatedOrder.pickupToken,
        shiprocketStatus: updatedOrder.shiprocketStatus,
      },
      shiprocketResponse: result,
    });
  } catch (error) {
    console.error("[shiprocket/schedule-pickup] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to schedule pickup" },
      { status: 500 }
    );
  }
}