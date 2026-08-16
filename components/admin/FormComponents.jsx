"use client";

import { useState } from "react";
import { X, Upload, Check, AlertCircle } from "lucide-react";

// Input Component
export function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required, 
  type = "text",
  placeholder,
  disabled,
  ...props 
}) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${error ? "form-input--error" : ""}`}
        {...props}
      />
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Textarea Component
export function Textarea({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required,
  placeholder,
  rows = 4,
  disabled,
  ...props 
}) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-textarea ${error ? "form-input--error" : ""}`}
        {...props}
      />
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Select Component
export function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [],
  error, 
  required,
  placeholder = "Select an option",
  disabled,
  ...props 
}) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`form-select ${error ? "form-input--error" : ""}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Toggle/Switch Component
export function Toggle({ 
  label, 
  name, 
  checked, 
  onChange, 
  disabled,
  description 
}) {
  return (
    <div className="form-field">
      <div className="form-toggle-wrapper">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange({ target: { name, checked: !checked } })}
          disabled={disabled}
          className={`form-toggle ${checked ? "form-toggle--on" : ""}`}
        >
          <span className="form-toggle-thumb" />
        </button>
        <div className="form-toggle-label">
          {label && <span className="form-label">{label}</span>}
          {description && <small className="form-description">{description}</small>}
        </div>
      </div>
    </div>
  );
}

// Color Picker Component
export function ColorPicker({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required 
}) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="form-color-picker">
        <input
          type="color"
          id={name}
          name={name}
          value={value || "#000000"}
          onChange={onChange}
          className="form-color-input"
        />
        <input
          type="text"
          value={value || "#000000"}
          onChange={onChange}
          name={name}
          placeholder="#000000"
          className="form-input form-color-text"
          maxLength={7}
        />
        <div 
          className="form-color-preview" 
          style={{ backgroundColor: value || "#000000" }}
        />
      </div>
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Image Upload Component
export function ImageUpload({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  required,
  multiple = false 
}) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onChange({ target: { name, value: data.url || data.src } });
    } catch (err) {
      console.error("Upload error:", err);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange({ target: { name, value: null } });
  };

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label} {required && <span className="form-required">*</span>}
        </label>
      )}
      
      {preview ? (
        <div className="form-image-preview">
          <img src={preview} alt="Preview" />
          <button
            type="button"
            onClick={handleRemove}
            className="form-image-remove"
            disabled={uploading}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="form-image-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            multiple={multiple}
            style={{ display: "none" }}
          />
          <div className="form-image-upload-content">
            {uploading ? (
              <>
                <div className="form-spinner" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={24} />
                <span>Click to upload</span>
                <small>PNG, JPG, WEBP up to 10MB</small>
              </>
            )}
          </div>
        </label>
      )}
      
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Button Component
export function Button({ 
  children, 
  variant = "primary", 
  size = "md",
  loading = false,
  disabled,
  type = "button",
  onClick,
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`form-button form-button--${variant} form-button--${size}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="form-spinner" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Card Component
export function Card({ title, description, children, actions }) {
  return (
    <div className="form-card">
      {(title || description) && (
        <div className="form-card-header">
          {title && <h3 className="form-card-title">{title}</h3>}
          {description && <p className="form-card-description">{description}</p>}
        </div>
      )}
      <div className="form-card-body">{children}</div>
      {actions && <div className="form-card-actions">{actions}</div>}
    </div>
  );
}

// Toast/Alert Component
export function Alert({ type = "info", message, onClose }) {
  const icons = {
    success: <Check size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <AlertCircle size={20} />,
  };

  return (
    <div className={`form-alert form-alert--${type}`}>
      <div className="form-alert-icon">{icons[type]}</div>
      <span className="form-alert-message">{message}</span>
      {onClose && (
        <button onClick={onClose} className="form-alert-close">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
