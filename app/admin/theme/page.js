"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ColorPicker, Button, Card, Alert } from "@/components/admin/FormComponents";
import { Palette, Save, RotateCcw } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

const DEFAULT_THEME = {
  primaryColor: "#d4af37",
  secondaryColor: "#0a0a0a",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  accentColor: "#f5f5f5",
};

export default function ThemePage() {
  const [formData, setFormData] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadTheme = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/theme");
      const data = await response.json();
      
      if (data && typeof data === "object") {
        setFormData({
          primaryColor: data.primaryColor || DEFAULT_THEME.primaryColor,
          secondaryColor: data.secondaryColor || DEFAULT_THEME.secondaryColor,
          backgroundColor: data.backgroundColor || DEFAULT_THEME.backgroundColor,
          textColor: data.textColor || DEFAULT_THEME.textColor,
          accentColor: data.accentColor || DEFAULT_THEME.accentColor,
        });
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
      showAlert("error", "Failed to load theme");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTheme();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadTheme]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save theme");

      showAlert("success", "Theme saved successfully! Refresh to see changes.");
      
      // Apply theme to preview
      applyTheme(formData);
    } catch (error) {
      console.error("Save error:", error);
      showAlert("error", "Failed to save theme");
    } finally {
      setSubmitting(false);
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primaryColor);
    root.style.setProperty("--color-secondary", theme.secondaryColor);
    root.style.setProperty("--color-bg", theme.backgroundColor);
    root.style.setProperty("--color-text", theme.textColor);
    root.style.setProperty("--color-accent", theme.accentColor);
  }

  function handleReset() {
    if (!confirm("Reset theme to default colors?")) return;
    setFormData(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading theme...</p>
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
        <h1 className="admin-page-title">Theme Editor</h1>
        <p className="admin-page-description">Customize your website colors</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "1200px" }}>
        <form onSubmit={handleSubmit}>
          <Card title="Brand Colors" description="Customize your brand identity">
            <ColorPicker
              label="Primary Color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
            />

            <ColorPicker
              label="Secondary Color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
            />

            <ColorPicker
              label="Accent Color"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
            />

            <ColorPicker
              label="Background Color"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
            />

            <ColorPicker
              label="Text Color"
              name="textColor"
              value={formData.textColor}
              onChange={handleChange}
            />
          </Card>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button type="button" variant="secondary" onClick={handleReset}>
              <RotateCcw size={18} />
              Reset to Default
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              <Save size={18} />
              Save Theme
            </Button>
          </div>
        </form>

        <div>
          <Card title="Live Preview" description="See how your colors look">
            <div
              style={{
                padding: "32px",
                background: formData.backgroundColor,
                color: formData.textColor,
                borderRadius: "12px",
                border: `2px solid ${formData.accentColor}`,
              }}
            >
              <h2 style={{ margin: "0 0 16px", color: formData.primaryColor }}>
                Beyond Buttons
              </h2>
              <p style={{ margin: "0 0 24px", color: formData.textColor }}>
                Premium solid shirts crafted with attention to every detail. Experience luxury in simplicity.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  style={{
                    padding: "12px 24px",
                    background: formData.primaryColor,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Primary Button
                </button>
                <button
                  style={{
                    padding: "12px 24px",
                    background: formData.secondaryColor,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Secondary Button
                </button>
              </div>
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  background: formData.accentColor,
                  borderRadius: "8px",
                }}
              >
                <strong style={{ color: formData.textColor }}>Product Card</strong>
                <p style={{ margin: "8px 0 0", fontSize: "14px", opacity: 0.8 }}>
                  This is how your content will look with the accent background.
                </p>
              </div>
            </div>
          </Card>

          <div style={{ marginTop: "24px", padding: "20px", background: "#fffbf0", border: "1.5px solid #f0e6c8", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#856404" }}>
              💡 Color Tips
            </h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#856404", lineHeight: "1.7" }}>
              <li>Choose colors that reflect your brand identity</li>
              <li>Ensure good contrast between text and background</li>
              <li>Primary color is used for CTAs and important elements</li>
              <li>Changes apply site-wide after saving</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
