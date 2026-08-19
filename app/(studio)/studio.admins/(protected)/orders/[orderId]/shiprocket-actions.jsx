"use client";

import { useState } from "react";

import { toast } from "@/components/toast/toast-store";

export function ShiprocketActions({ order }) {
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courierId, setCourierId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState("");

  const isOrderCreated = !!order.shiprocketOrderId;
  const isAWBAssigned = !!order.awbCode;
  const isLabelGenerated = !!order.labelUrl;
  const isPickupScheduled = !!order.pickupScheduledAt;

  const canCreateOrder = !isOrderCreated;
  const canAssignAWB = isOrderCreated && !isAWBAssigned;
  const canGenerateLabel = isAWBAssigned && !isLabelGenerated;
  const canSchedulePickup = isAWBAssigned && !isPickupScheduled;
  const canCancel = isOrderCreated && !["delivered", "rto_delivered", "cancelled"].includes(order.shiprocketStatus);

  async function handleAction(apiPath, body = {}) {
    setLoading(true);
    try {
      const response = await fetch(`/api/shiprocket/${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, ...body }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Server error: ${response.status}`);
      }

      toast.success(payload.success ? "Action completed" : "Action completed");
      window.location.reload();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder() {
    await handleAction("create-order");
  }

  async function handleAssignAWB() {
    if (!courierId) {
      toast.error("Please select a courier");
      return;
    }
    await handleAction("assign-awb", { courierId: Number(courierId) });
  }

  async function handleGenerateLabel() {
    setLoading(true);
    try {
      const response = await fetch(`/api/shiprocket/label/${order.shiprocketShipmentId}`, {
        method: "GET",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to generate label");
      if (payload.labelUrl) {
        window.open(payload.labelUrl, "_blank");
      }
      toast.success("Label generated");
    } catch (err) {
      toast.error(err?.message || "Failed to generate label");
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedulePickup() {
    if (!pickupDate || !pickupTimeSlot) {
      toast.error("Please select pickup date and time slot");
      return;
    }
    await handleAction("schedule-pickup", { pickupDate, pickupTimeSlot });
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this shipment in Shiprocket? This cannot be undone.")) return;
    await handleAction("cancel", { reason: "Cancelled by admin" });
  }

  const timeSlots = [
    "09:00-12:00",
    "10:00-13:00",
    "11:00-14:00",
    "12:00-15:00",
    "13:00-16:00",
    "14:00-17:00",
    "15:00-18:00",
  ];

  return (
    <section className="studio-section" aria-label="Shiprocket actions">
      <header className="studio-section__header">
        <h2 className="studio-section__title">Shiprocket Actions</h2>
        <p className="studio-section__copy">Manage shipment lifecycle from order creation to delivery.</p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {/* Create Order */}
        {canCreateOrder && (
          <button
            className="studio-btn studio-btn--primary"
            onClick={handleCreateOrder}
            disabled={loading}
          >
            {loading && action === "create" ? "Creating…" : "Create Shiprocket Order"}
          </button>
        )}

        {/* Assign AWB */}
        {canAssignAWB && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--hairline)" }}
            >
              <option value="">Select Courier</option>
              <option value={17}>Delhivery (17)</option>
              <option value={1}>Blue Dart (1)</option>
              <option value={3}>Ecom Express (3)</option>
              <option value={2}>XpressBees (2)</option>
              <option value={18}>Shadowfax (18)</option>
              <option value={19}>DTDC (19)</option>
              <option value={20}>Professional Couriers (20)</option>
            </select>
            <button
              className="studio-btn studio-btn--primary"
              onClick={handleAssignAWB}
              disabled={loading || !courierId}
            >
              {loading && action === "awb" ? "Assigning…" : "Assign AWB"}
            </button>
          </div>
        )}

        {/* Generate Label */}
        {canGenerateLabel && (
          <button
            className="studio-btn"
            onClick={handleGenerateLabel}
            disabled={loading}
          >
            {loading && action === "label" ? "Generating…" : "Generate Label"}
          </button>
        )}

        {/* Schedule Pickup */}
        {canSchedulePickup && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--hairline)" }}
            />
            <select
              value={pickupTimeSlot}
              onChange={(e) => setPickupTimeSlot(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--hairline)" }}
            >
              <option value="">Time Slot</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <button
              className="studio-btn studio-btn--primary"
              onClick={handleSchedulePickup}
              disabled={loading || !pickupDate || !pickupTimeSlot}
            >
              {loading && action === "pickup" ? "Scheduling…" : "Schedule Pickup"}
            </button>
          </div>
        )}

        {/* Cancel */}
        {canCancel && (
          <button
            className="studio-btn studio-btn--danger"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && action === "cancel" ? "Cancelling…" : "Cancel Shipment"}
          </button>
        )}

        {!canCreateOrder && !canAssignAWB && !canGenerateLabel && !canSchedulePickup && !canCancel && (
          <span style={{ opacity: 0.5, fontSize: "0.875rem" }}>
            {isOrderCreated ? "All Shiprocket actions completed" : "Enable Shiprocket to manage shipments"}
          </span>
        )}
      </div>
    </section>
  );
}