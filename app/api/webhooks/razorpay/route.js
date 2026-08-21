import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { decrementOrderStock } from "@/lib/shop/stock";
import { sendTransactionalEmail } from "@/lib/email/smtp";
import { buildPaymentConfirmationEmail } from "@/lib/email/templates";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

async function updateOrderPaymentStatus(orderId, paymentId, status, signature, paymentMethod) {
  await bootstrapDatabase();
  const mongoSession = await mongoose.startSession();
  let updated;
  let alreadyProcessed = false;

  try {
    await mongoSession.withTransaction(async () => {
      const order = await OrderModel.findOne({ id: orderId }).session(mongoSession).exec();
      if (!order) throw new Error(`Order not found: ${orderId}`);

      // A duplicate captured event must never decrement stock twice.
      if (status === "paid" && order.stockDecremented) {
        updated = order.toObject();
        alreadyProcessed = true;
        return;
      }
      if (order.paymentId && order.paymentId === paymentId) {
        updated = order.toObject();
        alreadyProcessed = true;
        return;
      }

      if (status === "paid") {
        // This atomic guarded decrement happens only after Razorpay has
        // authenticated a payment.captured webhook.
        await decrementOrderStock(order, { session: mongoSession });
        order.stockDecremented = true;
        order.stockRestored = false;
      }

      order.paymentStatus = status;
      order.paymentId = paymentId;
      order.paymentSignature = signature;
      order.paymentGatewayMethod = paymentMethod || "";
      order.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        {
          status: status === "paid" ? "payment_confirmed" : "payment_failed",
          timestamp: new Date().toISOString(),
          actor: "razorpay_webhook",
        },
      ];
      await order.save({ session: mongoSession });
      updated = order.toObject();
    });
  } finally {
    await mongoSession.endSession();
  }

  return { order: updated, alreadyProcessed };
}

async function sendPaymentConfirmationEmail(order) {
  const { subject, html, text } = buildPaymentConfirmationEmail({ order });

  try {
    await sendTransactionalEmail({
      to: order.shippingAddress?.email || "customer@beyondbuttons.com",
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("[webhook] Failed to send payment confirmation email:", error);
  }
}

function formatPrice(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.order_id || payment.order_id;
      const paymentId = payment.id;

      if (!orderId) {
        console.warn("[webhook] No order_id in payment notes");
        return NextResponse.json({ received: true });
      }

      try {
        const { order, alreadyProcessed } = await updateOrderPaymentStatus(orderId, paymentId, "paid", signature, payment.method);

        if (!alreadyProcessed) {
          await sendPaymentConfirmationEmail(order);
        }

        return NextResponse.json({ received: true, processed: !alreadyProcessed });
      } catch (error) {
        console.error("[webhook] Failed to update order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.order_id || payment.order_id;

      if (orderId) {
        try {
          await updateOrderPaymentStatus(orderId, payment.id, "failed", signature);
        } catch (error) {
          console.error("[webhook] Failed to update failed payment order:", error);
        }
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
