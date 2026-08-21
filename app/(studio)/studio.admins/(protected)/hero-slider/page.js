"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";

import { toast } from "@/components/toast/toast-store";

const API = "/api/admin/hero-slides";

const EMPTY_DRAFT = {
  media: { id: "", src: "", alt: "", type: "image" },
  headline: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  active: true,
};

async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("folderId", "homepage");
  const response = await fetch("/api/media/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error("Upload failed");
  return response.json();
}

export default function StudioHeroSliderPage() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = creating
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const fileInputRef = useRef(null);

  const loadSlides = useCallback(async () => {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load slides");
      const data = await response.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Unable to load hero slides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSlides();
  }, [loadSlides]);

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
  }

  function openEdit(slide) {
    setDraft({
      media: { ...slide.media },
      headline: slide.headline || "",
      subtitle: slide.subtitle || "",
      ctaLabel: slide.ctaLabel || "",
      ctaHref: slide.ctaHref || "",
      active: slide.active !== false,
    });
    setEditingId(slide.id);
  }

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const asset = await uploadImage(file);
      setDraft((current) => ({
        ...current,
        media: {
          id: asset.id,
          src: asset.src,
          alt: current.media.alt || asset.alt || file.name,
          type: asset.type || "image",
        },
      }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!draft.media?.src) {
      toast.error("Add a slide image first");
      return;
    }
    setSaving(true);

    const payload = {
      media: draft.media,
      headline: draft.headline,
      subtitle: draft.subtitle,
      ctaLabel: draft.ctaLabel,
      ctaHref: draft.ctaHref,
      active: draft.active,
    };

    try {
      const isNew = editingId === "new";
      const response = await fetch(API, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? payload : { id: editingId, ...payload }),
      });
      if (!response.ok) throw new Error("Save failed");
      toast.success(isNew ? "Slide added" : "Slide updated");
      setEditingId(null);
      await loadSlides();
    } catch {
      toast.error("Unable to save slide");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const ordered = reordered.map((slide, i) => ({ id: slide.id, order: i }));

    try {
      const response = await fetch(`${API}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: ordered }),
      });
      if (!response.ok) throw new Error("Reorder failed");
      setSlides(reordered.map((slide, i) => ({ ...slide, order: i })));
      toast.success("Slides reordered");
    } catch {
      toast.error("Unable to reorder slides");
    }
  }

  async function handleToggle(slide) {
    try {
      const response = await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slide.id, active: !slide.active }),
      });
      if (!response.ok) throw new Error("Toggle failed");
      setSlides((current) =>
        current.map((item) => (item.id === slide.id ? { ...item, active: !item.active } : item))
      );
      toast.success(slide.active ? "Slide hidden" : "Slide activated");
    } catch {
      toast.error("Unable to update slide");
    }
  }

  async function handleDelete(slide) {
    const confirmed = window.confirm(`Delete slide "${slide.headline || slide.media?.alt || "Untitled"}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}?id=${encodeURIComponent(slide.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Slide deleted");
      if (editingId === slide.id) setEditingId(null);
      await loadSlides();
    } catch {
      toast.error("Unable to delete slide");
    }
  }

  const activeCount = slides.filter((slide) => slide.active).length;

  return (
    <div className="studio-products">
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Hero Slider</h1>
          <p className="studio-main__copy">
            Manage the homepage crossfade slides. {activeCount} of {slides.length} slide(s) live.
          </p>
        </div>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          onClick={openCreate}
          disabled={editingId !== null}
        >
          <Plus size={16} aria-hidden="true" /> Add Slide
        </button>
      </header>

      {loading ? (
        <div className="studio-table__empty" role="status">
          <p className="studio-table__empty-title">Loading hero slides…</p>
        </div>
      ) : (
        <>
          {editingId !== null ? (
            <form className="studio-editor__form" onSubmit={handleSave} noValidate>
              <section className="studio-section">
                <header className="studio-section__header">
                  <h2 className="studio-section__title">
                    {editingId === "new" ? "Add slide" : "Edit slide"}
                  </h2>
                </header>

                <div className="studio-section__fields">
                  <div className="studio-field studio-field--full">
                    <span className="studio-field__label">Slide image</span>
                    <div className="hero-slider-admin__image-row">
                      {draft.media?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="hero-slider-admin__thumb"
                          src={draft.media.src}
                          alt={draft.media.alt || "Slide preview"}
                        />
                      ) : (
                        <div className="hero-slider-admin__thumb hero-slider-admin__thumb--empty">
                          No image
                        </div>
                      )}
                      <div className="hero-slider-admin__image-actions">
                        <button
                          type="button"
                          className="studio-btn studio-btn--ghost"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {draft.media?.src ? "Replace image" : "Upload image"}
                        </button>
                        {draft.media?.src ? (
                          <button
                            type="button"
                            className="studio-btn studio-btn--ghost"
                            onClick={() => setDraft((current) => ({ ...current, media: { ...EMPTY_DRAFT.media } }))}
                          >
                            Remove
                          </button>
                        ) : null}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFileSelection}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="studio-field studio-field--full">
                    <span className="studio-field__label">Image URL</span>
                    <input
                      value={draft.media?.src || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          media: { ...current.media, src: event.target.value },
                        }))
                      }
                      placeholder="/api/media/… or https://…"
                    />
                  </label>

                  <label className="studio-field">
                    <span className="studio-field__label">Alt text</span>
                    <input
                      value={draft.media?.alt || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          media: { ...current.media, alt: event.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="studio-field studio-field--check">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(event) => updateDraft("active", event.target.checked)}
                    />
                    <span>
                      <span className="studio-field__label">Active</span>
                      <span className="studio-field__hint">
                        Live slides appear on the homepage slider.
                      </span>
                    </span>
                  </label>

                  <label className="studio-field studio-field--full">
                    <span className="studio-field__label">Headline (optional)</span>
                    <input
                      value={draft.headline}
                      onChange={(event) => updateDraft("headline", event.target.value)}
                      placeholder="e.g. The perfect solid shirt."
                    />
                  </label>

                  <label className="studio-field studio-field--full">
                    <span className="studio-field__label">Subtitle (optional)</span>
                    <textarea
                      rows={2}
                      value={draft.subtitle}
                      onChange={(event) => updateDraft("subtitle", event.target.value)}
                      placeholder="Short supporting line, or leave blank for a pure image slide."
                    />
                  </label>

                  <label className="studio-field">
                    <span className="studio-field__label">CTA label (optional)</span>
                    <input
                      value={draft.ctaLabel}
                      onChange={(event) => updateDraft("ctaLabel", event.target.value)}
                      placeholder="e.g. Shop Collection"
                    />
                  </label>

                  <label className="studio-field">
                    <span className="studio-field__label">CTA link (optional)</span>
                    <input
                      value={draft.ctaHref}
                      onChange={(event) => updateDraft("ctaHref", event.target.value)}
                      placeholder="e.g. /category/solid-t-shirts"
                    />
                  </label>
                </div>
              </section>

              <div className="studio-editor__bar">
                <p className="studio-editor__bar-note">
                  {draft.media?.src ? "Slide is ready to save." : "Upload or paste an image URL first."}
                </p>
                <div className="studio-editor__bar-actions">
                  <button
                    type="button"
                    className="studio-btn studio-btn--ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                  <button className="studio-btn studio-btn--primary" type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save slide"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {slides.length === 0 ? (
            <div className="studio-table__empty" role="status">
              <p className="studio-table__empty-title">No slides yet</p>
              <p className="studio-table__empty-copy">
                Add your first hero image to start the homepage slider.
              </p>
            </div>
          ) : (
            <section className="hero-slider-admin__list" aria-label="Hero slides">
              {slides.map((slide, index) => (
                <article key={slide.id} className="hero-slider-admin__card" data-active={slide.active}>
                  <div className="hero-slider-admin__card-order">{index + 1}</div>

                  <div className="hero-slider-admin__card-thumb">
                    {slide.media?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slide.media.src} alt={slide.media.alt || slide.headline || "Slide"} />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="hero-slider-admin__card-body">
                    <p className="hero-slider-admin__card-title">
                      {slide.headline || slide.media?.alt || "Untitled slide"}
                    </p>
                    <p className="hero-slider-admin__card-meta">
                      {slide.subtitle || "No subtitle"} · {slide.ctaLabel ? `CTA: ${slide.ctaLabel}` : "No CTA"}
                    </p>
                    <p className="hero-slider-admin__card-status">
                      {slide.active ? "Active" : "Hidden"}
                    </p>
                  </div>

                  <div className="hero-slider-admin__card-actions">
                    <div className="hero-slider-admin__card-arrows" role="group" aria-label="Reorder">
                      <button
                        type="button"
                        className="studio-btn studio-btn--ghost"
                        disabled={index === 0}
                        onClick={() => handleReorder(index, index - 1)}
                        aria-label={`Move ${slide.headline || "slide"} up`}
                      >
                        <ArrowUp size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="studio-btn studio-btn--ghost"
                        disabled={index === slides.length - 1}
                        onClick={() => handleReorder(index, index + 1)}
                        aria-label={`Move ${slide.headline || "slide"} down`}
                      >
                        <ArrowDown size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`studio-btn ${slide.active ? "studio-btn--ghost" : "studio-btn--primary"}`}
                      onClick={() => handleToggle(slide)}
                    >
                      {slide.active ? "Hide" : "Activate"}
                    </button>

                    <button
                      type="button"
                      className="studio-btn studio-btn--ghost"
                      onClick={() => openEdit(slide)}
                      aria-label={`Edit ${slide.headline || "slide"}`}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className="studio-btn studio-btn--danger"
                      onClick={() => handleDelete(slide)}
                      aria-label={`Delete ${slide.headline || "slide"}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}