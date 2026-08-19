import crypto from "crypto";
import { NextResponse } from "next/server";

import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel } from "@/lib/database/models";
import { sendTransactionalEmail } from "@/lib/email/smtp";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

async function updateOrderPaymentStatus(orderId, paymentId, status, signature, paymentMethod) {
  await bootstrapDatabase();

  const order = await OrderModel.findOne({ id: orderId }).lean().exec();
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const existingSignature = order.paymentSignature;
  if (existingSignature && existingSignature === signature) {
    return { order, alreadyProcessed: true };
  }

  const update = {
    paymentStatus: status,
    paymentId,
    paymentSignature: signature,
    updatedAt: new Date().toISOString(),
  };
  if (paymentMethod) {
    update.paymentMethod = paymentMethod;
  }

  const updated = await OrderModel.findOneAndUpdate(
    { id: orderId },
    {
      $set: update,
      $push: {
        statusHistory: {
          status: status === "paid" ? "payment_confirmed" : "payment_failed",
          timestamp: new Date().toISOString(),
          actor: "razorpay_webhook",
        },
      },
    },
    { returnDocument: "after" }
  ).lean().exec();

  return { order: updated, alreadyProcessed: false };
}

async function sendPaymentConfirmationEmail(order) {
  const itemsHtml = (order.items || []).map((item) => `
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <td style="padding: 16px 0;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 80px; padding-right: 16px;">
              ${item.image?.src ? `<img src="${item.image.src}" alt="${item.product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />` : ''}
            </td>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #111;">${item.product.name}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #666;">${item.color.name} / ${item.size}</p>
              <p style="margin: 0; font-size: 14px; color: #111;">Qty: ${item.quantity} × ${formatPrice(item.unitPrice)}</p>
            </td>
            <td style="text-align: right; white-space: nowrap; font-size: 16px; font-weight: 600; color: #111;">
              ${formatPrice(item.lineTotal)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const total = formatPrice(order.total);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #e5e5e5;">
            <img src="https://beyondbuttons.com/images/logo.png" alt="Beyond Buttons" style="height: 48px;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #111; text-align: center;">Payment Confirmed</h1>
            <p style="margin: 0 0 24px; font-size: 16px; color: #666; text-align: center;">Your payment has been successfully received.</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Payment ID:</strong> ${order.paymentId}</p>
            </div>

            <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #111;">
                  <th style="padding: 12px 0; text-align: left; font-size: 14px; font-weight: 600; color: #111;">Item</th>
                  <th style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #111;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
              <tr style="border-top: 2px solid #111;">
                <td style="padding: 16px 0 8px; font-size: 18px; font-weight: 700; color: #111;">Total Paid</td>
                <td style="padding: 16px 0 8px; text-align: right; font-size: 18px; font-weight: 700; color: #111;">${total}</td>
              </tr>
            </table>

            <p style="margin: 32px 0 0; font-size: 14px; color: #666; text-align: center;">Your order is now being processed. You'll receive a shipping confirmation once it's on the way.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #666;">Questions? Contact us at <a href="mailto:support@beyondbuttons.com" style="color: #111; text-decoration: underline;">support@beyondbuttons.com</a></p>
            <p style="margin: 0; font-size: 12px; color: #999;">Beyond Buttons — Luxury Solid Shirt Brand</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendTransactionalEmail({
      to: order.shippingAddress?.email || "customer@beyondbuttons.com",
      subject: `Payment Confirmed — ${order.orderNumber}`,
      html,
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