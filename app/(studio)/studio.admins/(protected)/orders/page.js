"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const PAYMENT_FILTERS = [
  { value: "", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const SHIPPING_FILTERS = [
  { value: "", label: "All shipping" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "total_desc", label: "Highest total" },
  { value: "total_asc", label: "Lowest total" },
];

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
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAYMENT_METHOD_LABELS = {
  cod: "COD",
  card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  online: "Online",
  emandate: "eMandate",
  bank_transfer: "Bank Transfer",
};

function formatPaymentMethod(method) {
  return PAYMENT_METHOD_LABELS[method] || "Online";
}

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);

  async function fetchOrders(params = {}) {
    if (mountedRef.current) {
      setLoading(true);
      setError("");
    }
    try {
      const qs = new URLSearchParams({
        page: String(params.page ?? page),
        sort: params.sort ?? sort,
        ...(params.search ?? search ? { search: params.search ?? search } : {}),
        ...(params.paymentStatus ?? paymentStatus ? { paymentStatus: params.paymentStatus ?? paymentStatus } : {}),
        ...(params.shippingStatus ?? shippingStatus ? { shippingStatus: params.shippingStatus ?? shippingStatus } : {}),
      });

      const response = await fetch(`/api/admin/orders?${qs}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load orders.");
      const data = await response.json();

      if (mountedRef.current) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "Failed to load orders.");
        setOrders([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const next = 1;
    setPage(next);
    fetchOrders({ page: next, search, paymentStatus, shippingStatus, sort });
  }

  function handleFilterChange(key, value) {
    const next = { page: 1, search, paymentStatus, shippingStatus, sort, [key]: value };
    setPage(1);
    if (key === "paymentStatus") setPaymentStatus(value);
    if (key === "shippingStatus") setShippingStatus(value);
    if (key === "sort") setSort(value);
    fetchOrders(next);
  }

  function handlePageChange(nextPage) {
    setPage(nextPage);
    fetchOrders({ page: nextPage });
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Orders</h1>
          <p className="studio-main__copy">
            Customer orders — payment state, shipping progress, and totals.
            {pagination.total > 0 && !loading ? ` ${pagination.total} total.` : ""}
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <section className="studio-toolbar" aria-label="Order filters">
        <form className="studio-toolbar__search" onSubmit={handleSearch} role="search">
          <label className="studio-field">
            <span className="studio-field__label">Search</span>
            <input
              type="search"
              name="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number or customer name"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="studio-btn studio-btn--ghost">
            Search
          </button>
        </form>

        <label className="studio-field">
          <span className="studio-field__label">Payment</span>
          <select
            value={paymentStatus}
            onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
          >
            {PAYMENT_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Shipping</span>
          <select
            value={shippingStatus}
            onChange={(e) => handleFilterChange("shippingStatus", e.target.value)}
          >
            {SHIPPING_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Sort</span>
          <select
            value={sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <p role="alert" style={{ color: "#f7a1a1", padding: "12px 0" }}>{error}</p>
      ) : null}

      <section
        className="studio-table"
        data-state={loading ? "loading" : orders.length ? "ready" : "empty"}
        aria-label="Orders"
      >
        <div className="studio-table__head" role="row">
          <span>Order</span>
          <span>Date</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Shipping</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No orders found</p>
            <p className="studio-table__empty-copy">
              {search || paymentStatus || shippingStatus
                ? "Try adjusting your filters."
                : "Customer orders will appear here once checkout is completed."}
            </p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {orders.map((order) => (
              <li key={order.id}>
                <Link className="studio-table__row" href={`/studio.admins/orders/${order.id}`}>
                  <span className="studio-table__product">
                    <strong>{order.orderNumber || order.id}</strong>
                    <small>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</small>
                  </span>
                  <span>{formatDate(order.createdAt)}</span>
                  <span>{order.customerName || "—"}</span>
                  <span>{formatMoney(order.total)}</span>
                  <span className="studio-table__status" data-status={order.paymentStatus}>
                    {order.paymentStatus}
                    {order.paymentMethod && order.paymentMethod !== "cod" ? (
                      <small style={{ display: "block", opacity: 0.65 }}>{formatPaymentMethod(order.paymentMethod)}</small>
                    ) : null}
                  </span>
                  <span className="studio-table__status" data-status={order.shippingStatus}>
                    {order.shippingStatus}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pagination */}
      {pagination.pages > 1 ? (
        <nav
          aria-label="Orders pagination"
          style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}
        >
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Prev
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", opacity: 0.7 }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page >= pagination.pages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </button>
        </nav>
      ) : null}
    </>
  );
}
