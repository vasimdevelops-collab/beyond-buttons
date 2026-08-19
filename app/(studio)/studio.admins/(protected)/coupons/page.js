"use client";

import { useEffect, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const EMPTY_DRAFT = {
  code: "",
  type: "percent",
  value: 10,
  active: true,
  endsAt: "",
  usageLimit: 100,
};

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

export default function StudioCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/coupons", { cache: "no-store" });
        const data = await response.json();
        setCoupons(Array.isArray(data) ? data : []);
      } catch {
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function refresh() {
    const response = await fetch("/api/admin/coupons", { cache: "no-store" });
    const data = await response.json();
    setCoupons(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!draft.code.trim()) return;

    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: draft.code.trim(),
        type: draft.type,
        value: Number(draft.value) || 0,
        active: draft.active,
        endsAt: draft.endsAt,
        usageLimit: Number(draft.usageLimit) || 0,
      }),
    });

    if (response.ok) {
      await refresh();
      setDraft(EMPTY_DRAFT);
      toast.success("Coupon created");
    } else {
      toast.error("Unable to create coupon");
    }
  }

  async function handleDelete(couponId) {
    const response = await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponId)}`, { method: "DELETE" });
    if (response.ok) {
      await refresh();
      toast.success("Coupon deleted");
    } else {
      toast.error("Unable to delete coupon");
    }
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Coupons</h1>
          <p className="studio-main__copy">Create and manage discount codes for promotions and campaigns.</p>
        </div>
      </header>

      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Add coupon</h2>
        </header>

        <form className="studio-section__fields" onSubmit={handleSubmit}>
          <label className="studio-field">
            <span className="studio-field__label">Code</span>
            <input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} placeholder="SAVE10" />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Type</span>
            <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Value</span>
            <input type="number" min="0" value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Usage limit</span>
            <input type="number" min="0" value={draft.usageLimit} onChange={(event) => setDraft((current) => ({ ...current, usageLimit: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">End date</span>
            <input type="date" value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Status</span>
            <select value={draft.active ? "active" : "inactive"} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.value === "active" }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="studio-editor__bar" style={{ gridColumn: "1 / -1" }}>
            <div className="studio-editor__bar-actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setDraft(EMPTY_DRAFT)}>Reset</button>
              <button type="submit" className="studio-btn studio-btn--primary">Create coupon</button>
            </div>
          </div>
        </form>
      </section>

      <section className="studio-table" data-state={coupons.length ? "ready" : "empty"} aria-label="Coupons">
        <div className="studio-table__head" role="row">
          <span>Code</span>
          <span>Type</span>
          <span>Value</span>
          <span>Status</span>
          <span>Ends</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">Loading coupons…</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No coupons yet</p>
            <p className="studio-table__empty-copy">Create a coupon to start running promotions.</p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {coupons.map((coupon) => (
              <li key={coupon.id}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{coupon.code}</strong>
                    <small>{coupon.usageLimit ? `${coupon.usedCount || 0}/${coupon.usageLimit} used` : "Unlimited"}</small>
                  </span>
                  <span>{coupon.type}</span>
                  <span>{coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`}</span>
                  <span className="studio-table__status" data-status={coupon.active ? "active" : "archived"}>{coupon.active ? "Active" : "Inactive"}</span>
                  <span>{formatDate(coupon.endsAt)}</span>
                  <span><button type="button" className="studio-btn studio-btn--ghost studio-btn--danger" onClick={() => handleDelete(coupon.id)}>Delete</button></span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
