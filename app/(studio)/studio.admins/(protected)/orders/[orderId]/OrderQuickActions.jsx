"use client";

import { useState } from "react";

import { toast } from "@/components/toast/toast-store";

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute("content") || null;
}

export function OrderQuickActions({ order }) {
  const [loading, setLoading] = useState(null);

  async function handleAction(action) {
    if (loading) return;
    setLoading(action);

    const updates = {};
    let successMessage = "";

    switch (action) {
      case "delivered":
        updates.shippingStatus = "delivered";
        successMessage = "Order marked as delivered";
        break;
      case "paid":
        updates.paymentStatus = "paid";
        successMessage = "Payment marked as paid";
        break;
      case "process":
        updates.shippingStatus = "processing";
        successMessage = "Shipment processing started";
        break;
      case "cancel":
        if (!window.confirm("Cancel this order? This will restore stock if applicable and cannot be undone.")) {
          setLoading(null);
          return;
        }
        updates.shippingStatus = "cancelled";
        successMessage = "Order cancelled";
        break;
    }

    try {
      const csrfToken = getCsrfToken();
      const headers = {
        "Content-Type": "application/json",
      };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`);
      }

      toast.success(successMessage);
      window.location.reload();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const canDeliver = order.shippingStatus !== "delivered" && order.shippingStatus !== "cancelled";
  const canMarkPaid = order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && order.paymentMethod !== "cod";
  const canProcess = order.shippingStatus === "pending";
  const canCancel = order.shippingStatus !== "cancelled";

  return (
    <div className="studio-orders__quick-actions">
      {canDeliver && (
        <button
          className="studio-btn studio-btn--primary studio-orders__quick-btn"
          style={{ width: "100%" }}
          onClick={() => handleAction("delivered")}
          disabled={loading !== null}
        >
          {loading === "delivered" ? "Marking Delivered…" : "Mark as Delivered"}
        </button>
      )}
      {canMarkPaid && (
        <button
          className="studio-btn studio-btn--primary studio-orders__quick-btn"
          style={{ width: "100%", backgroundColor: "var(--success, #2ecc71)", borderColor: "var(--success, #2ecc71)" }}
          onClick={() => handleAction("paid")}
          disabled={loading !== null}
        >
          {loading === "paid" ? "Marking Paid…" : "Mark Payment as Paid"}
        </button>
      )}
      {canProcess && (
        <button
          className="studio-btn studio-btn--ghost studio-orders__quick-btn"
          style={{ width: "100%" }}
          onClick={() => handleAction("process")}
          disabled={loading !== null}
        >
          {loading === "process" ? "Processing…" : "Process Shipment"}
        </button>
      )}
      {canCancel && (
        <button
          className="studio-btn studio-btn--danger studio-orders__quick-btn"
          style={{ width: "100%" }}
          onClick={() => handleAction("cancel")}
          disabled={loading !== null}
        >
          {loading === "cancel" ? "Cancelling…" : "Cancel Order"}
        </button>
      )}
    </div>
  );
}