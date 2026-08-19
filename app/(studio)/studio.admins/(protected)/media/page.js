"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const FOLDERS = [
  { id: "all", label: "All Assets" },
  { id: "brand", label: "Brand" },
  { id: "homepage", label: "Homepage" },
  { id: "products", label: "Products" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "uncategorized", label: "Uncategorized" },
];

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
];

const EMPTY_DETAILS = {
  name: "—",
  dimensions: "—",
  fileSize: "—",
  altText: "",
  folder: "—",
  usedIn: "—",
  url: "",
};

export default function StudioMediaLibraryPage() {
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState("");
  const [folderId, setFolderId] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [copyState, setCopyState] = useState("idle");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(false);

  async function fetchAssets() {
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      if (mountedRef.current) {
        setAssets(normalized);
        if (!selectedId && normalized[0]) setSelectedId(normalized[0].id);
      }
    } catch {
      if (mountedRef.current) {
        setAssets([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const visibleAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesFolder = folderId === "all" || asset.folderId === folderId;
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      const matchesQuery =
        !normalized ||
        asset.filename?.toLowerCase().includes(normalized) ||
        asset.alt?.toLowerCase().includes(normalized) ||
        asset.src?.toLowerCase().includes(normalized);
      return matchesFolder && matchesType && matchesQuery;
    });
  }, [assets, query, folderId, typeFilter]);

  const selected = visibleAssets.find((asset) => asset.id === selectedId) || visibleAssets[0] || null;

  const details = selected
    ? {
        name: selected.filename || "Untitled",
        dimensions: selected.width && selected.height ? `${selected.width}×${selected.height}` : "—",
        fileSize: selected.size ? `${(selected.size / 1024 / 1024).toFixed(2)} MB` : "—",
        altText: selected.alt || "",
        folder: selected.folderLabel || "—",
        usedIn: selected.folderId ? `${selected.folderLabel} asset` : "Not used",
        url: selected.src || "",
      }
    : EMPTY_DETAILS;

  async function handleCopyUrl() {
    if (!details.url) return;
    try {
      await navigator.clipboard.writeText(details.url);
      if (mountedRef.current) setCopyState("copied");
      window.setTimeout(() => {
        if (mountedRef.current) setCopyState("idle");
      }, 1600);
    } catch {
      if (mountedRef.current) setCopyState("idle");
    }
  }

  async function handleUpload(file) {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name);
      formData.append("folderId", folderId === "all" ? "uncategorized" : folderId);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type header — browser sets it with the boundary automatically.
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("[media] Upload failed:", data?.error || response.status);
        toast.error("Upload failed");
        return;
      }

      await fetchAssets();
      toast.success("Media uploaded");
    } catch (err) {
      console.error("[media] Upload error:", err);
      toast.error("Upload failed");
    }
  }

  async function handleReplace() {
    if (!selected) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await handleUpload(file);
      await fetchAssets();
    };
    input.click();
  }

  async function handleDelete() {
    if (!selected) return;
    const response = await fetch(`/api/admin/media?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    if (response.ok) {
      await fetchAssets();
      toast.success("Media deleted");
    } else {
      toast.error("Unable to delete media");
    }
  }

  async function handleUploadButton() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <div className="studio-media" data-state="ready">
      <header className="studio-main__header studio-media__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Media Library</h1>
          <p className="studio-main__copy">Manage image assets used across the storefront and homepage.</p>
        </div>
        <button type="button" className="studio-btn studio-btn--primary" onClick={handleUploadButton}>Upload</button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) handleUpload(file); event.target.value = ""; }} />
      </header>

      <div className="studio-media__layout">
        <aside className="studio-media__folders" aria-label="Media folders">
          <p className="studio-media__rail-label">Folders</p>
          <nav className="studio-media__folder-list">
            {FOLDERS.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="studio-media__folder"
                data-active={folderId === folder.id ? "true" : "false"}
                onClick={() => {
                  setFolderId(folder.id);
                  setSelectedId(assets[0]?.id ?? null);
                }}
              >
                {folder.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="studio-media__main">
          <section className="studio-toolbar studio-media__toolbar" aria-label="Media filters">
            <label className="studio-field studio-toolbar__search">
              <span className="studio-field__label">Search</span>
              <input
                type="search"
                name="media-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media"
                autoComplete="off"
              />
            </label>
            <label className="studio-field">
              <span className="studio-field__label">Filter</span>
              <select name="media-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="studio-media__grid" data-state={visibleAssets.length ? "ready" : "empty"} aria-label="Media grid">
            {loading ? (
              <div className="studio-media__empty" role="status">
                <p className="studio-media__empty-title">Loading media…</p>
              </div>
            ) : visibleAssets.length === 0 ? (
              <div className="studio-media__empty" role="status">
                <p className="studio-media__empty-title">No media yet</p>
                <p className="studio-media__empty-copy">Upload a file to create a new media asset.</p>
              </div>
            ) : (
              <ul className="studio-media__cards">
                {visibleAssets.map((asset) => (
                  <li key={asset.id}>
                    <button type="button" className="studio-media__card" data-active={selected?.id === asset.id ? "true" : "false"} aria-pressed={selected?.id === asset.id} onClick={() => setSelectedId(asset.id)}>
                      <span className="studio-media__thumb" aria-hidden="true">
                        {asset.src ? <img src={asset.src} alt="" /> : <span className="studio-media__thumb-fallback" />}
                      </span>
                      <span className="studio-media__card-name">{asset.filename || "Untitled"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="studio-media__inspector" aria-label="Media inspector">
          <section className="studio-media__preview" aria-labelledby="media-preview-title">
            <h2 id="media-preview-title" className="studio-media__panel-title">Image Preview</h2>
            <div className="studio-media__preview-frame" data-state={selected ? "ready" : "empty"}>
              {selected?.src ? (
                <img src={selected.src} alt={selected.alt || selected.filename || ""} />
              ) : (
                <p className="studio-media__preview-empty">Select an asset to preview</p>
              )}
            </div>
          </section>

          <section className="studio-media__details" aria-labelledby="media-details-title">
            <h2 id="media-details-title" className="studio-media__panel-title">Image Details</h2>
            <dl className="studio-media__meta">
              <div>
                <dt>Thumbnail</dt>
                <dd>
                  <span className="studio-media__thumb studio-media__thumb--sm" aria-hidden="true">
                    {selected?.src ? <img src={selected.src} alt="" /> : <span className="studio-media__thumb-fallback" />}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{details.name}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>{details.dimensions}</dd>
              </div>
              <div>
                <dt>File Size</dt>
                <dd>{details.fileSize}</dd>
              </div>
              <div>
                <dt>Alt Text</dt>
                <dd>{details.altText || "—"}</dd>
              </div>
              <div>
                <dt>Folder</dt>
                <dd>{details.folder}</dd>
              </div>
              <div>
                <dt>Used In</dt>
                <dd>{details.usedIn}</dd>
              </div>
            </dl>

            <div className="studio-media__actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={handleCopyUrl} disabled={!selected || !details.url}>{copyState === "copied" ? "Copied" : "Copy URL"}</button>
              <button type="button" className="studio-btn studio-btn--ghost" onClick={handleReplace} disabled={!selected}>Replace</button>
              <button type="button" className="studio-btn studio-btn--ghost studio-btn--danger" onClick={handleDelete} disabled={!selected}>Delete</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
