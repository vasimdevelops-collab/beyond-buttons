/**
 * Shared email templates for transactional emails.
 * Single source of truth for order confirmation and payment confirmation emails.
 */

const BRAND_NAME = "Beyond Buttons";
const LOGO_URL = process.env.EMAIL_LOGO_URL || "https://beyondbuttons.com/images/logo.png";
const SUPPORT_EMAIL = process.env.SMTP_FROM || "support@beyondbuttons.com";

function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
    <!-- Header -->
    <tr>
      <td style="padding:32px;text-align:center;border-bottom:1px solid #e5e5e5;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:40px;" />
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:40px 32px;">
        ${bodyHtml}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:24px 32px;text-align:center;border-top:1px solid #e5e5e5;background:#fafafa;">
        <p style="margin:0 0 8px;font-size:13px;color:#666;">
          Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#111;text-decoration:underline;">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin:0;font-size:12px;color:#999;">${BRAND_NAME} · Luxury Solid Shirts</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function buildItemsHtml(items) {
  return items.map((item) => `
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
}

/**
 * Build order confirmation email
 * @param {Object} options
 * @param {Object} options.order - Order document
 * @param {Array} options.items - Order items with product details
 * @param {Object} options.body - Original request body (for contact/shipping info)
 */
export function buildOrderConfirmationEmail({ order, items, body }) {
  const shippingAddress = body?.shippingAddress || order.shippingAddress;
  const contact = body?.contact || { email: "", phone: "" };

  const itemsHtml = buildItemsHtml(items);
  const subtotal = formatPrice(order.subtotal);
  const shipping = formatPrice(order.shipping);
  const discount = order.discounts ? formatPrice(order.discounts) : "₹0";
  const total = formatPrice(order.total);

  const bodyHtml = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #111; text-align: center;">Order Confirmed</h1>
    <p style="margin: 0 0 24px; font-size: 16px; color: #666; text-align: center;">Thank you for your order, ${shippingAddress.fullName || "Customer"}!</p>
    
    <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #666;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin: 0; font-size: 14px; color: #666;"><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
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
      <p style="margin: 0; font-size: 14px; color: #111;">${formatPaymentMethod(order.paymentMethod, order.paymentStatus)}</p>
    </div>
  `;

  return {
    subject: `Order Confirmation — ${order.orderNumber}`,
    html: emailShell(`Order Confirmed — ${BRAND_NAME}`, bodyHtml),
    text: `Order Confirmed — ${order.orderNumber}\n\nThank you for your order!\n\nOrder Number: ${order.orderNumber}\nDate: ${formatDate(order.createdAt)}\n\nTotal: ${total}\n\nShipping to:\n${shippingAddress.fullName}\n${shippingAddress.line1}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}\n${shippingAddress.country}\n\nPayment: ${formatPaymentMethod(order.paymentMethod, order.paymentStatus)}`,
  };
}

/**
 * Build payment confirmation email
 * @param {Object} options
 * @param {Object} options.order - Order document with paymentId
 */
export function buildPaymentConfirmationEmail({ order }) {
  const itemsHtml = buildItemsHtml(order.items || []);
  const total = formatPrice(order.total);

  const bodyHtml = `
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
  `;

  return {
    subject: `Payment Confirmed — ${order.orderNumber}`,
    html: emailShell(`Payment Confirmed — ${BRAND_NAME}`, bodyHtml),
    text: `Payment Confirmed — ${order.orderNumber}\n\nYour payment has been successfully received.\n\nPayment ID: ${order.paymentId}\n\nTotal Paid: ${total}\n\nYour order is now being processed.`,
  };
}

/**
 * Format payment method for display
 */
function formatPaymentMethod(method, status) {
  const labels = {
    cod: "Cash on Delivery",
    card: "Card",
    upi: "UPI",
    netbanking: "Net Banking",
    wallet: "Wallet",
    online: "Online Payment",
    emandate: "Auto-debit (eMandate)",
    bank_transfer: "Bank Transfer",
  };
  const label = labels[method] || "Online Payment";
  return status === "paid" ? `${label} (Paid)` : label;
}