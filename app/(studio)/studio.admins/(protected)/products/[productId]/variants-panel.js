"use client";

import { useMemo, useState } from "react";

import { SIZE_KEYS } from "./pricing-panel";

const COLOR_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const MEDIA_SLOT_KEYS = ["front", "back", "modelFront", "modelBack", "closeup", "lifestyle"];

async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Upload failed");
  const data = await response.json();
  return {
    id: data.id || `media-${Date.now()}`,
    src: data.src || data.url,
    alt: data.alt || "",
    type: data.type || "image",
  };
}

function mediaRefsFromColor(media) {
  const refs = [];
  for (const key of MEDIA_SLOT_KEYS) {
    const slot = media?.[key];
    if (slot && typeof slot === "object" && slot.src) {
      refs.push({ id: slot.id, src: slot.src, alt: slot.alt || "", type: slot.type || "image" });
    }
  }
  for (const extra of media?.additional || []) {
    if (extra && typeof extra === "object" && extra.src) {
      refs.push({ id: extra.id, src: extra.src, alt: extra.alt || "", type: extra.type || "image" });
    }
  }
  return refs;
}

function mediaFromRefs(refs) {
  const next = {};
  refs.slice(0, MEDIA_SLOT_KEYS.length).forEach((ref, i) => {
    next[MEDIA_SLOT_KEYS[i]] = { id: ref.id, src: ref.src, alt: ref.alt || "", type: ref.type || "image" };
  });
  const additional = refs.slice(MEDIA_SLOT_KEYS.length).map((ref) => ({
    id: ref.id,
    src: ref.src,
    alt: ref.alt || "",
    type: ref.type || "image",
  }));
  if (additional.length > 0) next.additional = additional;
  return next;
}

export function createEmptyInventory() {
  return Object.fromEntries(
    SIZE_KEYS.map((size) => [
      size,
      { stock: "", sku: "", enabled: true },
    ])
  );
}

export function createEmptyColor(seed = {}) {
  return {
    id: seed.id || `color-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: seed.name || "",
    hex: seed.hex || "#000000",
    status: seed.status || "draft",
    media: {
      front: "",
      back: "",
      modelFront: "",
      modelBack: "",
      closeup: "",
      lifestyle: "",
      ...seed.media,
    },
    inventory: {
      ...createEmptyInventory(),
      ...seed.inventory,
    },
  };
}

function ColorCard({ color, onOpen }) {
  const label = color.name.trim() || "Untitled color";

  return (
    <button
      type="button"
      className="studio-color-card"
      onClick={() => onOpen(color.id)}
      aria-label={`Edit color ${label}`}
    >
      <span
        className="studio-color-card__swatch"
        style={{ background: color.hex || "#000000" }}
        aria-hidden="true"
      />
      <span className="studio-color-card__body">
        <strong className="studio-color-card__name">{label}</strong>
        <span className="studio-color-card__meta">
          <span>{color.hex || "—"}</span>
          <span data-status={color.status}>{color.status}</span>
        </span>
      </span>
      <span className="studio-color-card__action">Edit</span>
    </button>
  );
}

function VariantManager({ colors, onAdd, onOpen }) {
  return (
    <section
      className="studio-section"
      data-section="variants"
      aria-labelledby="product-variants-title"
    >
      <header className="studio-section__header studio-variants__header">
        <div>
          <h2 id="product-variants-title" className="studio-section__title">
            Variant Manager
          </h2>
          <p className="studio-section__copy">
            Unlimited colors. Type a color name, pick a hex, then open the card
            for media and stock.
          </p>
        </div>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          onClick={onAdd}
        >
          + Add Color
        </button>
      </header>

      <div className="studio-variants__body">
        {colors.length === 0 ? (
          <div className="studio-variants__empty" role="status">
            <p className="studio-variants__empty-title">No colors yet</p>
            <p className="studio-variants__empty-copy">
              Add a color to create the first variant card.
            </p>
          </div>
        ) : (
          <div className="studio-color-grid" role="list">
            {colors.map((color) => (
              <div key={color.id} role="listitem">
                <ColorCard color={color} onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ColorEditor({ color, onBack, onChange }) {
  const label = color.name.trim() || "Untitled color";
  const [uploading, setUploading] = useState(false);

  const mediaRefs = useMemo(() => mediaRefsFromColor(color.media || {}), [color.media]);

  function patch(partial) {
    onChange({ ...color, ...partial });
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const ref = await uploadProductImage(file);
      patch({ media: mediaFromRefs([...mediaRefs, ref]) });
    } catch {
      // ignore — the field stays as it was
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleRemoveImage(index) {
    patch({ media: mediaFromRefs(mediaRefs.filter((_, i) => i !== index)) });
  }

  function patchSize(size, key, value) {
    onChange({
      ...color,
      inventory: {
        ...color.inventory,
        [size]: {
          ...(color.inventory[size] || { stock: "", sku: "", enabled: true }),
          [key]: value,
        },
      },
    });
  }

  return (
    <div className="studio-color-editor" data-color-id={color.id}>
      <header className="studio-color-editor__top">
        <button
          type="button"
          className="studio-btn studio-btn--ghost"
          onClick={onBack}
        >
          Back to Variants
        </button>
        <div className="studio-color-editor__heading">
          <span
            className="studio-color-card__swatch studio-color-card__swatch--lg"
            style={{ background: color.hex || "#000000" }}
            aria-hidden="true"
          />
          <div>
            <p className="studio-main__eyebrow">Color Editor</p>
            <h2 className="studio-section__title">{label}</h2>
          </div>
        </div>
      </header>

      <section
        className="studio-section"
        data-section="color-general"
        aria-labelledby="color-general-title"
      >
        <header className="studio-section__header">
          <h3 id="color-general-title" className="studio-section__title">
            General
          </h3>
          <p className="studio-section__copy">
            Admin types the color name and selects the hex color.
          </p>
        </header>
        <div className="studio-section__fields">
          <label className="studio-field">
            <span className="studio-field__label">Color Name</span>
            <input
              type="text"
              name="colorName"
              value={color.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="Black"
              autoComplete="off"
            />
          </label>
          <label className="studio-field">
            <span className="studio-field__label">Hex Code</span>
            <div className="studio-field__inline">
              <input
                type="color"
                name="colorHexPicker"
                value={/^#[0-9A-Fa-f]{6}$/.test(color.hex) ? color.hex : "#000000"}
                onChange={(event) => patch({ hex: event.target.value })}
                aria-label="Select hex color"
              />
              <input
                type="text"
                name="colorHex"
                value={color.hex}
                onChange={(event) => patch({ hex: event.target.value })}
                placeholder="#000000"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </label>
          <label className="studio-field">
            <span className="studio-field__label">Status</span>
            <select
              name="colorStatus"
              value={color.status}
              onChange={(event) => patch({ status: event.target.value })}
            >
              {COLOR_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        className="studio-section"
        data-section="color-media"
        aria-labelledby="color-media-title"
      >
        <header className="studio-section__header">
          <h3 id="color-media-title" className="studio-section__title">
            Product Images
          </h3>
          <p className="studio-section__copy">
            Upload multiple images for this color. The first image is used as
            the main product photo on the storefront.
          </p>
        </header>
        <div className="studio-section__fields">
          <div className="studio-media-gallery">
            {mediaRefs.map((ref, index) => (
              <div className="studio-media-gallery__item" key={`${ref.id}-${index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ref.src} alt={ref.alt || "Product image"} />
                <button
                  type="button"
                  className="studio-media-gallery__remove"
                  onClick={() => handleRemoveImage(index)}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}

            <label className="studio-media-gallery__add">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={uploading}
              />
              <span>{uploading ? "Uploading…" : "+ Add Image"}</span>
            </label>
          </div>
        </div>
      </section>

      <section
        className="studio-section"
        data-section="color-inventory"
        aria-labelledby="color-inventory-title"
      >
        <header className="studio-section__header">
          <h3 id="color-inventory-title" className="studio-section__title">
            Stock &amp; Sizes
          </h3>
          <p className="studio-section__copy">
            Every size stores stock, enabled state, and SKU.
          </p>
        </header>
        <div className="studio-inventory">
          <div className="studio-inventory__head" role="row">
            <span>Size</span>
            <span>Stock</span>
            <span>SKU</span>
            <span>Enabled</span>
          </div>
          <ul className="studio-inventory__body">
            {SIZE_KEYS.map((size) => {
              const row = color.inventory[size] || {
                stock: "",
                sku: "",
                enabled: true,
              };
              return (
                <li className="studio-inventory__row" key={size}>
                  <label className="studio-field studio-field--compact">
                    <span className="visually-hidden">Size</span>
                    <select
                      name={`size-label-${size}`}
                      value={size}
                      disabled
                      aria-label={`Size ${size}`}
                    >
                      {SIZE_KEYS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="studio-field studio-field--compact">
                    <span className="visually-hidden">Stock {size}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name={`stock-${size}`}
                      value={row.stock}
                      onChange={(event) =>
                        patchSize(size, "stock", event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>
                  <label className="studio-field studio-field--compact">
                    <span className="visually-hidden">SKU {size}</span>
                    <input
                      type="text"
                      name={`sku-${size}`}
                      value={row.sku}
                      onChange={(event) =>
                        patchSize(size, "sku", event.target.value)
                      }
                      placeholder="SKU"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </label>
                  <label className="studio-field studio-field--check studio-field--compact-check">
                    <input
                      type="checkbox"
                      name={`enabled-${size}`}
                      checked={row.enabled}
                      onChange={(event) =>
                        patchSize(size, "enabled", event.target.checked)
                      }
                    />
                    <span className="studio-field__label">Enabled</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

/**
 * Variants tab — unlimited colors, media, stock & sizes.
 * Local UI state only; no CRUD or API.
 */
export default function VariantsPanel({
  colors,
  selectedColorId,
  onAddColor,
  onSelectColor,
  onUpdateColor,
}) {
  const selected = colors.find((color) => color.id === selectedColorId);

  if (selected) {
    return (
      <ColorEditor
        color={selected}
        onBack={() => onSelectColor(null)}
        onChange={onUpdateColor}
      />
    );
  }

  return (
    <VariantManager
      colors={colors}
      onAdd={onAddColor}
      onOpen={onSelectColor}
    />
  );
}
