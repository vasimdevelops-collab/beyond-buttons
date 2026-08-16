"use client";

import { useEffect, useState } from "react";

const EMPTY_DRAFT = {
  name: "",
  slug: "",
  description: "",
  visibility: true,
  order: 1,
};

export default function StudioCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/categories", { cache: "no-store" });
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function refresh() {
    const response = await fetch("/api/admin/categories", { cache: "no-store" });
    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    const payload = {
      id: editingId || undefined,
      name: draft.name.trim(),
      slug: draft.slug.trim() || draft.name.trim(),
      description: draft.description.trim(),
      visibility: draft.visibility,
      order: Number(draft.order) || 1,
    };

    const response = await fetch("/api/admin/categories", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await refresh();
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
    }
  }

  async function handleDelete(categoryId) {
    const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(categoryId)}`, { method: "DELETE" });
    if (response.ok) {
      await refresh();
      if (editingId === categoryId) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }
    }
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      visibility: category.visibility !== false,
      order: category.order ?? 1,
    });
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Categories</h1>
          <p className="studio-main__copy">Create, edit, and manage storefront category structure.</p>
        </div>
      </header>

      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">{editingId ? "Edit category" : "Add category"}</h2>
        </header>

        <form className="studio-section__fields" onSubmit={handleSubmit}>
          <label className="studio-field">
            <span className="studio-field__label">Name</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Premium Tees" />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Slug</span>
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="premium-tees" />
          </label>

          <label className="studio-field studio-field--full">
            <span className="studio-field__label">Description</span>
            <textarea rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Short category description" />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Order</span>
            <input type="number" min="1" value={draft.order} onChange={(event) => setDraft((current) => ({ ...current, order: event.target.value }))} />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Visibility</span>
            <select value={draft.visibility ? "visible" : "hidden"} onChange={(event) => setDraft((current) => ({ ...current, visibility: event.target.value === "visible" }))}>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>

          <div className="studio-editor__bar" style={{ gridColumn: "1 / -1" }}>
            <div className="studio-editor__bar-actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => { setDraft(EMPTY_DRAFT); setEditingId(null); }}>Reset</button>
              <button type="submit" className="studio-btn studio-btn--primary">{editingId ? "Save changes" : "Add category"}</button>
            </div>
          </div>
        </form>
      </section>

      <section className="studio-table" data-state={categories.length ? "ready" : "empty"} aria-label="Categories">
        <div className="studio-table__head" role="row">
          <span>Name</span>
          <span>Slug</span>
          <span>Visibility</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">Loading categories…</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No categories yet</p>
            <p className="studio-table__empty-copy">Create a category to populate the storefront menu.</p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {categories.map((category) => (
              <li key={category.id}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{category.name}</strong>
                    <small>{category.description || "No description"}</small>
                  </span>
                  <span>{category.slug}</span>
                  <span className="studio-table__status" data-status={category.visibility === false ? "archived" : "active"}>{category.visibility === false ? "Hidden" : "Visible"}</span>
                  <span>
                    <button type="button" className="studio-btn studio-btn--ghost" onClick={() => handleEdit(category)}>Edit</button>
                    <button type="button" className="studio-btn studio-btn--ghost studio-btn--danger" onClick={() => handleDelete(category.id)} style={{ marginLeft: "0.5rem" }}>Delete</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
