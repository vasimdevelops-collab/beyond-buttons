"use client";

import { useMemo, useState } from "react";

import { toast } from "@/components/toast/toast-store";

import { SIZE_KEYS } from "./pricing-panel";

const MEDIA_SLOT_KEYS = ["front", "back", "modelFront", "modelBack", "closeup", "lifestyle"];

// Brand palette pulled from the colors already used across the catalog, plus
// a few common additions. Staff click a swatch instead of typing a hex code.
const PRESET_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Off White", hex: "#F5F1EA" },
  { name: "Beige", hex: "#E8DCC8" },
  { name: "Black", hex: "#000000" },
  { name: "Charcoal", hex: "#3A3A3A" },
  { name: "Grey", hex: "#8C8C8C" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Olive", hex: "#5C9857" },
  { name: "Maroon", hex: "#5E1F1F" },
  { name: "Red", hex: "#B0212E" },
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    toast.error("Image upload failed");
    throw new Error("Upload failed");
  }
  const data = await response.json();
  toast.success("Image uploaded");
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

function ColorCard({ color, onOpen, isOpen }) {
  const label = color.name.trim() || "Untitled color";

  return (
    <button
      type="button"
      className="studio-color-card"
      data-open={isOpen ? "true" : "false"}
      onClick={() => onOpen(color.id)}
      aria-label={`Edit color ${label}`}
      aria-expanded={isOpen}
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
          {color.name.trim() ? null : <span>No name yet</span>}
        </span>
      </span>
      <span className="studio-color-card__action">{isOpen ? "Close" : "Edit"}</span>
    </button>
  );
}

function SwatchPicker({ hex, onChange }) {
  const selectedName = PRESET_COLORS.find(
    (entry) => entry.hex.toLowerCase() === String(hex || "").toLowerCase()
  )?.name;

  return (
    <div className="studio-swatch-picker">
      <div className="studio-swatch-grid" role="listbox" aria-label="Brand colors">
        {PRESET_COLORS.map((entry) => {
          const active =
            entry.hex.toLowerCase() === String(hex || "").toLowerCase();
          return (
            <button
              key={entry.hex}
              type="button"
              className="studio-swatch"
              role="option"
              aria-selected={active}
              title={entry.name}
              onClick={() => onChange({ hex: entry.hex })}
              style={{ background: entry.hex }}
              aria-label={entry.name}
            >
              <span className="studio-swatch__name">{entry.name}</span>
            </button>
          );
        })}
      </div>
      <div className="studio-swatch-fallback">
        <label className="studio-field__label">Or pick a custom color</label>
        <div className="studio-field__inline">
          <input
            type="color"
            name="colorHexPicker"
            value={/^#[0-9A-Fa-f]{6}$/.test(hex || "") ? hex : "#000000"}
            onChange={(event) => onChange({ hex: event.target.value })}
            aria-label="Pick a custom color"
          />
          <span className="studio-swatch-fallback__name">
            {selectedName ? `${selectedName} (${hex})` : `${hex || "#000000"}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function ColorEditor({ color, onBack, onChange, productName }) {
  const label = color.name.trim() || "Untitled color";
  const [uploading, setUploading] = useState(false);

  const mediaRefs = useMemo(() => mediaRefsFromColor(color.media || {}), [color.media]);

  function patch(partial) {
    onChange({ ...color, ...partial });
  }

  // Auto SKU: BB-<PRODUCT-NAME>-<COLOR>-<SIZE>, e.g. BB-CHARCOAL-OVERSIZED-M.
  const skuBase = useMemo(() => {
    const product = slugify(productName).toUpperCase().replace(/-+$/, "");
    const colorName = slugify(color.name).toUpperCase();
    return `BB${product ? `-${product}` : ""}${colorName ? `-${colorName}` : ""}`;
  }, [productName, color.name]);

  function skuForSize(size) {
    return `${skuBase}-${size}`;
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
        <div className="studio-color-editor__heading">
          <span
            className="studio-color-card__swatch studio-color-card__swatch--lg"
            style={{ background: color.hex || "#000000" }}
            aria-hidden="true"
          />
          <div>
            <p className="studio-main__eyebrow">Color &amp; Stock</p>
            <h3 className="studio-section__title">{label}</h3>
          </div>
        </div>
        <button
          type="button"
          className="studio-btn studio-btn--ghost"
          onClick={onBack}
        >
          Close
        </button>
      </header>

      <section
        className="studio-section"
        data-section="color-general"
        aria-labelledby="color-general-title"
      >
        <header className="studio-section__header">
          <h4 id="color-general-title" className="studio-section__title">
            Color
          </h4>
          <p className="studio-section__copy">
            Click a preset color below. If you have a new shade, pick it with the
            color box.
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
              placeholder="e.g. Black"
              autoComplete="off"
            />
          </label>
          <label className="studio-field studio-field--full">
            <span className="studio-field__label">Color Swatch</span>
            <SwatchPicker hex={color.hex} onChange={(partial) => patch(partial)} />
          </label>
        </div>
      </section>

      <section
        className="studio-section"
        data-section="color-media"
        aria-labelledby="color-media-title"
      >
        <header className="studio-section__header">
          <h4 id="color-media-title" className="studio-section__title">
            Product Images
          </h4>
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
          <h4 id="color-inventory-title" className="studio-section__title">
            Stock &amp; Sizes
          </h4>
          <p className="studio-section__copy">
            Type how many pieces you have in each size. SKUs are filled in
            automatically (e.g. {skuBase}-M).
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
                      value={row.sku || skuForSize(size)}
                      onChange={(event) =>
                        patchSize(size, "sku", event.target.value)
                      }
                      placeholder={skuForSize(size)}
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
 * Colors & Sizes — all colors on one page. The selected color expands inline
 * so staff never leave the main form. Local UI state only; no CRUD or API.
 */
export default function VariantsPanel({
  colors,
  selectedColorId,
  onAddColor,
  onSelectColor,
  onUpdateColor,
  productName,
}) {
  return (
    <section
      className="studio-section"
      data-section="variants"
      id="editor-panel-variants"
      aria-labelledby="product-variants-title"
    >
      <header className="studio-section__header studio-variants__header">
        <div>
          <h2 id="product-variants-title" className="studio-section__title">
            Colors &amp; Sizes
          </h2>
          <p className="studio-section__copy">
            Add the colors this product comes in, then set stock and photos for
            each one. Click a color to open its details below.
          </p>
        </div>
        <button
          type="button"
          className="studio-btn studio-btn--primary"
          onClick={onAddColor}
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
              <div
                className="studio-color-card-wrap"
                role="listitem"
                data-open={selectedColorId === color.id ? "true" : "false"}
                key={color.id}
              >
                <ColorCard
                  color={color}
                  onOpen={onSelectColor}
                  isOpen={selectedColorId === color.id}
                />
                {selectedColorId === color.id ? (
                  <ColorEditor
                    color={color}
                    onBack={() => onSelectColor(null)}
                    onChange={onUpdateColor}
                    productName={productName}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}