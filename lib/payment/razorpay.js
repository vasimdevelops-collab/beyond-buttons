import crypto from "node:crypto";

export function getRazorpayPublicKey() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
}

export function isRazorpayConfigured() {
  return Boolean(
    getRazorpayPublicKey() &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID
  );
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured.");
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount || 0) * 100),
      currency,
      receipt: String(receipt || `bb-${Date.now()}`),
      notes,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.description || "Unable to initialize Razorpay checkout.");
  }

  return {
    orderId: data.id,
    amount: Number(data.amount || 0),
    currency: data.currency || currency,
    receipt: data.receipt || receipt,
    key: getRazorpayPublicKey(),
  };
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}
