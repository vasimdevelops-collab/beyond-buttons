"use client";

import { useEffect, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const DEFAULT_THEME = {
  defaultTheme: "light",
  accent: "#B08D57",
  background: "#F5F1EA",
  text: "#171717",
  card: "#FFFFFF",
  highlight: "#D4AF37",
};

export default function StudioThemePage() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [savedMessage, setSavedMessage] = useState("Theme draft is ready.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/theme", { cache: "no-store" });
        const data = await response.json();
        setTheme({ ...DEFAULT_THEME, ...data });
      } catch {
        setTheme(DEFAULT_THEME);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });

      if (response.ok) {
        const data = await response.json();
        setTheme({ ...DEFAULT_THEME, ...data });
        setSavedMessage("Theme settings saved successfully.");
        toast.success("Theme settings saved");
      }
    } catch {
      setSavedMessage("Unable to save theme.");
      toast.error("Unable to save theme");
    }
  }

  if (loading) {
    return (
      <div className="studio-table__empty" role="status">
        <p className="studio-table__empty-title">Loading theme…</p>
      </div>
    );
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Theme</h1>
          <p className="studio-main__copy">Visual identity settings used across the storefront.</p>
        </div>
      </header>

      <form className="studio-section" onSubmit={handleSubmit}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Brand theme</h2>
        </header>

        <div className="studio-section__fields">
          <label className="studio-field">
            <span className="studio-field__label">Default theme</span>
            <select value={theme.defaultTheme} onChange={(event) => setTheme((current) => ({ ...current, defaultTheme: event.target.value }))}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Accent color</span>
            <input type="color" value={theme.accent} onChange={(event) => setTheme((current) => ({ ...current, accent: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Background</span>
            <input type="color" value={theme.background} onChange={(event) => setTheme((current) => ({ ...current, background: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Text color</span>
            <input type="color" value={theme.text} onChange={(event) => setTheme((current) => ({ ...current, text: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Card background</span>
            <input type="color" value={theme.card} onChange={(event) => setTheme((current) => ({ ...current, card: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Highlight</span>
            <input type="color" value={theme.highlight} onChange={(event) => setTheme((current) => ({ ...current, highlight: event.target.value }))} />
          </label>
        </div>

        <div className="studio-editor__bar">
          <p className="studio-editor__bar-note">{savedMessage}</p>
          <div className="studio-editor__bar-actions">
            <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setTheme(DEFAULT_THEME)}>Reset</button>
            <button type="submit" className="studio-btn studio-btn--primary">Save theme</button>
          </div>
        </div>
      </form>
    </>
  );
}
