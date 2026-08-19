/**
 * POST /api/shiprocket/create-order
 * Creates an order in Shiprocket for an existing order in our system.
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
      { error: "Shiprocket integration is not enabled. Set SHIPROCKET_ENABLED=true" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ id: orderId }).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.shiprocketOrderId) {
      return NextResponse.json(
        { error: "Order already synced to Shiprocket", shiprocketOrderId: order.shiprocketOrderId },
        { status: 409 }
      );
    }

    const shippingAddress = order.shippingAddress || {};
    const items = order.items || [];

    const orderItems = items.map((item) => ({
      name: item.product?.name || "Product",
      sku: item.sku || item.product?.slug || "SKU",
      units: item.quantity || 1,
      selling_price: item.unitPrice || 0,
      discount: 0,
      tax: 0,
      hsn: item.product?.category?.id || "6109",
    }));

    const shiprocketOrderData = {
      orderId: order.id,
      orderDate: order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_ID,
      billing_customer_name: shippingAddress.fullName?.split(" ")[0] || "Customer",
      billing_last_name: shippingAddress.fullName?.split(" ").slice(1).join(" ") || "",
      billing_address: shippingAddress.line1 || "",
      billing_address_2: shippingAddress.line2 || "",
      billing_city: shippingAddress.city || "",
      billing_pincode: shippingAddress.postalCode || "",
      billing_state: shippingAddress.state || "",
      billing_country: shippingAddress.country || "India",
      billing_email: order.items?.[0]?.product?.category?.id ? "" : "", // will be overridden
      billing_phone: shippingAddress.phone || "",
      shipping_is_billing: true,
      shipping_customer_name: shippingAddress.fullName?.split(" ")[0] || "Customer",
      shipping_last_name: shippingAddress.fullName?.split(" ").slice(1).join(" ") || "",
      shipping_address: shippingAddress.line1 || "",
      shipping_address_2: shippingAddress.line2 || "",
      shipping_city: shippingAddress.city || "",
      shipping_pincode: shippingAddress.postalCode || "",
      shipping_state: shippingAddress.state || "",
      shipping_country: shippingAddress.country || "India",
      shipping_email: "",
      shipping_phone: shippingAddress.phone || "",
      order_items: orderItems,
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.subtotal || order.total,
      length: 10,
      breadth: 10,
      height: 5,
      weight: Math.max(0.1, (items.reduce((sum, item) => sum + (item.quantity || 1) * 0.2, 0))),
    };

    if (order.paymentMethod === "cod") {
      shiprocketOrderData.cod_amount = order.total;
    }

    const result = await shiprocket.createOrder(shiprocketOrderData);

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          shiprocketOrderId: result.order_id,
          shiprocketShipmentId: result.shipment_id,
          awbCode: result.awb_code || "",
          courierName: result.courier_name || "",
          shiprocketStatus: "created",
        },
      },
      { new: true }
    ).lean().exec();

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        shiprocketOrderId: updatedOrder.shiprocketOrderId,
        shiprocketShipmentId: updatedOrder.shiprocketShipmentId,
        awbCode: updatedOrder.awbCode,
        courierName: updatedOrder.courierName,
        shiprocketStatus: updatedOrder.shiprocketStatus,
      },
      shiprocketResponse: result,
    });
  } catch (error) {
    console.error("[shiprocket/create-order] Failed:", error);

    if (error instanceof ShiprocketError) {
      return NextResponse.json(
        { error: error.message, details: error.response },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create Shiprocket order" },
      { status: 500 }
    );
  }
}