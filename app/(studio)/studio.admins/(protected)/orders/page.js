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
    const timer = setTimeout(() => {
      if (mountedRef.current) fetchOrders();
    }, 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
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

  const hasFilters = search || paymentStatus || shippingStatus;

  return (
    <>
      <header className="studio-main__header studio-orders__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Orders</h1>
          <p className="studio-main__copy">
            Customer orders — payment state, shipping progress, and totals.
            {pagination.total > 0 && !loading ? ` ${pagination.total} total.` : ""}
          </p>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="studio-btn studio-btn--ghost studio-orders__clear-filters"
            onClick={() => {
              setSearch("");
              setPaymentStatus("");
              setShippingStatus("");
              fetchOrders({ page: 1, search: "", paymentStatus: "", shippingStatus: "", sort });
            }}
          >
            Clear filters
          </button>
        )}
      </header>

      {/* Toolbar */}
      <section className="studio-toolbar studio-orders__toolbar" aria-label="Order filters">
        <form className="studio-toolbar__search" onSubmit={handleSearch} role="search">
          <label className="studio-field studio-field--search">
            <span className="studio-field__label">Search</span>
            <div className="studio-field__input-wrapper">
              <input
                type="search"
                name="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order number or customer name"
                autoComplete="off"
              />
            </div>
          </label>
          <button type="submit" className="studio-btn studio-btn--primary studio-toolbar__search-btn">
            Search
          </button>
        </form>

        <div className="studio-toolbar__filters">
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
        </div>
      </section>

      {error ? (
        <div className="studio-notice studio-notice--error" role="alert">
          <p className="studio-notice__text">{error}</p>
        </div>
      ) : null}

      <section
        className="studio-table studio-orders__table"
        data-state={loading ? "loading" : orders.length ? "ready" : "empty"}
        aria-label="Orders"
      >
        <div className="studio-table__head" role="row">
          <span>Order</span>
          <span>Date</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Shipping</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <div className="studio-table__skeleton" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="studio-table__skeleton-row">
                  <div className="studio-table__skeleton-cell" style={{ width: "28%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "12%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "18%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "10%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "12%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "10%" }} />
                  <div className="studio-table__skeleton-cell" style={{ width: "10%" }} />
                </div>
              ))}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <div className="studio-table__empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="studio-table__empty-title">No orders found</p>
            <p className="studio-table__empty-copy">
              {search || paymentStatus || shippingStatus
                ? "Try adjusting your filters or search terms."
                : "Customer orders will appear here once checkout is completed."}
            </p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {orders.map((order) => (
              <li key={order.id}>
                <Link className="studio-table__row" href={`/studio.admins/orders/${order.id}`}>
                  <span className="studio-table__order">
                    <strong>{order.orderNumber || order.id}</strong>
                    <small>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</small>
                  </span>
                  <span>{formatDate(order.createdAt)}</span>
                  <span className="studio-table__customer">{order.customerName || "—"}</span>
                  <span>{order.itemCount}</span>
                  <span className="studio-table__total">{formatMoney(order.total)}</span>
                  <span className="studio-table__status-cell">
                    <span
                      className="studio-badge studio-badge--status"
                      style={{
                        backgroundColor: getStatusBg(order.paymentStatus),
                        color: getStatusColor(order.paymentStatus),
                      }}
                      data-status={order.paymentStatus}
                    >
                      {order.paymentStatus}
                      {order.paymentMethod && order.paymentMethod !== "cod" ? (
                        <small style={{ marginLeft: 6, opacity: 0.7, fontWeight: 400 }}>{formatPaymentMethod(order.paymentMethod)}</small>
                      ) : null}
                    </span>
                  </span>
                  <span className="studio-table__status-cell">
                    <span
                      className="studio-badge studio-badge--status"
                      style={{
                        backgroundColor: getStatusBg(order.shippingStatus),
                        color: getStatusColor(order.shippingStatus),
                      }}
                      data-status={order.shippingStatus}
                    >
                      {order.shippingStatus}
                    </span>
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
          className="studio-pagination studio-orders__pagination"
          aria-label="Orders pagination"
        >
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Previous
          </button>
          <div className="studio-pagination__pages">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`studio-pagination__page ${page === pageNum ? "is-active" : ""}`}
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={page === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <span className="studio-pagination__info">
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