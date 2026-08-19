"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input, Textarea, Toggle, Button, Card, Alert } from "@/components/admin/FormComponents";
import { Plus, Edit2, Trash2, FolderTree, Search, X } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

const INITIAL_CATEGORY = {
  name: "",
  slug: "",
  description: "",
  visibility: true,
  order: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(INITIAL_CATEGORY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      showAlert("error", "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadCategories]);

  function handleChange(e) {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Category name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const method = editingCategory ? "PUT" : "POST";
      const response = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingCategory?.id,
          order: Number(formData.order) || 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to save category");

      showAlert("success", `Category ${editingCategory ? "updated" : "created"} successfully!`);
      setShowForm(false);
      setEditingCategory(null);
      setFormData(INITIAL_CATEGORY);
      loadCategories();
    } catch (error) {
      console.error("Save error:", error);
      showAlert("error", "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Delete "${category.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      showAlert("success", "Category deleted successfully");
      loadCategories();
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("error", "Failed to delete category");
    }
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      visibility: category.visibility !== false,
      order: category.order || 0,
    });
    setShowForm(true);
  }

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading categories...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {alert && (
        <div style={{ marginBottom: "20px" }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {!showForm ? (
        <>
          <div className="admin-page-header">
            <h1 className="admin-page-title">Categories</h1>
            <p className="admin-page-description">Organize your products into categories</p>
            <div className="admin-page-actions">
              <div style={{ position: "relative", flex: "1", maxWidth: "400px" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                Add Category
              </Button>
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="admin-table-container">
              <div className="admin-empty-state">
                <FolderTree />
                <h3>No categories found</h3>
                <p>Start by creating your first category</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} />
                  Add Category
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Order</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <strong>{category.name}</strong>
                        {category.description && (
                          <>
                            <br />
                            <small style={{ color: "#999" }}>{category.description}</small>
                          </>
                        )}
                      </td>
                      <td>{category.slug}</td>
                      <td>{category.order}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            category.visibility ? "success" : "default"
                          }`}
                        >
                          {category.visibility ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleEdit(category)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            onClick={() => handleDelete(category)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
                setFormData(INITIAL_CATEGORY);
                setErrors({});
              }}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f5f5f5",
                border: "1.5px solid #e0e0e0",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="admin-page-title" style={{ margin: 0 }}>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card title="Category Information">
              <div className="form-grid form-grid--2">
                <Input
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  placeholder="Shirts"
                />
                <Input
                  label="Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="shirts"
                />
              </div>

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Category description..."
              />

              <div className="form-grid form-grid--2">
                <Input
                  label="Display Order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="0"
                />
                <div>
                  <Toggle
                    label="Visible"
                    name="visibility"
                    checked={formData.visibility}
                    onChange={handleChange}
                    description="Show category on website"
                  />
                </div>
              </div>
            </Card>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setFormData(INITIAL_CATEGORY);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
