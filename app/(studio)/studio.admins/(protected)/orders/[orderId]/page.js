import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusUpdater } from "@/app/(studio)/studio.admins/(protected)/orders/[orderId]/status-updater";
import { ShiprocketActions } from "@/app/(studio)/studio.admins/(protected)/orders/[orderId]/shiprocket-actions";

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

/**
 * Fetch the order via the admin API so we exercise the same auth + DB path
 * that the frontend calls — no direct DB reads in the studio UI.
 */
async function fetchOrder(orderId) {
  // Use absolute URL for server-side fetch inside Next.js App Router.
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const requestHeaders = await headers();

  // Forward the session cookie so the admin API auth check passes.
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

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">{order.orderNumber || order.id}</h1>
          <p className="studio-main__copy">
            Placed {formatDate(order.createdAt)} · {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link className="studio-btn studio-btn--ghost" href="/studio.admins/orders">
          Back to Orders
        </Link>
      </header>

      <div style={{ display: "grid", gap: "24px" }}>
        {/* Order summary */}
        <section className="studio-section" aria-label="Order summary">
          <header className="studio-section__header">
            <h2 className="studio-section__title">Order summary</h2>
            <p className="studio-section__copy">Payment and shipping status overview.</p>
          </header>
          <div className="studio-section__fields">
            <div className="studio-field">
              <span className="studio-field__label">Customer</span>
              <p style={{ margin: 0 }}>{shippingAddress.fullName || "—"}</p>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Payment status</span>
              <span className="studio-table__status" data-status={order.paymentStatus}>
                {order.paymentStatus || "pending"}
              </span>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Payment method</span>
              <p style={{ margin: 0 }}>{formatPaymentMethod(order.paymentMethod)}</p>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Shipping status</span>
              <span className="studio-table__status" data-status={order.shippingStatus}>
                {order.shippingStatus || "pending"}
              </span>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Subtotal</span>
              <p style={{ margin: 0 }}>{formatMoney(order.subtotal)}</p>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Shipping</span>
              <p style={{ margin: 0 }}>{formatMoney(order.shipping)}</p>
            </div>
            {Number(order.discounts) > 0 && (
              <div className="studio-field">
                <span className="studio-field__label">
                  Discount {order.couponCode ? `(${order.couponCode})` : ""}
                </span>
                <p style={{ margin: 0 }}>-{formatMoney(order.discounts)}</p>
              </div>
            )}
            <div className="studio-field">
              <span className="studio-field__label">Order total</span>
              <p style={{ margin: 0, fontWeight: 600 }}>{formatMoney(order.total)}</p>
            </div>
          </div>
        </section>

        {/* Delivery details */}
        <section className="studio-section" aria-label="Delivery details">
          <header className="studio-section__header">
            <h2 className="studio-section__title">Delivery details</h2>
          </header>
          <div className="studio-section__fields">
            <div className="studio-field">
              <span className="studio-field__label">Full name</span>
              <p style={{ margin: 0 }}>{shippingAddress.fullName || "—"}</p>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Address</span>
              <p style={{ margin: 0 }}>
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
            <div className="studio-field">
              <span className="studio-field__label">Courier</span>
              <p style={{ margin: 0 }}>{order.courierName || order.courier || "—"}</p>
            </div>
            <div className="studio-field">
              <span className="studio-field__label">Tracking</span>
              <p style={{ margin: 0 }}>{order.awbCode || order.tracking || "—"}</p>
            </div>
          </div>
        </section>

        {/* Shiprocket details */}
        {order.shiprocketOrderId && (
          <section className="studio-section" aria-label="Shiprocket details">
            <header className="studio-section__header">
              <h2 className="studio-section__title">Shiprocket</h2>
              <p className="studio-section__copy">Shiprocket shipment details and actions.</p>
            </header>
            <div className="studio-section__fields">
              <div className="studio-field">
                <span className="studio-field__label">Shiprocket Order ID</span>
                <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.875rem" }}>
                  {order.shiprocketOrderId}
                </p>
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Shipment ID</span>
                <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.875rem" }}>
                  {order.shiprocketShipmentId || "—"}
                </p>
              </div>
              <div className="studio-field">
                <span className="studio-field__label">AWB Code</span>
                <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.875rem" }}>
                  {order.awbCode || "—"}
                </p>
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Courier</span>
                <p style={{ margin: 0 }}>{order.courierName || "—"}</p>
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Shiprocket Status</span>
                <span className="studio-table__status" data-status={order.shiprocketStatus}>
                  {order.shiprocketStatus || "—"}
                </span>
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Label</span>
                {order.labelUrl ? (
                  <a href={order.labelUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>
                    View Label
                  </a>
                ) : (
                  <p style={{ margin: 0, opacity: 0.5 }}>Not generated</p>
                )}
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Manifest</span>
                {order.manifestUrl ? (
                  <a href={order.manifestUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>
                    View Manifest
                  </a>
                ) : (
                  <p style={{ margin: 0, opacity: 0.5 }}>Not generated</p>
                )}
              </div>
              <div className="studio-field">
                <span className="studio-field__label">Pickup Scheduled</span>
                <p style={{ margin: 0 }}>
                  {order.pickupScheduledAt ? new Date(order.pickupScheduledAt).toLocaleString("en-IN") : "—"}
                  {order.pickupToken ? ` · Token: ${order.pickupToken}` : ""}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Shiprocket Actions */}
        <ShiprocketActions order={order} />

        {/* Items */}
        <section className="studio-section" aria-label="Items">
          <header className="studio-section__header">
            <h2 className="studio-section__title">Items</h2>
            <p className="studio-section__copy">Snapshot of purchased variants and quantities.</p>
          </header>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {(order.items || []).map((item, index) => (
              <li
                key={`${item.product?.id || index}-${item.size || "std"}`}
                style={{
                  padding: "14px 16px",
                  border: "1px solid var(--hairline)",
                  borderRadius: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <strong>{item.product?.name || item.product?.slug || "Product"}</strong>
                    <p style={{ margin: "6px 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
                      {item.color?.name || "Default"} · {item.size || "—"} · Qty {item.quantity || 1}
                    </p>
                    {item.sku ? (
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem", opacity: 0.5 }}>SKU: {item.sku}</p>
                    ) : null}
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatMoney(item.lineTotal || 0)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Status history */}
        {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 ? (
          <section className="studio-section" aria-label="Status history">
            <header className="studio-section__header">
              <h2 className="studio-section__title">Status history</h2>
            </header>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {[...order.statusHistory].reverse().map((entry, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: "0.875rem",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  <span style={{ opacity: 0.5, whiteSpace: "nowrap" }}>
                    {formatDate(entry.timestamp)}
                  </span>
                  <span>
                    {entry.status === "payment"
                      ? `Payment → ${entry.paymentStatus}`
                      : entry.status === "shipping"
                        ? `Shipping → ${entry.shippingStatus}`
                        : entry.status}
                  </span>
                  {entry.actor ? (
                    <span style={{ marginLeft: "auto", opacity: 0.5 }}>{entry.actor}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Status updater (client component) */}
        <OrderStatusUpdater order={order} />
      </div>
    </>
  );
}
