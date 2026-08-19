/**
 * GET /api/shiprocket/couriers
 * Gets available couriers and rates for a pincode.
 * Can be used at checkout to show shipping options.
 */

import { NextResponse } from "next/server";

import { shiprocket, ShiprocketError } from "@/lib/shiprocket";

export async function GET(request) {
  if (!shiprocket.isEnabled()) {
    return NextResponse.json(
      { error: "Shiprocket integration is not enabled" },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const pincode = String(searchParams.get("pincode") || "").trim();
    const weight = Number(searchParams.get("weight") || 0.5);
    const cod = searchParams.get("cod") === "true";

    if (!pincode) {
      return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Invalid pincode format" }, { status: 400 });
    }

    const result = await shiprocket.getCouriers(pincode, weight, cod);

    const couriers = (result.data || []).map((c) => ({
      courierId: c.courier_id,
      courierName: c.courier_name,
      estimatedDays: c.etd,
      rate: c.rate,
      cod: c.cod,
      prepaid: c.prepaid,
      pickupAvailable: c.pickup,
      deliveryAvailable: c.delivery,
    }));

    return NextResponse.json({
      success: true,
      couriers,
      pickupPincode: shiprocket.getPickupPincode(),
    });
  } catch (error) {
    console.error("[shiprocket/couriers] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to fetch couriers" },
      { status: 500 }
    );
  }
}