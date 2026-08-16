import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth/server";
import { bootstrapDatabase } from "@/lib/database/register";
import { OrderModel, ProductModel, CouponModel } from "@/lib/database/models";
import { sendTransactionalEmail } from "@/lib/email/smtp";

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeAddress(raw = {}) {
  return {
    fullName: raw.fullName || "",
    line1: raw.line1 || "",
    line2: raw.line2 || "",
    city: raw.city || "",
    state: raw.state || "",
    postalCode: raw.postalCode || "",
    country: raw.country || "India",
  };
}

function makeOrderItemSnapshot(product, item) {
  const variant = Array.isArray(product.variants) ? product.variants[0] : null;
  const color = Array.isArray(variant?.colors) ? variant.colors.find((entry) => entry.isDefault) || variant.colors[0] : null;
  const sizeEntry = Array.isArray(color?.sizes)
    ? color.sizes.find((entry) => entry.size === item.size) || color.sizes[0]
    : null;

  const image = item.image || color?.media?.front?.src || "";
  const qty = Math.max(1, Number(item.quantity) || 1);
  const unitPrice = Number(color?.price ?? product?.price ?? item.unitPrice ?? 0);
  const lineTotal = unitPrice * qty;

  return {
    category: {
      id: product.categoryId || "",
      name: product.categoryName || "",
      slug: product.categoryId || toSlug(product.categoryName || ""),
    },
    product: {
      id: product.id,
      name: product.generalInformation?.name || product.slug,
      slug: product.slug,
    },
    variant: {
      id: variant?.id || "",
      type: variant?.type || "standard",
      name: variant?.name || "Standard",
      slug: variant?.slug || product.slug,
    },
    color: {
      id: color?.id || "",
      name: color?.color?.name || item.color || "Default",
      slug: color?.color?.slug || toSlug(color?.color?.name || item.color || "default"),
      hex: color?.color?.hex || "",
    },
    size: item.size || sizeEntry?.size || "",
    sku: sizeEntry?.sku || `${product.slug}-${item.size || "std"}`,
    image: image
      ? { id: `img-${product.id}-${item.size || "std"}`, src: image, alt: "", type: "image" }
      : undefined,
    unitPrice,
    quantity: qty,
    lineTotal,
  };
}

export async function GET(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    await bootstrapDatabase();
    const orders = await OrderModel.find({ customerId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total || 0),
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        createdAt: order.createdAt,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
      })),
    });
  } catch (error) {
    console.error("[orders] Failed to load customer orders:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to load orders." },
      { status: 500 }
    );
  }
}

/** Shipping cost rules — single source of truth (mirrors shippingAdapter on the client). */
const SHIPPING_METHODS = {
  standard: { label: "Standard Delivery", amount: 199 },
  express: { label: "Express Delivery", amount: 399 },
};

function resolveShippingAmount(methodId) {
  return Number(SHIPPING_METHODS[methodId]?.amount ?? 199);
}

/** Server-side coupon validation (re-validates every field; never trusts client discount). */
async function validateCouponServerSide(code, subtotal) {
  if (!code) return { valid: false, discount: 0, message: "" };

  const coupon = await CouponModel.findOne({
    code: code.toUpperCase(),
    active: true,
  })
    .lean()
    .exec();

  if (!coupon) {
    return { valid: false, discount: 0, message: "Coupon not found or inactive." };
  }

  const now = Date.now();
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) {
    return { valid: false, discount: 0, message: "Coupon is not active yet." };
  }
  if (coupon.endsAt && now > new Date(coupon.endsAt).getTime()) {
    return { valid: false, discount: 0, message: "Coupon has expired." };
  }

  const minSubtotal = Number(coupon.minSubtotal || 0);
  if (minSubtotal > 0 && subtotal < minSubtotal) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order value for this coupon is ₹${minSubtotal}.`,
    };
  }

  const usageLimit = Number(coupon.usageLimit || 0);
  if (usageLimit > 0 && Number(coupon.usedCount || 0) >= usageLimit) {
    return { valid: false, discount: 0, message: "Coupon usage limit reached." };
  }

  const value = Number(coupon.value || 0);
  const discount =
    coupon.type === "percent" ? (subtotal * value) / 100 : value;

  return { valid: true, discount: Math.max(0, discount), message: "" };
}

export async function POST(request) {
  try {
    const auth = await getAuth();
    // Use a distinct name to avoid shadowing the mongoose session below.
    const authSession = await auth.api.getSession({ headers: request.headers });

    if (!authSession?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();

    // ── 1. Basic input validation ──────────────────────────────────────────
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const shippingAddress = normalizeAddress(body?.shippingAddress || {});
    const requiredAddressFields = ["fullName", "line1", "city", "postalCode"];
    for (const field of requiredAddressFields) {
      if (!String(shippingAddress[field] || "").trim()) {
        return NextResponse.json(
          { error: `Shipping address is missing: ${field}.` },
          { status: 422 }
        );
      }
    }

    const contactEmail = String(body?.contact?.email || "").trim();
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "A valid contact email is required." }, { status: 422 });
    }

    const deliveryMethodId = String(body?.deliveryMethodId || "standard");
    if (!SHIPPING_METHODS[deliveryMethodId]) {
      return NextResponse.json({ error: "Invalid shipping method." }, { status: 422 });
    }

    const paymentMethodId = String(body?.paymentMethodId || "cod");
    if (!["cod", "online"].includes(paymentMethodId)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 422 });
    }

    await bootstrapDatabase();

    // ── 2. Resolve products and build item snapshots ───────────────────────
    const productMap = new Map();
    const productIds = [
      ...new Set(items.map((item) => item.productId || item.slug).filter(Boolean)),
    ];
    const validProducts = await ProductModel.find({
      $or: [{ id: { $in: productIds } }, { slug: { $in: productIds } }],
    })
      .lean()
      .exec();

    validProducts.forEach((product) => {
      productMap.set(product.id, product);
      productMap.set(product.slug, product);
    });

    const snapshots = [];
    // Track requested quantities per product+size for the inventory decrement.
    const stockDecrements = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId) || productMap.get(item.slug);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId || item.slug}` },
          { status: 404 }
        );
      }

      if (product.status !== "active") {
        return NextResponse.json(
          { error: `"${product.generalInformation?.name || product.slug}" is no longer available.` },
          { status: 409 }
        );
      }

      const variant = Array.isArray(product.variants) ? product.variants[0] : null;
      const color = Array.isArray(variant?.colors)
        ? variant.colors.find((entry) => entry.isDefault) || variant.colors[0]
        : null;
      const sizeEntry = Array.isArray(color?.sizes)
        ? color.sizes.find((entry) => entry.size === item.size)
        : null;

      if (!sizeEntry) {
        return NextResponse.json(
          { error: `Size "${item.size}" is not available for ${product.generalInformation?.name || product.slug}.` },
          { status: 400 }
        );
      }

      const requestedQty = Math.max(1, Number(item.quantity) || 1);

      if (Number(sizeEntry.stock) < requestedQty) {
        const stock = Number(sizeEntry.stock);
        if (stock === 0) {
          return NextResponse.json(
            { error: `"${product.generalInformation?.name || product.slug}" in size ${item.size} is out of stock.` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          {
            error: `Only ${stock} unit${stock === 1 ? "" : "s"} of "${product.generalInformation?.name || product.slug}" (size ${item.size}) available.`,
          },
          { status: 409 }
        );
      }

      const snapshot = makeOrderItemSnapshot(product, { ...item, quantity: requestedQty });
      subtotal += snapshot.lineTotal;
      snapshots.push(snapshot);

      if (color) {
        stockDecrements.push({
          productId: product.id,
          colorId: color.id,
          size: item.size,
          qty: requestedQty,
        });
      }
    }

    // ── 3. Server-side totals (never trust client-submitted values) ────────
    const shipping = resolveShippingAmount(deliveryMethodId);

    const couponCode = String(body?.couponCode || "").trim();
    const couponResult = await validateCouponServerSide(couponCode, subtotal);
    if (couponCode && !couponResult.valid) {
      return NextResponse.json(
        { error: couponResult.message || "Invalid or expired coupon." },
        { status: 422 }
      );
    }
    const discount = couponResult.valid ? couponResult.discount : 0;
    const total = Math.max(0, subtotal + shipping - discount);

    // ── 4. Payment status — online payments must be verified via webhook ──
    // We NEVER trust a client-submitted paymentStatus of "paid" for online
    // orders. The order always starts as "pending"; the Razorpay webhook
    // (app/api/webhooks/razorpay/route.js) updates it to "paid" once
    // the payment.captured event is verified server-side with the webhook secret.
    // COD orders remain "pending" until manually marked by an admin.
    const initialPaymentStatus = "pending";

    const orderDoc = {
      id: `order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      orderNumber: `BB-${Date.now().toString().slice(-8)}`,
      customerId: authSession.user.id,
      items: snapshots,
      shippingAddress,
      subtotal,
      discounts: discount,
      shipping,
      total,
      currency: body?.currency || "INR",
      couponCode: couponCode || "",
      paymentStatus: initialPaymentStatus,
      shippingStatus: "pending",
      tracking: "",
      courier: "",
      notes: body?.notes || "",
      statusHistory: [
        {
          status: "placed",
          timestamp: new Date().toISOString(),
          actor: authSession.user.email,
        },
      ],
    };

    // ── 5. Transactional write: decrement stock, increment coupon usage, create order ──
    const mongoSession = await mongoose.startSession();
    let created = null;

    try {
      await mongoSession.withTransaction(async () => {
        // Decrement inventory for each item.
        for (const decrement of stockDecrements) {
          await ProductModel.findOneAndUpdate(
            {
              id: decrement.productId,
              "variants.colors.id": decrement.colorId,
              "variants.colors.sizes.size": decrement.size,
            },
            {
              $inc: {
                "variants.$[v].colors.$[c].sizes.$[s].stock": -decrement.qty,
              },
            },
            {
              arrayFilters: [
                { "v.colors.id": decrement.colorId },
                { "c.sizes.size": decrement.size },
              ],
              session: mongoSession,
            }
          );
        }

        // Increment coupon usage count.
        if (couponCode && couponResult.valid) {
          await CouponModel.findOneAndUpdate(
            { code: couponCode.toUpperCase() },
            { $inc: { usedCount: 1 } },
            { session: mongoSession }
          );
        }

        const orderCreated = await OrderModel.create([orderDoc], {
          session: mongoSession,
        });
        created = orderCreated[0];
      });
    } finally {
      await mongoSession.endSession();
    }

    // ── 6. Best-effort confirmation email ─────────────────────────────────
    try {
      const emailHtml = generateOrderConfirmationEmail(created, snapshots, body);
      await sendTransactionalEmail({
        to: contactEmail || authSession.user.email,
        subject: `Order Confirmation — ${created.orderNumber}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("[orders] Failed to send confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: created.id,
        orderNumber: created.orderNumber,
        status: "placed",
        total: created.total,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error("[orders] Failed to create order:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to place order." },
      { status: 500 }
    );
  }
}

function generateOrderConfirmationEmail(order, items, body) {
  const shippingAddress = body?.shippingAddress || order.shippingAddress;
  const contact = body?.contact || { email: "", phone: "" };

  const itemsHtml = items.map((item) => `
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

  const subtotal = formatPrice(order.subtotal);
  const shipping = formatPrice(order.shipping);
  const discount = order.discounts ? formatPrice(order.discounts) : "₹0";
  const total = formatPrice(order.total);

  return `
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
            <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #111; text-align: center;">Order Confirmed</h1>
            <p style="margin: 0 0 24px; font-size: 16px; color: #666; text-align: center;">Thank you for your order, ${shippingAddress.fullName || "Customer"}!</p>
            
            <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 0; font-size: 14px; color: #666;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
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
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #666;">Subtotal</td>
                <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111;">${subtotal}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #666;">Shipping</td>
                <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111;">${shipping}</td>
              </tr>
              ${order.discounts > 0 ? `
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #666;">Discount (${order.couponCode || "Coupon"})</td>
                <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #666;">-${discount}</td>
              </tr>
              ` : ""}
              <tr style="border-top: 2px solid #111;">
                <td style="padding: 16px 0 8px; font-size: 18px; font-weight: 700; color: #111;">Total</td>
                <td style="padding: 16px 0 8px; text-align: right; font-size: 18px; font-weight: 700; color: #111;">${total}</td>
              </tr>
            </table>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #111;">Shipping Address</h2>
              <p style="margin: 0 0 4px; font-size: 14px; color: #111;">${shippingAddress.fullName}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #111;">${shippingAddress.line1}${shippingAddress.line2 ? ", " + shippingAddress.line2 : ""}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #111;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #111;">${shippingAddress.country}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #111;">Phone: ${contact.phone || "—"}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #111;">Email: ${contact.email || "—"}</p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #111;">Payment Method</h2>
              <p style="margin: 0; font-size: 14px; color: #111;">${order.paymentStatus === "paid" ? "Online Payment (Paid)" : "Cash on Delivery"}</p>
            </div>
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
