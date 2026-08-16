import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/server";
import { createRazorpayOrder, isRazorpayConfigured, verifyRazorpaySignature } from "@/lib/payment/razorpay";

/** GET /api/payments/razorpay — returns gateway configuration status. */
export async function GET() {
  return NextResponse.json({
    configured: isRazorpayConfigured(),
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
  });
}

/** POST /api/payments/razorpay — create a Razorpay order (server-side). */
export async function POST(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount || 0);
    const currency = String(body?.currency || "INR");
    const receipt = String(body?.receipt || `bb-${Date.now()}`);
    const notes = body?.notes || {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment total." }, { status: 400 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. Please use Cash on Delivery, or contact support.",
        },
        { status: 503 }
      );
    }

    const order = await createRazorpayOrder({ amount, currency, receipt, notes });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("[payments/razorpay] Failed to create order:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Unable to initialize payment." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/razorpay — verify Razorpay signature after payment.
 *
 * Called by the client immediately after the Razorpay checkout modal succeeds.
 * This is a secondary check — the primary source of truth for payment status
 * is the Razorpay webhook (app/api/webhooks/razorpay/route.js).
 *
 * The order is NOT marked "paid" here — that happens via the webhook.
 * This endpoint only confirms the signature is valid so the client can
 * proceed to create the order record.
 */
export async function PUT(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentId, signature } = body || {};

    // Log payment attempts for auditability.
    console.info(
      `[payments/razorpay] Verifying payment — user: ${session.user.email}, ` +
        `razorpayOrderId: ${orderId}, paymentId: ${paymentId}`
    );

    const valid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!valid) {
      // Log failures with enough context to debug without exposing the signature.
      console.error(
        `[payments/razorpay] Signature verification FAILED — ` +
          `user: ${session.user.email}, razorpayOrderId: ${orderId}, paymentId: ${paymentId}`
      );
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    console.info(
      `[payments/razorpay] Signature verified OK — ` +
        `user: ${session.user.email}, razorpayOrderId: ${orderId}, paymentId: ${paymentId}`
    );

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("[payments/razorpay] Verification error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Unable to verify payment." },
      { status: 500 }
    );
  }
}
