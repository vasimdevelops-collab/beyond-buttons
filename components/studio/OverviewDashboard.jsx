"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CreditCard,
  HeartHandshake,
  ImageIcon,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import SalesChart from "./SalesChart";
import "./overview.css";

const REFRESH_MS = 20000;

function formatMoney(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompact(value) {
  const number = Number(value || 0);
  if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `₹${(number / 1000).toFixed(1)}k`;
  return `₹${number.toLocaleString("en-IN")}`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatOrderTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  online: "Online (Razorpay)",
  card: "Card",
  upi: "UPI",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emandate: "Auto-pay",
  bank_transfer: "Bank transfer",
};

const SHIPPING_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OverviewDashboard({ initialData }) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [lastUpdated, setLastUpdated] = useState(() => initialData?.now || Date.now());
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [error, setError] = useState("");
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to refresh overview");
      if (mountedRef.current) {
        setData(payload);
        setLastUpdated(payload.now || Date.now());
        setError("");
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "Unable to refresh overview");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!initialData) refresh(true);
    const interval = setInterval(() => refresh(true), REFRESH_MS);
    const tick = setInterval(() => setCountdown((value) => (value <= 1 ? REFRESH_MS / 1000 : value - 1)), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = [
    {
      key: "revenue",
      label: "Revenue",
      icon: TrendingUp,
      value: data ? formatMoney(data.kpis.revenue) : "—",
      meta: data ? `${data.kpis.orders} orders all-time` : "Loading…",
      href: "/studio.admins/analytics",
    },
    {
      key: "orders",
      label: "Orders today",
      icon: ShoppingBag,
      value: data ? String(data.kpis.ordersToday) : "—",
      meta: data ? `${data.kpis.pendingPayment} awaiting payment` : "Loading…",
      href: "/studio.admins/orders",
    },
    {
      key: "products",
      label: "Products",
      icon: Boxes,
      value: data ? String(data.kpis.products) : "—",
      meta: "active catalog",
      href: "/studio.admins/products",
    },
    {
      key: "customers",
      label: "Customers",
      icon: HeartHandshake,
      value: data ? String(data.kpis.customers) : "—",
      meta: "registered accounts",
      href: "/studio.admins/customers",
    },
    {
      key: "media",
      label: "Media assets",
      icon: ImageIcon,
      value: data ? String(data.kpis.media) : "—",
      meta: "asset library",
      href: "/studio.admins/media",
    },
  ];

  const needsAttention = data
    ? [
        { label: "Orders awaiting payment", count: data.kpis.pendingPayment, href: "/studio.admins/orders" },
        { label: "Paid, awaiting shipment", count: data.kpis.pendingShipment, href: "/studio.admins/orders" },
      ]
    : [];

  const methodTotal = data
    ? data.paymentMethods.reduce((sum, row) => sum + row.count, 0)
    : 0;

  return (
    <div className="ov">
      {/* Live status bar */}
      <div className="ov-live" role="status" aria-live="polite">
        <span className={`ov-live__dot${loading ? " is-refreshing" : ""}`} aria-hidden="true" />
        <span className="ov-live__text" suppressHydrationWarning>
          {loading ? "Refreshing…" : error ? "Connection error — retrying automatically" : `Live · updated ${formatTimeAgo(lastUpdated)}`}
        </span>
        <span className="ov-live__spacer" aria-hidden="true" />
        <span className="ov-live__count" suppressHydrationWarning>auto-refresh in {Math.ceil(countdown)}s</span>
        <button type="button" className="ov-live__refresh" onClick={() => refresh(false)} disabled={loading}>
          <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
          Refresh now
        </button>
      </div>

      {/* KPI cards */}
      <section className="ov-kpis" aria-label="Key metrics">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.key} href={kpi.href} className="ov-kpi">
              <div className="ov-kpi__top">
                <span className="ov-kpi__icon">
                  <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="ov-kpi__label">{kpi.label}</span>
              </div>
              <p className="ov-kpi__value">{kpi.value}</p>
              <p className="ov-kpi__meta">{kpi.meta}</p>
            </Link>
          );
        })}
      </section>

      {/* Sales chart */}
      <section className="ov-panel">
        <header className="ov-panel__header">
          <div>
            <h2 className="ov-panel__title">Sales — last 30 days</h2>
            <p className="ov-panel__copy">Paid orders only. Bars = daily revenue, line = trend.</p>
          </div>
          <span className="ov-panel__badge">
            <CalendarClock size={13} strokeWidth={1.5} aria-hidden="true" />
            30 days
          </span>
        </header>
        <SalesChart series={data?.salesSeries || []} />
      </section>

      <div className="ov-cols">
        {/* Needs attention */}
        <section className="ov-panel">
          <header className="ov-panel__header">
            <div>
              <h2 className="ov-panel__title">Needs attention</h2>
              <p className="ov-panel__copy">Orders that could use a follow-up.</p>
            </div>
          </header>
          {needsAttention.length ? (
            <ul className="ov-list">
              {needsAttention.map((item) => (
                <li key={item.label} className="ov-list__row">
                  <span className="ov-list__icon ov-list__icon--warn">
                    <AlertTriangle size={15} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="ov-list__label">{item.label}</span>
                  <strong className="ov-list__count">{item.count}</strong>
                  <Link href={item.href} className="ov-list__link" aria-label={`Open ${item.label}`}>
                    <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ov-empty">No open items. Everything is up to date.</p>
          )}
        </section>

        {/* Payment method split */}
        <section className="ov-panel">
          <header className="ov-panel__header">
            <div>
              <h2 className="ov-panel__title">Payment sources</h2>
              <p className="ov-panel__copy">Where paid orders came from.</p>
            </div>
          </header>
          {data && data.paymentMethods.length ? (
            <ul className="ov-list">
              {data.paymentMethods.map((row) => {
                const percent = methodTotal ? Math.round((row.count / methodTotal) * 100) : 0;
                return (
                  <li key={row.method} className="ov-method">
                    <div className="ov-method__top">
                      <span className="ov-list__icon">
                        {row.method === "cod" ? (
                          <Wallet size={15} strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <CreditCard size={15} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </span>
                      <span className="ov-method__name">{PAYMENT_LABELS[row.method] || row.method}</span>
                      <span className="ov-method__count">{row.count} · {formatCompact(row.revenue)}</span>
                    </div>
                    <div className="ov-method__bar" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ov-empty">No paid orders yet.</p>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="ov-panel">
        <header className="ov-panel__header">
          <div>
            <h2 className="ov-panel__title">Recent orders</h2>
            <p className="ov-panel__copy">Latest activity in the store.</p>
          </div>
          <Link href="/studio.admins/orders" className="ov-panel__link">
            View all
            <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </header>
        {data && data.recentOrders.length ? (
          <div className="ov-table-wrap">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Shipment</th>
                  <th>Date</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link href={`/studio.admins/orders/${encodeURIComponent(order.id)}`} className="ov-order">
                        <strong>{order.orderNumber || order.id}</strong>
                      </Link>
                    </td>
                    <td data-label="Customer">{order.customer}</td>
                    <td data-label="Payment">
                      <span className={`ov-pill ov-pill--${order.paymentStatus}`}>
                        {order.paymentStatus}
                      </span>
                      <span className="ov-order-sub">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                    </td>
                    <td data-label="Shipment">
                      <span className={`ov-pill ov-pill--${order.shippingStatus}`}>
                        {SHIPPING_LABELS[order.shippingStatus] || order.shippingStatus}
                      </span>
                    </td>
                    <td data-label="Date"><span className="ov-order-sub">{formatOrderTime(order.createdAt)}</span></td>
                    <td data-label="Total"><strong>{formatMoney(order.total, order.currency)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ov-empty">No orders yet. New orders will appear here in real time.</p>
        )}
      </section>
    </div>
  );
}
