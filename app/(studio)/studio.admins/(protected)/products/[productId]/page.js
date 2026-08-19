"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import PricingPanel, { createEmptyPricing } from "./pricing-panel";
import VariantsPanel, { createEmptyColor } from "./variants-panel";

import { toast } from "@/components/toast/toast-store";

const PRODUCTS_PATH = "/studio.admins/products";

const EDITOR_TABS = [
  { id: "general", label: "General" },
  { id: "variants", label: "Variants" },
  { id: "pricing", label: "Pricing" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const EMPTY_GENERAL = {
  name: "",
  slug: "",
  category: "",
  status: "active",
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

export default function StudioProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params?.productId || "new");
  const isNew = productId === "new";

  const [tab, setTab] = useState("general");
  const [general, setGeneral] = useState(EMPTY_GENERAL);
  const [colors, setColors] = useState([]);
  const [pricing, setPricing] = useState(createEmptyPricing());
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [categories, setCategories] = useState([]);
  const [savedNotice, setSavedNotice] = useState(null);
  const mountedRef = useRef(false);

  const title = useMemo(() => {
    if (isNew) return "New Product";
    return general.name.trim() || "Edit Product";
  }, [general.name, isNew]);

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
            status: product.status || "draft",
            featured: Boolean(product.featured),
            description: product.generalInformation?.description || "",
            story: product.story?.lead || product.story || "",
          });
          setColors(Array.isArray(product.colors) ? product.colors : []);
          setPricing({ ...createEmptyPricing(), ...(product.pricing || {}) });
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
    setTab("variants");
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
    setDirty(false);
    setTab("general");
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

    const payload = {
      id: isNew ? undefined : productId,
      name: general.name.trim(),
      slug: slugify(general.slug || general.name),
      category: general.category || categories[0]?.name || "Uncategorized",
      categoryId: general.category || categories[0]?.slug || "uncategorized",
      status: general.status,
      featured: Boolean(general.featured),
      price: pricing?.basePrice || null,
      comparePrice: pricing?.comparePrice || null,
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
      colors,
      pricing,
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
        setTab("general");
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
            Edit product data and save it to the live storefront catalog.
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

      <div className="studio-tabs" role="tablist" aria-label="Product editor sections">
        {EDITOR_TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`editor-tab-${item.id}`}
              className="studio-tabs__item"
              aria-selected={selected}
              aria-controls={`editor-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              data-active={selected ? "true" : "false"}
              onClick={() => {
                setTab(item.id);
                if (item.id !== "variants") setSelectedColorId(null);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="studio-table__empty" role="status">
          <p className="studio-table__empty-title">Loading product…</p>
        </div>
      ) : (
        <form className="studio-editor__form" onSubmit={handleSave} noValidate>
          {tab === "general" ? (
            <section
              className="studio-section"
              data-section="general"
              id="editor-panel-general"
              role="tabpanel"
              aria-labelledby="editor-tab-general"
            >
              <header className="studio-section__header">
                <h2 id="product-general-title" className="studio-section__title">
                  General
                </h2>
                <p className="studio-section__copy">
                  Core identity and publishing fields for the product record.
                </p>
              </header>

              <div className="studio-section__fields">
                <label className="studio-field">
                  <span className="studio-field__label">Product Name</span>
                  <input
                    name="name"
                    type="text"
                    value={general.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="Product name"
                    autoComplete="off"
                  />
                </label>

                <label className="studio-field">
                  <span className="studio-field__label">Slug</span>
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

                <label className="studio-field">
                  <span className="studio-field__label">Status</span>
                  <select
                    name="status"
                    value={general.status}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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
              </div>
            </section>
          ) : null}

          {tab === "variants" ? (
            <div id="editor-panel-variants" role="tabpanel" aria-labelledby="editor-tab-variants">
              <VariantsPanel
                colors={colors}
                selectedColorId={selectedColorId}
                onAddColor={handleAddColor}
                onSelectColor={setSelectedColorId}
                onUpdateColor={handleUpdateColor}
              />
            </div>
          ) : null}

          {tab === "pricing" ? (
            <PricingPanel pricing={pricing} colors={colors} onChange={handlePricingChange} />
          ) : null}

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
