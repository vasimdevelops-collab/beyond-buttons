"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button, Alert } from "@/components/admin/FormComponents";
import { Upload, Trash2, Image as ImageIcon, Search } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const response = await fetch("/api/admin/media");
      const data = await response.json();
      setMedia(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load media:", error);
      showAlert("error", "Failed to load media");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      showAlert("success", "Image uploaded successfully");
      loadMedia();
    } catch (error) {
      console.error("Upload error:", error);
      showAlert("error", "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(item) {
    if (!confirm("Delete this media file?")) return;

    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete media");

      showAlert("success", "Media deleted successfully");
      loadMedia();
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("error", "Failed to delete media");
    }
  }

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const filteredMedia = media.filter((m) =>
    m.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading media...</p>
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

      <div className="admin-page-header">
        <h1 className="admin-page-title">Media Library</h1>
        <p className="admin-page-description">Upload and manage your images</p>
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
              placeholder="Search media..."
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
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
            <Button variant="primary" as="span" loading={uploading}>
              <Upload size={18} />
              Upload Image
            </Button>
          </label>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <ImageIcon />
            <h3>No media files yet</h3>
            <p>Upload your first image to get started</p>
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
              <Button variant="primary" as="span" loading={uploading}>
                <Upload size={18} />
                Upload Image
              </Button>
            </label>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              style={{
                position: "relative",
                background: "white",
                border: "1.5px solid #e8e8e8",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  paddingBottom: "100%",
                  background: "#f5f5f5",
                }}
              >
                <img
                  src={item.src || item.url}
                  alt={item.alt || "Media"}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ padding: "12px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.alt || item.filename || "Untitled"}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.src || item.url);
                      showAlert("success", "URL copied to clipboard");
                    }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fee",
                      border: "1px solid #fcc",
                      borderRadius: "6px",
                      color: "#e74c3c",
                      cursor: "pointer",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
