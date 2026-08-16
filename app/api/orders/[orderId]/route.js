import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/server";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { hasStudioAccess } from "@/lib/auth/roles";

/**
 * GET /api/orders/[orderId]
 * Customers can fetch their own order; admins/staff can fetch any order.
 */
export async function GET(request, { params }) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const orderId = String((await params)?.orderId || "");
    if (!orderId) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    await bootstrapDatabase();

    // Admins can fetch any order; customers can only fetch their own.
    const query = hasStudioAccess(session.user.role)
      ? { id: orderId }
      : { id: orderId, customerId: session.user.id };

    const order = await OrderModel.findOne(query).lean().exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[orders] Failed to fetch order:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to fetch order." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasStudioAccess(session.user.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const orderId = String(params?.orderId || "");
    if (!orderId) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const body = await request.json();
    const payload = {};

    if (body?.paymentStatus) {
      payload.paymentStatus = body.paymentStatus;
    }
    if (body?.shippingStatus) {
      payload.shippingStatus = body.shippingStatus;
    }
    if (body?.tracking !== undefined) {
      payload.tracking = String(body.tracking || "");
    }
    if (body?.courier !== undefined) {
      payload.courier = String(body.courier || "");
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No order updates provided." }, { status: 400 });
    }

    await bootstrapDatabase();

    const order = await OrderModel.findOne({ id: orderId }).exec();
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (payload.paymentStatus && payload.paymentStatus !== order.paymentStatus) {
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.push({
        status: "payment",
        paymentStatus: payload.paymentStatus,
        timestamp: new Date().toISOString(),
        actor: session.user.email,
      });
    }

    if (payload.shippingStatus && payload.shippingStatus !== order.shippingStatus) {
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.push({
        status: "shipping",
        shippingStatus: payload.shippingStatus,
        timestamp: new Date().toISOString(),
        actor: session.user.email,
      });
    }

    Object.assign(order, payload);
    await order.save();

    return NextResponse.json({ success: true, order: { id: order.id, paymentStatus: order.paymentStatus, shippingStatus: order.shippingStatus } });
  } catch (error) {
    console.error("[orders] Failed to update order status:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to update order." },
      { status: 500 }
    );
  }
}
