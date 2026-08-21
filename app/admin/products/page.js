"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input, Textarea, Select, Toggle, ImageUpload, Button, Card, Alert } from "@/components/admin/FormComponents";
import { Plus, Edit2, Trash2, Package, Search, X } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

const INITIAL_PRODUCT = {
  name: "",
  slug: "",
  category: "",
  status: "active",
  featured: false,
  price: "",
  comparePrice: "",
  description: "",
  story: "",
  colors: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_PRODUCT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(Array.isArray(productsData) ? productsData : Array.isArray(productsData?.products) ? productsData.products : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      showAlert("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

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
    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = editingProduct
        ? "/api/admin/products"
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingProduct?.id,
          price: Number(formData.price),
          comparePrice: formData.comparePrice ? Number(formData.comparePrice) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save product");

      showAlert("success", `Product ${editingProduct ? "updated" : "created"} successfully!`);
      setShowForm(false);
      setEditingProduct(null);
      setFormData(INITIAL_PRODUCT);
      loadData();
    } catch (error) {
      console.error("Save error:", error);
      showAlert("error", "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      showAlert("success", "Product deleted successfully");
      loadData();
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("error", "Failed to delete product");
    }
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      category: product.category || "",
      status: product.status || "draft",
      featured: product.featured || false,
      price: product.price || "",
      comparePrice: product.comparePrice || "",
      description: product.generalInformation?.description || product.description || "",
      story: product.story?.lead || product.generalInformation?.brandStatement || "",
      colors: product.colors || [],
    });
    setShowForm(true);
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading products...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {alert && (
        <div style={{ marginBottom: "20px" }}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {!showForm ? (
        <>
          <div className="admin-page-header">
            <h1 className="admin-page-title">Products</h1>
            <p className="admin-page-description">
              Manage your product catalog
            </p>
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
                  placeholder="Search products..."
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
                Add Product
              </Button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="admin-table-container">
              <div className="admin-empty-state">
                <Package />
                <h3>No products found</h3>
                <p>Start by creating your first product</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} />
                  Add Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small style={{ color: "#999" }}>{product.slug}</small>
                      </td>
                      <td>{product.category || "Uncategorized"}</td>
                      <td>
                        {product.comparePrice && (
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#999",
                              marginRight: "8px",
                            }}
                          >
                            ₹{product.comparePrice}
                          </span>
                        )}
                        <strong>₹{product.price || 0}</strong>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            product.status === "active"
                              ? "success"
                              : product.status === "draft"
                              ? "warning"
                              : "default"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td>
                        {product.featured ? (
                          <span className="admin-badge admin-badge--info">Yes</span>
                        ) : (
                          <span className="admin-badge admin-badge--default">No</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            onClick={() => handleDelete(product)}
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
                setEditingProduct(null);
                setFormData(INITIAL_PRODUCT);
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
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: "24px" }}>
              <Card title="Basic Information">
                <div className="form-grid form-grid--2">
                  <Input
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    placeholder="Premium Cotton Shirt"
                  />
                  <Input
                    label="Slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="premium-cotton-tshirt"
                  />
                </div>

                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  error={errors.category}
                  required
                  options={categories.map((cat) => ({
                    value: cat.name || cat.slug,
                    label: cat.name || cat.slug,
                  }))}
                />

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Product description..."
                />

                <Textarea
                  label="Brand Story"
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief brand statement or story..."
                />
              </Card>

              <Card title="Pricing">
                <div className="form-grid form-grid--2">
                  <Input
                    label="Price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    error={errors.price}
                    required
                    placeholder="999"
                  />
                  <Input
                    label="Compare at Price"
                    name="comparePrice"
                    type="number"
                    value={formData.comparePrice}
                    onChange={handleChange}
                    placeholder="1499"
                  />
                </div>
              </Card>

              <Card title="Settings">
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "active", label: "Active" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                <Toggle
                  label="Featured Product"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  description="Show this product in featured collections"
                />
              </Card>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "32px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  setFormData(INITIAL_PRODUCT);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
