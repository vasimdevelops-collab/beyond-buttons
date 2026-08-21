import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusUpdater } from "@/app/(studio)/studio.admins/(protected)/orders/[orderId]/status-updater";
import { ShiprocketActions } from "@/app/(studio)/studio.admins/(protected)/orders/[orderId]/shiprocket-actions";
import { OrderQuickActions } from "@/app/(studio)/studio.admins/(protected)/orders/[orderId]/OrderQuickActions";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  online: "Online Payment",
  emandate: "Auto-debit (eMandate)",
  bank_transfer: "Bank Transfer",
};

function formatPaymentMethod(method) {
  const label = PAYMENT_LABELS[method] || "Online Payment";
  return label;
}

function getStatusColor(status) {
  const colors = {
    pending: "var(--gold, #d4af37)",
    paid: "var(--success, #2ecc71)",
    failed: "var(--danger, #e74c3c)",
    refunded: "var(--text-muted, #888)",
    processing: "var(--gold, #d4af37)",
    shipped: "var(--info, #3498db)",
    delivered: "var(--success, #2ecc71)",
    cancelled: "var(--danger, #e74c3c)",
  };
  return colors[status?.toLowerCase()] || "var(--text-muted, #888)";
}

function getStatusBg(status) {
  const bgs = {
    pending: "rgba(212, 175, 55, 0.12)",
    paid: "rgba(46, 204, 113, 0.12)",
    failed: "rgba(231, 76, 60, 0.12)",
    refunded: "rgba(136, 136, 136, 0.12)",
    processing: "rgba(212, 175, 55, 0.12)",
    shipped: "rgba(52, 152, 219, 0.12)",
    delivered: "rgba(46, 204, 113, 0.12)",
    cancelled: "rgba(231, 76, 60, 0.12)",
  };
  return bgs[status?.toLowerCase()] || "rgba(136, 136, 136, 0.12)";
}

async function fetchOrder(orderId) {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") || "";

  const response = await fetch(`${baseUrl}/api/admin/orders/${encodeURIComponent(orderId)}`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch order: ${response.status}`);

  const data = await response.json();
  return data.order || null;
}

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return { title: `Order ${orderId} — Beyond Buttons Studio` };
}

export default async function StudioOrderDetailPage({ params }) {
  const { orderId } = await params;
  const order = await fetchOrder(orderId);
  if (!order) notFound();

  const shippingAddress = order.shippingAddress || {};
  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const paymentColor = getStatusColor(order.paymentStatus);
  const paymentBg = getStatusBg(order.paymentStatus);
  const shippingColor = getStatusColor(order.shippingStatus);
  const shippingBg = getStatusBg(order.shippingStatus);

  return (
    <>
      <header className="studio-main__header studio-orders__detail-header">
        <div className="studio-orders__detail-header-left">
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title studio-orders__detail-title">{order.orderNumber || order.id}</h1>
          <p className="studio-main__copy">
            Placed {formatDate(order.createdAt)} · {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="studio-orders__detail-header-right">
          <Link className="studio-btn studio-btn--ghost" href="/studio.admins/orders">
            ← Back to Orders
          </Link>
        </div>
      </header>

      <div className="studio-orders__detail-grid">
        {/* Left Column - Order Summary, Delivery, Shiprocket, Items, History */}
        <div className="studio-orders__detail-main">
          {/* Order Summary Card */}
          <section className="studio-card studio-orders__summary-card" aria-label="Order summary">
            <header className="studio-card__header">
              <h2 className="studio-card__title">Order Summary</h2>
              <p className="studio-card__copy">Payment and shipping status overview.</p>
            </header>
            <div className="studio-card__content">
              <div className="studio-orders__status-row">
                <div className="studio-orders__status-item">
                  <span className="studio-orders__status-label">Payment</span>
                  <span
                    className="studio-badge studio-badge--lg"
                    style={{ backgroundColor: paymentBg, color: paymentColor }}
                  >
                    {order.paymentStatus || "pending"}
                  </span>
                </div>
                <div className="studio-orders__status-item">
                  <span className="studio-orders__status-label">Shipping</span>
                  <span
                    className="studio-badge studio-badge--lg"
                    style={{ backgroundColor: shippingBg, color: shippingColor }}
                  >
                    {order.shippingStatus || "pending"}
                  </span>
                </div>
              </div>
              <div className="studio-orders__fields">
                <div className="studio-field studio-orders__field">
                  <span className="studio-field__label">Customer</span>
                  <p className="studio-field__value">{shippingAddress.fullName || "—"}</p>
                </div>
                <div className="studio-field studio-orders__field">
                  <span className="studio-field__label">Payment Method</span>
                  <p className="studio-field__value">{formatPaymentMethod(order.paymentMethod)}</p>
                </div>
                <div className="studio-field studio-orders__field">
                  <span className="studio-field__label">Order Date</span>
                  <p className="studio-field__value">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="studio-orders__totals">
                <div className="studio-orders__total-row">
                  <span className="studio-orders__total-label">Subtotal</span>
                  <span className="studio-orders__total-value">{formatMoney(order.subtotal)}</span>
                </div>
                <div className="studio-orders__total-row">
                  <span className="studio-orders__total-label">Shipping</span>
                  <span className="studio-orders__total-value">{formatMoney(order.shipping)}</span>
                </div>
                {Number(order.discounts) > 0 && (
                  <div className="studio-orders__total-row studio-orders__total-row--discount">
                    <span className="studio-orders__total-label">
                      Discount {order.couponCode ? `(${order.couponCode})` : ""}
                    </span>
                    <span className="studio-orders__total-value studio-orders__total-value--discount">-{formatMoney(order.discounts)}</span>
                  </div>
                )}
                <div className="studio-orders__total-row studio-orders__total-row--final">
                  <span className="studio-orders__total-label">Order Total</span>
                  <span className="studio-orders__total-value">{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Details Card */}
          <section className="studio-card studio-orders__delivery-card" aria-label="Delivery details">
            <header className="studio-card__header">
              <h2 className="studio-card__title">Delivery Details</h2>
            </header>
            <div className="studio-card__content">
              <div className="studio-orders__fields">
                <div className="studio-field studio-orders__field studio-orders__field--full">
                  <span className="studio-field__label">Full Name</span>
                  <p className="studio-field__value">{shippingAddress.fullName || "—"}</p>
                </div>
                <div className="studio-field studio-orders__field studio-orders__field--full">
                  <span className="studio-field__label">Address</span>
                  <p className="studio-field__value studio-field__value--address">
                    {[
                      shippingAddress.line1,
                      shippingAddress.line2,
                      shippingAddress.city,
                      shippingAddress.state,
                      shippingAddress.postalCode,
                      shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div className="studio-field studio-orders__field">
                  <span className="studio-field__label">Courier</span>
                  <p className="studio-field__value">{order.courierName || order.courier || "—"}</p>
                </div>
                <div className="studio-field studio-orders__field">
                  <span className="studio-field__label">Tracking</span>
                  <p className="studio-field__value">
                    {order.awbCode || order.tracking ? (
                      <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {order.awbCode || order.tracking}
                      </span>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Shiprocket Details Card */}
          {order.shiprocketOrderId && (
            <section className="studio-card studio-orders__shiprocket-card" aria-label="Shiprocket details">
              <header className="studio-card__header">
                <h2 className="studio-card__title">Shiprocket Details</h2>
                <p className="studio-card__copy">Shiprocket shipment details and actions.</p>
              </header>
              <div className="studio-card__content">
                <div className="studio-orders__fields">
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Shiprocket Order ID</span>
                    <p className="studio-field__value studio-field__value--mono">{order.shiprocketOrderId}</p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Shipment ID</span>
                    <p className="studio-field__value studio-field__value--mono">{order.shiprocketShipmentId || "—"}</p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">AWB Code</span>
                    <p className="studio-field__value studio-field__value--mono">{order.awbCode || "—"}</p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Courier</span>
                    <p className="studio-field__value">{order.courierName || "—"}</p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Shiprocket Status</span>
                    <span
                      className="studio-badge studio-badge--status"
                      style={{
                        backgroundColor: getStatusBg(order.shiprocketStatus),
                        color: getStatusColor(order.shiprocketStatus),
                      }}
                    >
                      {order.shiprocketStatus || "—"}
                    </span>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Label</span>
                    <p className="studio-field__value">
                      {order.labelUrl ? (
                        <a href={order.labelUrl} target="_blank" rel="noopener noreferrer" className="studio-link">
                          View Label
                        </a>
                      ) : (
                        <span style={{ opacity: 0.5 }}>Not generated</span>
                      )}
                    </p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Manifest</span>
                    <p className="studio-field__value">
                      {order.manifestUrl ? (
                        <a href={order.manifestUrl} target="_blank" rel="noopener noreferrer" className="studio-link">
                          View Manifest
                        </a>
                      ) : (
                        <span style={{ opacity: 0.5 }}>Not generated</span>
                      )}
                    </p>
                  </div>
                  <div className="studio-field studio-orders__field">
                    <span className="studio-field__label">Pickup Scheduled</span>
                    <p className="studio-field__value">
                      {order.pickupScheduledAt ? new Date(order.pickupScheduledAt).toLocaleString("en-IN") : "—"}
                      {order.pickupToken ? ` · Token: ${order.pickupToken}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Shiprocket Actions */}
          <ShiprocketActions order={order} />

          {/* Items Card */}
          <section className="studio-card studio-orders__items-card" aria-label="Items">
            <header className="studio-card__header">
              <h2 className="studio-card__title">Items</h2>
              <p className="studio-card__copy">Snapshot of purchased variants and quantities.</p>
            </header>
            <div className="studio-card__content">
              <ul className="studio-orders__items-list">
                {(order.items || []).map((item, index) => (
                  <li
                    key={`${item.product?.id || index}-${item.size || "std"}`}
                    className="studio-orders__item"
                  >
                    <div className="studio-orders__item-main">
                      <div className="studio-orders__item-info">
                        <strong>{item.product?.name || item.product?.slug || "Product"}</strong>
                        <p className="studio-orders__item-meta">
                          {item.color?.name || "Default"} · {item.size || "—"} · Qty {item.quantity || 1}
                        </p>
                        {item.sku ? (
                          <p className="studio-orders__item-sku">SKU: {item.sku}</p>
                        ) : null}
                      </div>
                      <span className="studio-orders__item-price">{formatMoney(item.lineTotal || 0)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Status History Card */}
          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 ? (
            <section className="studio-card studio-orders__history-card" aria-label="Status history">
              <header className="studio-card__header">
                <h2 className="studio-card__title">Status History</h2>
              </header>
              <div className="studio-card__content">
                <ul className="studio-orders__history-list">
                  {[...order.statusHistory].reverse().map((entry, i) => (
                    <li key={i} className="studio-orders__history-item">
                      <time className="studio-orders__history-time" dateTime={entry.timestamp}>
                        {formatDate(entry.timestamp)}
                      </time>
                      <div className="studio-orders__history-content">
                        <span className="studio-orders__history-status">
                          {entry.status === "payment"
                            ? `Payment → ${entry.paymentStatus}`
                            : entry.status === "shipping"
                              ? `Shipping → ${entry.shippingStatus}`
                              : entry.status}
                        </span>
                        {entry.actor ? (
                          <span className="studio-orders__history-actor">{entry.actor}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Order Controls */}
          <OrderStatusUpdater order={order} />
        </div>

        {/* Right Column - Quick Actions / Summary */}
        <aside className="studio-orders__detail-sidebar" aria-label="Quick actions">
          <div className="studio-card studio-orders__quick-card" style={{ position: "sticky", top: 24 }}>
            <header className="studio-card__header">
              <h2 className="studio-card__title">Quick Actions</h2>
            </header>
            <div className="studio-card__content">
              <OrderQuickActions order={order} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}