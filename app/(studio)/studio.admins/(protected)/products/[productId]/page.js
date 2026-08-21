"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import PricingPanel, { createEmptyPricing } from "./pricing-panel";
import VariantsPanel, { createEmptyColor } from "./variants-panel";

import { toast } from "@/components/toast/toast-store";

const PRODUCTS_PATH = "/studio.admins/products";

const EMPTY_GENERAL = {
  name: "",
  slug: "",
  category: "",
  status: "draft",
  featured: false,
  description: "",
  story: "",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SectionHeading({ title, copy, done, badge }) {
  return (
    <header className="studio-section__header">
      <div className="studio-section__heading">
        <span
          className="studio-section__check"
          data-done={done ? "true" : "false"}
          aria-hidden="true"
        >
          {done ? "✓" : "○"}
        </span>
        <div>
          <h2 className="studio-section__title">{title}</h2>
          <p className="studio-section__copy">{copy}</p>
        </div>
      </div>
      {badge}
    </header>
  );
}

export default function StudioProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params?.productId || "new");
  const isNew = productId === "new";

  const [general, setGeneral] = useState(EMPTY_GENERAL);
  const [colors, setColors] = useState([]);
  const [pricing, setPricing] = useState(createEmptyPricing());
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [categories, setCategories] = useState([]);
  const [savedNotice, setSavedNotice] = useState(null);
  const mountedRef = useRef(false);

  const title = useMemo(() => {
    if (isNew) return "New Product";
    return general.name.trim() || "Edit Product";
  }, [general.name, isNew]);

  const isVisible = general.status === "active";

  const basicsDone = general.name.trim() !== "";
  const colorsDone = colors.length > 0 && colors.every((color) => color.name.trim() !== "");
  const pricingDone = String(pricing.globalPrice ?? "").trim() !== "";
  const doneCount = [basicsDone, colorsDone, pricingDone].filter(Boolean).length;

  const progress = [
    { id: "basics", label: "Product Basics", done: basicsDone },
    { id: "colors", label: "Colors & Sizes", done: colorsDone },
    { id: "pricing", label: "Pricing", done: pricingDone },
  ];

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/categories", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (mountedRef.current) {
            setCategories(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        if (mountedRef.current) {
          setCategories([]);
        }
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (isNew) {
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load product");
        const product = await response.json();
        if (mountedRef.current) {
          setGeneral({
            name: product.generalInformation?.name || product.name || "",
            slug: product.slug || "",
            category: product.category || "",
            status: product.status === "active" ? "active" : "draft",
            featured: Boolean(product.featured),
            description: product.generalInformation?.description || "",
            story: product.story?.lead || product.story || "",
          });
          setColors(Array.isArray(product.colors) ? product.colors : []);
          const loadedPricing = {
            ...createEmptyPricing(),
            globalPrice:
              product.pricing?.basePrice ??
              product.pricing?.globalPrice ??
              product.price ??
              "",
            comparePrice:
              product.pricing?.comparePrice ??
              product.comparePrice ??
              "",
          };
          const loadedColorPrices = {};
          for (const c of Array.isArray(product.colors) ? product.colors : []) {
            if (c?.id && c.price != null) loadedColorPrices[c.id] = String(c.price);
          }
          if (Object.keys(loadedColorPrices).length > 0) {
            loadedPricing.colorPrices = loadedColorPrices;
            loadedPricing.differentPriceForColors = true;
          }
          setPricing(loadedPricing);
        }
      } catch {
        if (mountedRef.current) {
          setGeneral(EMPTY_GENERAL);
          setColors([]);
          setPricing(createEmptyPricing());
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    loadProduct();
  }, [isNew, productId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function markDirty() {
    setDirty(true);
  }

  function updateField(key, value) {
    setGeneral((current) => ({ ...current, [key]: value }));
    markDirty();
  }

  function handleNameChange(value) {
    setGeneral((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
    markDirty();
  }

  function handleAddColor() {
    const next = createEmptyColor();
    setColors((current) => [...current, next]);
    setSelectedColorId(next.id);
    markDirty();
  }

  function handleUpdateColor(nextColor) {
    setColors((current) =>
      current.map((color) => (color.id === nextColor.id ? nextColor : color))
    );
    markDirty();
  }

  function handlePricingChange(nextPricing) {
    setPricing(nextPricing);
    markDirty();
  }

  function handleDiscard() {
    setGeneral(EMPTY_GENERAL);
    setColors([]);
    setPricing(createEmptyPricing());
    setSelectedColorId(null);
    setSlugTouched(false);
    setShowAdvanced(false);
    setDirty(false);
  }

  async function handleDelete() {
    if (isNew) return;
    const confirmed = window.confirm("Delete this product from the catalog?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push(PRODUCTS_PATH);
      toast.success("Product deleted");
    } else {
      toast.error("Unable to delete product");
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    // Resolve price from whichever key the pricing state is currently shaped
    // with (globalPrice = panel, basePrice = API contract). Guard against a
    // future state-shape drift silently dropping the price from the payload.
    const priceSource =
      pricing?.globalPrice ?? pricing?.basePrice ?? pricing?.price;
    const compareSource =
      pricing?.comparePrice ?? pricing?.compareAtPrice;
    const parsedPrice = Number.parseFloat(priceSource);
    const parsedCompare = Number.parseFloat(compareSource);
    const resolvedPrice = priceSource === "" || priceSource == null || Number.isNaN(parsedPrice) ? null : parsedPrice;
    const resolvedComparePrice = compareSource === "" || compareSource == null || Number.isNaN(parsedCompare) ? null : parsedCompare;

    // The single "Visible on website" toggle maps to the product status. All
    // colors follow the same visibility so staff manage one switch, not three.
    const productStatus = general.status === "active" ? "active" : "draft";

    // Apply per-color price overrides, otherwise fall back to the global price.
    const resolvedColors = colors.map((color) => {
      const overrideSource = pricing.colorPrices?.[color.id];
      const parsedOverride = Number.parseFloat(overrideSource);
      const override =
        pricing.differentPriceForColors && overrideSource != null && !Number.isNaN(parsedOverride)
          ? parsedOverride
          : null;
      return {
        ...color,
        status: productStatus,
        price: override != null ? override : resolvedPrice,
        comparePrice: resolvedComparePrice,
      };
    });

    const payload = {
      id: isNew ? undefined : productId,
      name: general.name.trim(),
      slug: slugify(general.slug || general.name),
      category: general.category || categories[0]?.name || "Uncategorized",
      categoryId: general.category || categories[0]?.slug || "uncategorized",
      status: productStatus,
      featured: Boolean(general.featured),
      price: resolvedPrice,
      comparePrice: resolvedComparePrice,
      generalInformation: {
        name: general.name.trim(),
        shortName: general.name.trim(),
        description: general.description.trim(),
        brandStatement: general.story.trim(),
      },
      story: {
        lead: general.story.trim(),
        body: general.description.trim(),
      },
      colors: resolvedColors,
      pricing: {
        basePrice: resolvedPrice,
        comparePrice: resolvedComparePrice,
      },
    };

    const response = await fetch("/api/admin/products", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const saved = await response.json();
      setDirty(false);
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) {
        setSavedNotice({
          type: "success",
          title: "Product added successfully",
          name: general.name.trim(),
          href: `/product/${saved?.slug || slugify(general.slug || general.name)}`,
        });
        setGeneral(EMPTY_GENERAL);
        setColors([]);
        setPricing(createEmptyPricing());
        setSelectedColorId(null);
        setSlugTouched(false);
        setShowAdvanced(false);
      }
    } else {
      let message = "Unable to save product.";
      try {
        const data = await response.json();
        message = data.error || data.message || message;
      } catch {
        // ignore
      }
      setSavedNotice({ type: "error", title: message, name: "", href: null });
      toast.error(message);
    }
  }

  return (
    <div className="studio-editor" data-product-id={productId} data-state={loading ? "loading" : "ready"}>
      <header className="studio-main__header studio-editor__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">{title}</h1>
          <p className="studio-main__copy">
            Everything on one page — fill the sections below and save.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link className="studio-btn studio-btn--ghost" href={PRODUCTS_PATH}>
            Back to Products
          </Link>
          {!isNew ? (
            <button type="button" className="studio-btn studio-btn--ghost" onClick={handleDelete}>
              Delete
            </button>
          ) : null}
        </div>
      </header>

      {savedNotice ? (
        <div
          className={`studio-notice studio-notice--${savedNotice.type}`}
          role="status"
        >
          <p className="studio-notice__text">
            <strong>{savedNotice.title}</strong>
            {savedNotice.name ? ` — ${savedNotice.name}` : ""}
            {savedNotice.href ? (
              <>
                {" "}
                <Link
                  className="studio-notice__link"
                  href={savedNotice.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View product
                </Link>
              </>
            ) : null}
          </p>
          <button
            type="button"
            className="studio-notice__close"
            onClick={() => setSavedNotice(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="studio-progress" role="status" aria-live="polite">
        <span className="studio-progress__label">
          {doneCount} of {progress.length} sections complete
        </span>
        <ol className="studio-progress__list">
          {progress.map((item) => (
            <li
              key={item.id}
              className="studio-progress__item"
              data-done={item.done ? "true" : "false"}
            >
              <span aria-hidden="true">{item.done ? "✓" : "○"}</span>
              {item.label}
            </li>
          ))}
        </ol>
      </div>

      {loading ? (
        <div className="studio-table__empty" role="status">
          <p className="studio-table__empty-title">Loading product…</p>
        </div>
      ) : (
        <form className="studio-editor__form" onSubmit={handleSave} noValidate>
          <section className="studio-section" data-section="general" id="editor-panel-general">
            <SectionHeading
              title="Product Basics"
              copy="Name, category, and whether the product is visible on the website."
              done={basicsDone}
            />

            <div className="studio-section__fields">
              <label className="studio-field">
                <span className="studio-field__label">Product Name</span>
                <input
                  name="name"
                  type="text"
                  value={general.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Charcoal Oversized Shirt"
                  autoComplete="off"
                />
                <span className="studio-field__hint">
                  The web address (slug) and size SKUs are created automatically from this name.
                </span>
              </label>

              <label className="studio-field studio-field--check studio-field--full">
                <input
                  name="visible"
                  type="checkbox"
                  checked={isVisible}
                  onChange={(event) =>
                    updateField("status", event.target.checked ? "active" : "draft")
                  }
                />
                <span>
                  <span className="studio-field__label">Visible on website</span>
                  <span className="studio-field__hint">
                    Yes = shown on the site. No = hidden (kept as a draft). This controls
                    the product and all its colors.
                  </span>
                </span>
              </label>

              <label className="studio-field">
                <span className="studio-field__label">Category</span>
                <select
                  name="category"
                  value={general.category}
                  onChange={(event) => updateField("category", event.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id || category.slug} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="studio-field studio-field--check">
                <input
                  name="featured"
                  type="checkbox"
                  checked={general.featured}
                  onChange={(event) => updateField("featured", event.target.checked)}
                />
                <span>
                  <span className="studio-field__label">Featured</span>
                  <span className="studio-field__hint">
                    Highlight the product across storefront surfaces.
                  </span>
                </span>
              </label>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Description</span>
                <textarea
                  name="description"
                  rows={4}
                  value={general.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Product description"
                />
              </label>

              <label className="studio-field studio-field--full">
                <span className="studio-field__label">Story</span>
                <textarea
                  name="story"
                  rows={8}
                  value={general.story}
                  onChange={(event) => updateField("story", event.target.value)}
                  placeholder="Product story and craft narrative"
                />
              </label>

              <div className="studio-field studio-field--full">
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  onClick={() => setShowAdvanced((value) => !value)}
                  aria-expanded={showAdvanced}
                >
                  {showAdvanced ? "Hide" : "Show"} advanced options
                </button>
                {showAdvanced ? (
                  <div className="studio-field__advanced">
                    <label className="studio-field">
                      <span className="studio-field__label">Slug (web address)</span>
                      <input
                        name="slug"
                        type="text"
                        value={general.slug}
                        onChange={(event) => {
                          setSlugTouched(true);
                          updateField("slug", slugify(event.target.value));
                        }}
                        placeholder="product-slug"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <span className="studio-field__hint">
                        Auto-generated from the product name. Edit only if you need a
                        custom link.
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <VariantsPanel
            colors={colors}
            selectedColorId={selectedColorId}
            onAddColor={handleAddColor}
            onSelectColor={setSelectedColorId}
            onUpdateColor={handleUpdateColor}
            productName={general.name}
          />

          <PricingPanel pricing={pricing} colors={colors} onChange={handlePricingChange} />

          <div className="studio-editor__bar" data-dirty={dirty ? "true" : "false"}>
            <p className="studio-editor__bar-note">
              {dirty ? "Unsaved local changes" : "No local changes"}
            </p>
            <div className="studio-editor__bar-actions">
              <button
                className="studio-btn studio-btn--ghost"
                type="button"
                onClick={handleDiscard}
                disabled={!dirty}
              >
                Discard
              </button>
              <button className="studio-btn studio-btn--primary" type="submit">
                Save
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}