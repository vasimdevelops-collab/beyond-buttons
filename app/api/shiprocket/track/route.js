/**
 * GET /api/shiprocket/track/:awbCode
 * Tracks a shipment using AWB code.
 * Can be accessed by admin or customer (with order ownership check).
 */

import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/server";
import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { shiprocket, ShiprocketError } from "@/lib/shiprocket";

export async function GET(request, { params }) {
  try {
    const awbCode = String((await params)?.awbCode || "").trim().toUpperCase();

    if (!awbCode) {
      return NextResponse.json({ error: "AWB code is required" }, { status: 400 });
    }

    if (!shiprocket.isEnabled()) {
      return NextResponse.json(
        { error: "Shiprocket integration is not enabled" },
        { status: 400 }
      );
    }

    // Check if admin or customer
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const isAdmin = session?.user && (await requireAdmin(request)).email;

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ awbCode }).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found for this AWB" }, { status: 404 });
    }

    // If not admin, verify customer owns this order
    if (!isAdmin && session?.user?.id !== order.customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await shiprocket.trackShipment(awbCode);

    return NextResponse.json({
      success: true,
      tracking: result.tracking_data || result,
      awbCode,
      courierName: order.courierName,
      shiprocketStatus: order.shiprocketStatus,
    });
  } catch (error) {
    console.error("[shiprocket/track] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to track shipment" },
      { status: 500 }
    );
  }
}