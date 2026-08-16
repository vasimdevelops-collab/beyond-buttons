"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input, Select, Toggle, Button, Card, Alert } from "@/components/admin/FormComponents";
import { Plus, Edit2, Trash2, Tag, Search, X } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

const INITIAL_COUPON = {
  code: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(INITIAL_COUPON);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadCoupons = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      const data = await response.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      showAlert("error", "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCoupons();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadCoupons]);

  function handleChange(e) {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.code?.trim()) newErrors.code = "Coupon code is required";
    if (!formData.value || isNaN(formData.value) || Number(formData.value) <= 0) {
      newErrors.value = "Valid discount value is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const method = editingCoupon ? "PUT" : "POST";
      const response = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingCoupon?.id,
          code: formData.code.toUpperCase(),
          value: Number(formData.value),
          minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save coupon");

      showAlert("success", `Coupon ${editingCoupon ? "updated" : "created"} successfully!`);
      setShowForm(false);
      setEditingCoupon(null);
      setFormData(INITIAL_COUPON);
      loadCoupons();
    } catch (error) {
      console.error("Save error:", error);
      showAlert("error", "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;

    try {
      const response = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete coupon");

      showAlert("success", "Coupon deleted successfully");
      loadCoupons();
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("error", "Failed to delete coupon");
    }
  }

  function handleEdit(coupon) {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      type: coupon.type || "percentage",
      value: coupon.value || "",
      minOrderValue: coupon.minOrderValue || "",
      maxDiscount: coupon.maxDiscount || "",
      usageLimit: coupon.usageLimit || "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      active: coupon.active !== false,
    });
    setShowForm(true);
  }

  const filteredCoupons = coupons.filter((c) =>
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading coupons...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {alert && (
        <div style={{ marginBottom: "20px" }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {!showForm ? (
        <>
          <div className="admin-page-header">
            <h1 className="admin-page-title">Coupons</h1>
            <p className="admin-page-description">Create and manage discount codes</p>
            <div className="admin-page-actions">
              <div style={{ position: "relative", flex: "1", maxWidth: "400px" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search coupons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                Add Coupon
              </Button>
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="admin-table-container">
              <div className="admin-empty-state">
                <Tag />
                <h3>No coupons found</h3>
                <p>Start by creating your first discount coupon</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} />
                  Add Coupon
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min Order</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>
                        <strong style={{ fontFamily: "monospace" }}>{coupon.code}</strong>
                      </td>
                      <td>
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : `₹${coupon.value}`}
                        {coupon.maxDiscount && ` (max ₹${coupon.maxDiscount})`}
                      </td>
                      <td>₹{coupon.minOrderValue || 0}</td>
                      <td>
                        {coupon.usedCount || 0}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                      </td>
                      <td>
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString()
                          : "No expiry"}
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            coupon.active ? "success" : "default"
                          }`}
                        >
                          {coupon.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleEdit(coupon)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            onClick={() => handleDelete(coupon)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCoupon(null);
                setFormData(INITIAL_COUPON);
                setErrors({});
              }}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f5f5f5",
                border: "1.5px solid #e0e0e0",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="admin-page-title" style={{ margin: 0 }}>
                {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card title="Coupon Details">
              <div className="form-grid form-grid--2">
                <Input
                  label="Coupon Code"
                  name="code"
                  value={formData.code}
                  onChange={(e) => handleChange({
                    ...e,
                    target: { ...e.target, value: e.target.value.toUpperCase() }
                  })}
                  error={errors.code}
                  required
                  placeholder="SUMMER2024"
                  style={{ textTransform: "uppercase" }}
                />
                <Select
                  label="Discount Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount (₹)" },
                  ]}
                />
              </div>

              <div className="form-grid form-grid--3">
                <Input
                  label="Discount Value"
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleChange}
                  error={errors.value}
                  required
                  placeholder={formData.type === "percentage" ? "10" : "100"}
                />
                <Input
                  label="Min Order Value"
                  name="minOrderValue"
                  type="number"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  placeholder="0"
                />
                {formData.type === "percentage" && (
                  <Input
                    label="Max Discount"
                    name="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                    placeholder="500"
                  />
                )}
              </div>

              <div className="form-grid form-grid--2">
                <Input
                  label="Usage Limit"
                  name="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  placeholder="Unlimited"
                />
                <Input
                  label="Expires At"
                  name="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={handleChange}
                />
              </div>

              <Toggle
                label="Active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                description="Customers can use this coupon"
              />
            </Card>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingCoupon(null);
                  setFormData(INITIAL_COUPON);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
