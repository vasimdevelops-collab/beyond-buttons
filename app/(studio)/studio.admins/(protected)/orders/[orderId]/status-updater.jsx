"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "@/components/toast/toast-store";

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute("content") || null;
}

const PAYMENT_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const SHIPPING_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusUpdater({ order }) {
  const router = useRouter();
  const [form, setForm] = useState({
    paymentStatus: order.paymentStatus || "pending",
    shippingStatus: order.shippingStatus || "pending",
    tracking: order.tracking || "",
    courier: order.courier || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: "", isError: false });

    try {
      const csrfToken = getCsrfToken();
      const headers = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Server error: ${response.status}`);
      }

      setMessage({ text: "Order updated successfully.", isError: false });
      toast.success("Order updated");
      router.refresh();
    } catch (err) {
      setMessage({ text: err?.message || "Unable to update order.", isError: true });
      toast.error(err?.message || "Unable to update order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="studio-card studio-orders__status-updater" aria-label="Order status editor">
      <header className="studio-card__header">
        <h2 className="studio-card__title">Order Controls</h2>
        <p className="studio-card__copy">Update payment and shipment progress.</p>
      </header>
      <div className="studio-card__content">
        <form onSubmit={handleSubmit} className="studio-orders__updater-form">
          <div className="studio-orders__updater-grid">
            <label className="studio-field studio-orders__field">
              <span className="studio-field__label">Payment Status</span>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
                className="studio-field__select"
              >
                {PAYMENT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="studio-field studio-orders__field">
              <span className="studio-field__label">Shipping Status</span>
              <select
                value={form.shippingStatus}
                onChange={(e) => setForm((f) => ({ ...f, shippingStatus: e.target.value }))}
                className="studio-field__select"
              >
                {SHIPPING_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="studio-field studio-orders__field studio-orders__field--full">
              <span className="studio-field__label">Courier</span>
              <input
                type="text"
                value={form.courier}
                onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
                placeholder="e.g. Blue Dart, Delhivery"
                autoComplete="off"
                className="studio-field__input"
              />
            </label>

            <label className="studio-field studio-orders__field studio-orders__field--full">
              <span className="studio-field__label">Tracking ID</span>
              <input
                type="text"
                value={form.tracking}
                onChange={(e) => setForm((f) => ({ ...f, tracking: e.target.value }))}
                placeholder="AWB or tracking number"
                autoComplete="off"
                className="studio-field__input"
              />
            </label>
          </div>

          {message.text ? (
            <div
              className={`studio-notice ${message.isError ? "studio-notice--error" : "studio-notice--success"}`}
              role="alert"
              style={{ marginTop: 16 }}
            >
              <p className="studio-notice__text">{message.text}</p>
            </div>
          ) : null}

          <div className="studio-orders__updater-actions">
            <button className="studio-btn studio-btn--primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}