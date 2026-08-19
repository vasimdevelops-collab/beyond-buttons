/**
 * GET /api/shiprocket/label/:shipmentId
 * Generates and returns the shipping label PDF URL for a shipment.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { shiprocket, ShiprocketError } from "@/lib/shiprocket";

export async function GET(request, { params }) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  if (!shiprocket.isEnabled()) {
    return NextResponse.json(
      { error: "Shiprocket integration is not enabled" },
      { status: 400 }
    );
  }

  try {
    const shipmentId = String((await params)?.shipmentId || "").trim();

    if (!shipmentId) {
      return NextResponse.json({ error: "Shipment ID is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ shiprocketShipmentId: shipmentId }).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found for this shipment" }, { status: 404 });
    }

    const result = await shiprocket.generateLabel(shipmentId);

    const labelUrl = result.label_url || result.label || "";

    if (labelUrl) {
      await OrderModel.findOneAndUpdate(
        { id: order.id },
        { $set: { labelUrl } }
      ).exec();
    }

    return NextResponse.json({
      success: true,
      labelUrl,
      shipmentId,
    });
  } catch (error) {
    console.error("[shiprocket/label] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate label" },
      { status: 500 }
    );
  }
}