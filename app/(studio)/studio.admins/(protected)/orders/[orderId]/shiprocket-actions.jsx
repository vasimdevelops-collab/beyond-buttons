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

  const couriers = [
    { id: 17, name: "Delhivery" },
    { id: 1, name: "Blue Dart" },
    { id: 3, name: "Ecom Express" },
    { id: 2, name: "XpressBees" },
    { id: 18, name: "Shadowfax" },
    { id: 19, name: "DTDC" },
    { id: 20, name: "Professional Couriers" },
  ];

  const timeSlots = [
    "09:00-12:00",
    "10:00-13:00",
    "11:00-14:00",
    "12:00-15:00",
    "13:00-16:00",
    "14:00-17:00",
    "15:00-18:00",
  ];

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
    setAction("create");
    await handleAction("create-order");
    setAction(null);
  }

  async function handleAssignAWB() {
    if (!courierId) {
      toast.error("Please select a courier");
      return;
    }
    setAction("awb");
    await handleAction("assign-awb", { courierId: Number(courierId) });
    setAction(null);
  }

  async function handleGenerateLabel() {
    setLoading(true);
    setAction("label");
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
      setAction(null);
    }
  }

  async function handleSchedulePickup() {
    if (!pickupDate || !pickupTimeSlot) {
      toast.error("Please select pickup date and time slot");
      return;
    }
    setAction("pickup");
    await handleAction("schedule-pickup", { pickupDate, pickupTimeSlot });
    setAction(null);
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this shipment in Shiprocket? This cannot be undone.")) return;
    setAction("cancel");
    await handleAction("cancel", { reason: "Cancelled by admin" });
    setAction(null);
  }

  // Calculate progress
  const progressSteps = [
    { key: "create", label: "Create Order", done: isOrderCreated },
    { key: "awb", label: "Assign AWB", done: isAWBAssigned },
    { key: "label", label: "Generate Label", done: isLabelGenerated },
    { key: "pickup", label: "Schedule Pickup", done: isPickupScheduled },
  ];

  const completedSteps = progressSteps.filter((s) => s.done).length;
  const totalSteps = progressSteps.length;

  return (
    <section className="studio-card studio-orders__shiprocket-actions" aria-label="Shiprocket actions">
      <header className="studio-card__header">
        <h2 className="studio-card__title">Shiprocket Shipment</h2>
        <p className="studio-card__copy">Manage shipment lifecycle from order creation to delivery.</p>
      </header>
      <div className="studio-card__content">
        {/* Progress Tracker */}
        <div className="studio-orders__progress">
          {progressSteps.map((step, index) => (
            <div key={step.key} className="studio-orders__progress-step">
              <div className="studio-orders__progress-marker" style={{ backgroundColor: step.done ? "var(--success, #2ecc71)" : "var(--hairline)" }}>
                {step.done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ fontSize: "0.625rem", fontWeight: 700 }}>{index + 1}</span>
                )}
              </div>
              <span className="studio-orders__progress-label" style={{ color: step.done ? "var(--offWhite)" : "var(--text-muted)" }}>
                {step.label}
              </span>
              {index < progressSteps.length - 1 && (
                <div className="studio-orders__progress-line" style={{ backgroundColor: progressSteps[index + 1].done ? "var(--success, #2ecc71)" : "var(--hairline)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="studio-orders__action-group">
          {/* Create Order */}
          {canCreateOrder && (
            <div className="studio-orders__action-card">
              <div className="studio-orders__action-info">
                <span className="studio-orders__action-icon" style={{ backgroundColor: "rgba(52, 152, 219, 0.12)", color: "var(--info, #3498db)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <div>
                  <strong>Create Shiprocket Order</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Initialize the shipment in Shiprocket to get an order ID.
                  </p>
                </div>
              </div>
              <button
                className="studio-btn studio-btn--primary"
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading && action === "create" ? "Creating…" : "Create Order"}
              </button>
            </div>
          )}

          {/* Assign AWB */}
          {canAssignAWB && (
            <div className="studio-orders__action-card">
              <div className="studio-orders__action-info">
                <span className="studio-orders__action-icon" style={{ backgroundColor: "rgba(212, 175, 55, 0.12)", color: "var(--gold, #d4af37)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <div>
                  <strong>Assign AWB</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Select a courier and assign an airway bill number.
                  </p>
                </div>
              </div>
              <div className="studio-orders__action-form">
                <select
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="studio-field__select studio-orders__courier-select"
                  disabled={loading}
                >
                  <option value="">Select Courier</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
                <button
                  className="studio-btn studio-btn--primary"
                  onClick={handleAssignAWB}
                  disabled={loading || !courierId}
                >
                  {loading && action === "awb" ? "Assigning…" : "Assign AWB"}
                </button>
              </div>
            </div>
          )}

          {/* Generate Label */}
          {canGenerateLabel && (
            <div className="studio-orders__action-card">
              <div className="studio-orders__action-info">
                <span className="studio-orders__action-icon" style={{ backgroundColor: "rgba(46, 204, 113, 0.12)", color: "var(--success, #2ecc71)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </span>
                <div>
                  <strong>Generate Shipping Label</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Create and download the printable shipping label.
                  </p>
                </div>
              </div>
              <button
                className="studio-btn"
                onClick={handleGenerateLabel}
                disabled={loading}
              >
                {loading && action === "label" ? "Generating…" : "Generate Label"}
              </button>
            </div>
          )}

          {/* Schedule Pickup */}
          {canSchedulePickup && (
            <div className="studio-orders__action-card">
              <div className="studio-orders__action-info">
                <span className="studio-orders__action-icon" style={{ backgroundColor: "rgba(155, 89, 182, 0.12)", color: "var(--purple, #9b59b6)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <div>
                  <strong>Schedule Pickup</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Book a courier pickup for the scheduled date and time.
                  </p>
                </div>
              </div>
              <div className="studio-orders__action-form studio-orders__action-form--pickup">
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="studio-field__input studio-orders__date-input"
                  disabled={loading}
                />
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="studio-field__select studio-orders__time-select"
                  disabled={loading}
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
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <div className="studio-orders__action-card studio-orders__action-card--danger">
              <div className="studio-orders__action-info">
                <span className="studio-orders__action-icon" style={{ backgroundColor: "rgba(231, 76, 60, 0.12)", color: "var(--danger, #e74c3c)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </span>
                <div>
                  <strong>Cancel Shipment</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Cancel the shipment in Shiprocket. This cannot be undone.
                  </p>
                </div>
              </div>
              <button
                className="studio-btn studio-btn--danger"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading && action === "cancel" ? "Cancelling…" : "Cancel Shipment"}
              </button>
            </div>
          )}

          {/* All Done */}
          {!canCreateOrder && !canAssignAWB && !canGenerateLabel && !canSchedulePickup && !canCancel && (
            <div className="studio-orders__all-done">
              <div className="studio-orders__all-done-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <strong>All Shiprocket actions completed</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Shipment is ready for delivery.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}