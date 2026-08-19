"use client";

import { useEffect, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const DEFAULT_SETTINGS = {
  brandName: "Beyond Buttons",
  currency: "INR",
  locale: "en-IN",
  email: "hello@beyondbuttons.in",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  facebook: "",
  youtube: "",
  supportHours: "Mon-Sat, 10am-7pm",
  metaTitle: "Beyond Buttons",
  metaDescription: "Luxury Solid Shirt Brand",
  defaultTheme: "dark",
};

function Field({ label, value, onChange, type = "text", hint }) {
  return (
    <label className="studio-field">
      <span className="studio-field__label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small className="studio-field__hint">{hint}</small> : null}
    </label>
  );
}

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState("Store settings ready to publish.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function patch(payload) {
    setSettings((current) => ({ ...current, ...payload }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSavedMessage("Store settings saved successfully.");
        toast.success("Store settings saved");
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        setSavedMessage("Unable to save settings.");
        toast.error("Unable to save settings");
      }
    } catch {
      setSavedMessage("Unable to save settings.");
      toast.error("Unable to save settings");
    }
  }

  if (loading) {
    return (
      <div className="studio-table__empty" role="status">
        <p className="studio-table__empty-title">Loading settings…</p>
      </div>
    );
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Settings</h1>
          <p className="studio-main__copy">Brand identity, contact info, and storefront defaults.</p>
        </div>
      </header>

      <form className="studio-section" onSubmit={handleSubmit}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Store identity</h2>
        </header>

        <div className="studio-section__fields">
          <Field label="Brand name" value={settings.brandName} onChange={(value) => patch({ brandName: value })} />
          <Field label="Currency" value={settings.currency} onChange={(value) => patch({ currency: value })} />
          <Field label="Locale" value={settings.locale} onChange={(value) => patch({ locale: value })} />
          <Field label="Default theme" value={settings.defaultTheme} onChange={(value) => patch({ defaultTheme: value })} hint="dark or light" />
        </div>

        <header className="studio-section__header" style={{ marginTop: "2rem" }}>
          <h2 className="studio-section__title">Contact details</h2>
          <p className="studio-section__copy">
            These appear on the contact page, footer, and order notifications.
          </p>
        </header>

        <div className="studio-section__fields">
          <Field label="Email" type="email" value={settings.email} onChange={(value) => patch({ email: value })} />
          <Field label="Phone" value={settings.phone} onChange={(value) => patch({ phone: value })} />
          <Field label="WhatsApp" value={settings.whatsapp} onChange={(value) => patch({ whatsapp: value })} hint="Full number or link" />
          <Field label="Address" value={settings.address} onChange={(value) => patch({ address: value })} />
          <Field label="Support hours" value={settings.supportHours} onChange={(value) => patch({ supportHours: value })} hint="e.g. Mon-Sat, 10am-7pm" />
        </div>

        <header className="studio-section__header" style={{ marginTop: "2rem" }}>
          <h2 className="studio-section__title">Social media</h2>
        </header>

        <div className="studio-section__fields">
          <Field label="Instagram" value={settings.instagram} onChange={(value) => patch({ instagram: value })} />
          <Field label="Facebook" value={settings.facebook} onChange={(value) => patch({ facebook: value })} />
          <Field label="YouTube" value={settings.youtube} onChange={(value) => patch({ youtube: value })} />
        </div>

        <header className="studio-section__header" style={{ marginTop: "2rem" }}>
          <h2 className="studio-section__title">SEO & metadata</h2>
        </header>

        <div className="studio-section__fields">
          <Field label="Meta title" value={settings.metaTitle} onChange={(value) => patch({ metaTitle: value })} />
          <Field label="Meta description" value={settings.metaDescription} onChange={(value) => patch({ metaDescription: value })} />
        </div>

        <div className="studio-editor__bar">
          <p className="studio-editor__bar-note">{savedMessage}</p>
          <div className="studio-editor__bar-actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setSettings(DEFAULT_SETTINGS)}>Reset</button>
            <button type="submit" className="studio-btn studio-btn--primary">Save settings</button>
          </div>
        </div>
      </form>
    </>
  );
}