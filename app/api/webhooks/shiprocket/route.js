/**
 * POST /api/webhooks/shiprocket
 * Handles Shiprocket webhook events for real-time order status updates.
 * Verifies webhook signature before processing.
 */

import { NextResponse } from "next/server";

import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { shiprocket, ShiprocketError } from "@/lib/shiprocket";

export async function POST(request) {
  try {
    if (!shiprocket.isEnabled()) {
      console.warn("[shiprocket/webhook] Shiprocket not enabled, ignoring webhook");
      return NextResponse.json({ received: true, ignored: true });
    }

    const signature = request.headers.get("x-shiprocket-signature") || "";
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    if (!shiprocket.verifyWebhookSignature(rawBody, signature)) {
      console.error("[shiprocket/webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = shiprocket.parseWebhookEvent(payload);
    console.info("[shiprocket/webhook] Received event:", event.type, event);

    await bootstrapDatabase();

    let updatePayload = {};
    let historyEntry = null;

    switch (event.type) {
      case "order_created":
        updatePayload = {
          shiprocketOrderId: event.orderId,
          shiprocketShipmentId: event.shipmentId,
          shiprocketStatus: event.status,
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Order created in Shiprocket",
        };
        break;

      case "shipment_created":
      case "awb_assigned":
        updatePayload = {
          shiprocketShipmentId: event.shipmentId,
          awbCode: event.awbCode,
          courierName: event.courierName,
          shiprocketStatus: event.status,
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          awbCode: event.awbCode,
          courierName: event.courierName,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: `AWB assigned: ${event.awbCode} (${event.courierName})`,
        };
        break;

      case "pickup_scheduled":
        updatePayload = {
          pickupScheduledAt: event.pickupDate ? new Date(event.pickupDate) : undefined,
          pickupToken: event.pickupToken,
          shiprocketStatus: event.status,
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          pickupDate: event.pickupDate,
          pickupToken: event.pickupToken,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: `Pickup scheduled for ${event.pickupDate}`,
        };
        break;

      case "pickup_completed":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "shipped",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "shipped",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Pickup completed, shipment in transit",
        };
        break;

      case "shipped":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "shipped",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "shipped",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Shipment shipped",
        };
        break;

      case "in_transit":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "shipped",
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Shipment in transit",
        };
        break;

      case "out_for_delivery":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "shipped",
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Out for delivery",
        };
        break;

      case "delivered":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "delivered",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "delivered",
          shiprocketStatus: event.status,
          timestamp: event.deliveredAt || new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Shipment delivered",
        };
        break;

      case "rto_initiated":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "shipped",
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "RTO initiated",
        };
        break;

      case "rto_delivered":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "delivered",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "delivered",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "RTO delivered (returned to origin)",
        };
        break;

      case "lost":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "cancelled",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "cancelled",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Shipment lost",
        };
        break;

      case "cancelled":
        updatePayload = {
          shiprocketStatus: event.status,
          shippingStatus: "cancelled",
        };
        historyEntry = {
          status: "shipping",
          shippingStatus: "cancelled",
          shiprocketStatus: event.status,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: "Shipment cancelled",
        };
        break;

      case "ndr":
        updatePayload = {
          shiprocketStatus: event.status,
        };
        historyEntry = {
          status: "shiprocket",
          shiprocketStatus: event.status,
          ndrReason: event.ndrReason,
          ndrAction: event.ndrAction,
          timestamp: new Date().toISOString(),
          actor: "shiprocket-webhook",
          details: `NDR: ${event.ndrReason} - Action: ${event.ndrAction}`,
        };
        break;

      default:
        console.info("[shiprocket/webhook] Unknown event type:", event.type);
        return NextResponse.json({ received: true, ignored: true });
    }

    const query = event.orderId
      ? { $or: [{ id: event.orderId }, { shiprocketOrderId: event.orderId }, { shiprocketShipmentId: event.shipmentId }] }
      : { shiprocketShipmentId: event.shipmentId };

    const order = await OrderModel.findOne(query).exec();
    if (!order) {
      console.warn("[shiprocket/webhook] Order not found for event:", event);
      return NextResponse.json({ received: true, orderNotFound: true });
    }

    Object.assign(order, updatePayload);

    if (historyEntry) {
      order.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        historyEntry,
      ];
    }

    await order.save();

    console.info(`[shiprocket/webhook] Updated order ${order.id} (${order.orderNumber}): ${event.type}`);

    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error("[shiprocket/webhook] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}