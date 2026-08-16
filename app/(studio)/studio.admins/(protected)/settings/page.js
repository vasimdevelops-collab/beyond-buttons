"use client";

import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  brandName: "Beyond Buttons",
  currency: "INR",
  locale: "en-IN",
  email: "hello@beyondbuttons.in",
  phone: "+91 98765 43210",
  supportHours: "Mon-Sat, 10am-7pm",
};

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
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch {
      setSavedMessage("Unable to save settings.");
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
          <label className="studio-field">
            <span className="studio-field__label">Brand name</span>
            <input value={settings.brandName} onChange={(event) => setSettings((current) => ({ ...current, brandName: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Currency</span>
            <input value={settings.currency} onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Locale</span>
            <input value={settings.locale} onChange={(event) => setSettings((current) => ({ ...current, locale: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Email</span>
            <input type="email" value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Phone</span>
            <input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} />
          </label>

          <label className="studio-field studio-field--full">
            <span className="studio-field__label">Support hours</span>
            <input value={settings.supportHours} onChange={(event) => setSettings((current) => ({ ...current, supportHours: event.target.value }))} />
          </label>
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
