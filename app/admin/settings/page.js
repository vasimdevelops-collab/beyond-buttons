"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input, Button, Card, Alert } from "@/components/admin/FormComponents";
import { Settings as SettingsIcon, Save } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

const INITIAL_SETTINGS = {
  brandName: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  facebook: "",
  youtube: "",
};

export default function SettingsPage() {
  const [formData, setFormData] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      
      if (data && typeof data === "object") {
        setFormData({
          brandName: data.brandName || "",
          email: data.email || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          address: data.address || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          youtube: data.youtube || "",
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      showAlert("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadSettings]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      showAlert("success", "Settings saved successfully! Changes will reflect on the website.");
      
      // Trigger revalidation
      try {
        await fetch("/api/revalidate", { method: "POST" });
      } catch (err) {
        console.log("Revalidation skipped:", err);
      }
    } catch (error) {
      console.error("Save error:", error);
      showAlert("error", "Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading settings...</p>
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

      <div className="admin-page-header">
        <h1 className="admin-page-title">Site Settings</h1>
        <p className="admin-page-description">Configure your website information and social links</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid" style={{ gap: "24px", maxWidth: "900px" }}>
          <Card title="Basic Information" description="Your brand and contact details">
            <Input
              label="Brand Name"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              placeholder="Beyond Buttons"
            />

            <div className="form-grid form-grid--2">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@beyondbuttons.in"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-grid form-grid--2">
              <Input
                label="WhatsApp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+919876543210 or https://wa.me/..."
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Mumbai, India"
              />
            </div>
          </Card>

          <Card title="Social Media" description="Connect your social media profiles">
            <Input
              label="Instagram"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/beyondbuttons"
            />

            <Input
              label="Facebook"
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/beyondbuttons"
            />

            <Input
              label="YouTube"
              name="youtube"
              value={formData.youtube}
              onChange={handleChange}
              placeholder="https://youtube.com/@beyondbuttons"
            />
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <Button type="button" variant="secondary" onClick={loadSettings}>
              Reset
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              <Save size={18} />
              Save Settings
            </Button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: "48px", padding: "20px", background: "#f5f5f5", borderRadius: "12px", maxWidth: "900px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "600" }}>
          💡 Quick Tips
        </h3>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#666", lineHeight: "1.8" }}>
          <li>Changes will reflect across the entire website instantly</li>
          <li>Social media links should be complete URLs (starting with https://)</li>
          <li>WhatsApp can be a number or a direct wa.me link</li>
          <li>All fields are optional - leave empty if not needed</li>
        </ul>
      </div>
    </AdminLayout>
  );
}
