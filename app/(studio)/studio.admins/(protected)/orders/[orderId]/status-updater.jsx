"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "@/components/toast/toast-store";

const PAYMENT_OPTIONS = ["pending", "paid", "failed", "refunded"];
const SHIPPING_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

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
      // Use the dedicated admin orders API — not the customer-facing endpoint.
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Server error: ${response.status}`);
      }

      setMessage({ text: "Order updated successfully.", isError: false });
      toast.success("Order updated");
      // Refresh the server component data without a full navigation.
      router.refresh();
    } catch (err) {
      setMessage({ text: err?.message || "Unable to update order.", isError: true });
      toast.error(err?.message || "Unable to update order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="studio-section" onSubmit={handleSubmit} aria-label="Order status editor">
      <header className="studio-section__header">
        <h2 className="studio-section__title">Order controls</h2>
        <p className="studio-section__copy">Update payment and shipment progress.</p>
      </header>

      <div className="studio-section__fields">
        <label className="studio-field">
          <span className="studio-field__label">Payment status</span>
          <select
            value={form.paymentStatus}
            onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
          >
            {PAYMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Shipping status</span>
          <select
            value={form.shippingStatus}
            onChange={(e) => setForm((f) => ({ ...f, shippingStatus: e.target.value }))}
          >
            {SHIPPING_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Courier</span>
          <input
            type="text"
            value={form.courier}
            onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
            placeholder="e.g. Blue Dart, Delhivery"
            autoComplete="off"
          />
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Tracking ID</span>
          <input
            type="text"
            value={form.tracking}
            onChange={(e) => setForm((f) => ({ ...f, tracking: e.target.value }))}
            placeholder="AWB or tracking number"
            autoComplete="off"
          />
        </label>
      </div>

      {message.text ? (
        <p
          role="alert"
          style={{
            margin: "12px 0 0",
            color: message.isError ? "#f7a1a1" : "var(--goldLight, var(--gold))",
            fontSize: "0.875rem",
          }}
        >
          {message.text}
        </p>
      ) : null}

      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <button className="studio-btn studio-btn--primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save status"}
        </button>
      </div>
    </form>
  );
}
