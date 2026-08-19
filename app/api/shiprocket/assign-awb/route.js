/**
 * POST /api/shiprocket/assign-awb
 * Assigns a courier and generates AWB for a Shiprocket shipment.
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
    const courierId = Number(body?.courierId);

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    if (!courierId) {
      return NextResponse.json({ error: "Courier ID is required" }, { status: 400 });
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

    if (order.awbCode) {
      return NextResponse.json(
        { error: "AWB already assigned", awbCode: order.awbCode },
        { status: 409 }
      );
    }

    const result = await shiprocket.createShipment({
      shipmentId: order.shiprocketShipmentId,
      courierId,
    });

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          awbCode: result.awb_code || "",
          courierName: result.courier_name || "",
          shiprocketStatus: "awb_assigned",
        },
      },
      { new: true }
    ).lean().exec();

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        awbCode: updatedOrder.awbCode,
        courierName: updatedOrder.courierName,
        shiprocketStatus: updatedOrder.shiprocketStatus,
      },
      shiprocketResponse: result,
    });
  } catch (error) {
    console.error("[shiprocket/assign-awb] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to assign AWB" },
      { status: 500 }
    );
  }
}