/**
 * POST /api/shiprocket/manifest
 * Generates a manifest PDF for multiple shipments.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
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
    const shipmentIds = Array.isArray(body?.shipmentIds) ? body.shipmentIds : [];

    if (shipmentIds.length === 0) {
      return NextResponse.json({ error: "At least one shipment ID is required" }, { status: 400 });
    }

    const result = await shiprocket.generateManifest(shipmentIds);

    const manifestUrl = result.manifest_url || result.manifest || "";

    return NextResponse.json({
      success: true,
      manifestUrl,
      shipmentIds,
    });
  } catch (error) {
    console.error("[shiprocket/manifest] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate manifest" },
      { status: 500 }
    );
  }
}