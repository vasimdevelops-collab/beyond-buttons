"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_FORM = {
  label: "Beyond Buttons",
  scrollLabel: "Scroll",
  media: { type: "image", src: "/images/homeback.jpeg", alt: "Beyond Buttons campaign" },
  headlineLines: ["We don't sell shirts.", "We define presence."],
  subtitleLines: ["Crafted with premium fabrics,", "timeless tailoring,", "and confidence in every stitch."],
  buttons: {
    primary: { label: "Shop Collection", href: "/shop" },
    secondary: { label: "Our Story", href: "/about" },
  },
};

function parseLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export default function StudioHomepagePage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/site/homepage", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load homepage data");
        const data = await response.json();
        if (!active) return;

        setForm({
          label: data?.hero?.label || DEFAULT_FORM.label,
          scrollLabel: data?.hero?.scrollLabel || DEFAULT_FORM.scrollLabel,
          media: {
            type: data?.hero?.media?.type || "image",
            src: data?.hero?.media?.src || "",
            alt: data?.hero?.media?.alt || "",
          },
          headlineLines:
            Array.isArray(data?.hero?.headlineLines) && data.hero.headlineLines.length
              ? data.hero.headlineLines
              : DEFAULT_FORM.headlineLines,
          subtitleLines:
            Array.isArray(data?.hero?.subtitleLines) && data.hero.subtitleLines.length
              ? data.hero.subtitleLines
              : DEFAULT_FORM.subtitleLines,
          buttons: {
            primary: {
              label: data?.hero?.buttons?.primary?.label || DEFAULT_FORM.buttons.primary.label,
              href: data?.hero?.buttons?.primary?.href || DEFAULT_FORM.buttons.primary.href,
            },
            secondary: {
              label: data?.hero?.buttons?.secondary?.label || DEFAULT_FORM.buttons.secondary.label,
              href: data?.hero?.buttons?.secondary?.href || DEFAULT_FORM.buttons.secondary.href,
            },
          },
        });
      } catch {
        setForm(DEFAULT_FORM);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setSavedMessage("");

    try {
      const payload = {
        hero: {
          label: form.label,
          scrollLabel: form.scrollLabel,
          media: {
            type: form.media.src ? (form.media.type || "image") : null,
            src: form.media.src || null,
            alt: form.media.alt || "",
          },
          headlineLines: form.headlineLines,
          subtitleLines: form.subtitleLines,
          buttons: {
            primary: form.buttons.primary,
            secondary: form.buttons.secondary,
          },
        },
      };

      const response = await fetch("/api/site/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setSavedMessage("Homepage hero saved successfully.");
    } catch {
      setSavedMessage("Unable to save homepage right now.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({
        ...current,
        media: {
          ...current.media,
          type: file.type.startsWith("video") ? "video" : "image",
          src: dataUrl,
          alt: current.media.alt || file.name,
        },
      }));
      setSavedMessage("Image selected. Save to publish it.");
    } catch {
      setSavedMessage("Unable to read the selected image.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="studio-products">
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Homepage</h1>
          <p className="studio-main__copy">Edit the hero content and replace the image with a local file in one click.</p>
        </div>
      </header>

      {loading ? (
        <div className="studio-table__empty" role="status">
          <p className="studio-table__empty-title">Loading homepage…</p>
        </div>
      ) : (
        <form className="studio-editor__form" onSubmit={handleSave} noValidate>
          <section className="studio-section">
            <header className="studio-section__header">
              <h2 className="studio-section__title">Hero</h2>
            </header>

            <div className="studio-section__fields">
              <label className="studio-field">
                <span className="studio-field__label">Hero label</span>
                <input value={form.label || ""} onChange={(event) => updateField("label", event.target.value)} />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Scroll label</span>
                <input value={form.scrollLabel || ""} onChange={(event) => updateField("scrollLabel", event.target.value)} />
              </label>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Headline lines</span>
                <textarea rows={3} value={form.headlineLines.join("\n")} onChange={(event) => updateField("headlineLines", parseLines(event.target.value))} />
              </label>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Subtitle lines</span>
                <textarea rows={4} value={form.subtitleLines.join("\n")} onChange={(event) => updateField("subtitleLines", parseLines(event.target.value))} />
              </label>

              <div className="studio-field studio-field--full">
                <span className="studio-field__label">Hero image</span>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={() => fileInputRef.current?.click()}>
                    Choose image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelection} />
                  <span style={{ color: "#666", fontSize: "0.9rem" }}>{form.media.src ? "Image selected" : "No image selected"}</span>
                </div>
              </div>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Hero image URL</span>
                <input value={form.media.src || ""} onChange={(event) => setForm((current) => ({ ...current, media: { ...current.media, src: event.target.value } }))} />
              </label>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Image alt text</span>
                <input value={form.media.alt || ""} onChange={(event) => setForm((current) => ({ ...current, media: { ...current.media, alt: event.target.value } }))} />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Primary CTA label</span>
                <input value={form.buttons.primary.label} onChange={(event) => setForm((current) => ({ ...current, buttons: { ...current.buttons, primary: { ...current.buttons.primary, label: event.target.value } } }))} />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Primary CTA link</span>
                <input value={form.buttons.primary.href} onChange={(event) => setForm((current) => ({ ...current, buttons: { ...current.buttons, primary: { ...current.buttons.primary, href: event.target.value } } }))} />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Secondary CTA label</span>
                <input value={form.buttons.secondary.label} onChange={(event) => setForm((current) => ({ ...current, buttons: { ...current.buttons, secondary: { ...current.buttons.secondary, label: event.target.value } } }))} />
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Secondary CTA link</span>
                <input value={form.buttons.secondary.href} onChange={(event) => setForm((current) => ({ ...current, buttons: { ...current.buttons, secondary: { ...current.buttons.secondary, href: event.target.value } } }))} />
              </label>
            </div>
          </section>

          <div className="studio-editor__bar">
            <p className="studio-editor__bar-note">{savedMessage || "Hero content is ready to publish."}</p>
            <div className="studio-editor__bar-actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={async () => { try { setSaving(true); const response = await fetch("/api/site/homepage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hero: { ...form, media: { type: null, src: null, alt: "" } } }) }); if (!response.ok) throw new Error("Delete failed"); setForm((current) => ({ ...current, media: { type: "image", src: "", alt: "" } })); setSavedMessage("Homepage hero image removed."); } catch { setSavedMessage("Unable to remove the homepage image."); } finally { setSaving(false); } }}>Delete image</button>
              <button className="studio-btn studio-btn--primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
