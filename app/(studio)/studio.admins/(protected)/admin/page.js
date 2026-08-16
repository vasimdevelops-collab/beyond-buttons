"use client";

import { useEffect, useState } from "react";

/**
 * Studio → Admin module.
 * Lets the single administrator update their own login email / password.
 * Changes take effect immediately for the next sign-in.
 */
export default function StudioAdminPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/credentials", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || "");
        }
      } catch {
        // Non-fatal — leave the field empty.
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(setter) {
    return (event) => {
      setNotice(null);
      setter(event.target.value);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    if (newPassword && newPassword !== confirmPassword) {
      setNotice({ type: "error", text: "New password and confirm password do not match." });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setNotice({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setNotice({ type: "error", text: data?.error || "Unable to update admin credentials." });
        return;
      }

      setNotice({ type: "success", text: "Admin login updated. Use the new details next time you sign in." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setNotice({ type: "error", text: "Unable to update admin credentials." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="studio-table__empty" role="status">
        <p className="studio-table__empty-title">Loading admin…</p>
      </div>
    );
  }

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Admin</h1>
          <p className="studio-main__copy">
            Manage the single admin account used to sign in to this Studio.
          </p>
        </div>
      </header>

      <form className="studio-section" onSubmit={handleSubmit}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Admin login</h2>
        </header>

        <div className="studio-section__fields">
          <label className="studio-field">
            <span className="studio-field__label">Admin email (login)</span>
            <input
              type="email"
              value={email}
              onChange={handleChange(setEmail)}
              required
            />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={handleChange(setCurrentPassword)}
              placeholder="Required to confirm changes"
              required
            />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={handleChange(setNewPassword)}
              placeholder="Leave blank to keep the current password"
            />
          </label>

          <label className="studio-field">
            <span className="studio-field__label">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleChange(setConfirmPassword)}
              placeholder="Re-enter the new password"
            />
          </label>
        </div>

        {notice ? (
          <p
            className={`studio-notice ${notice.type === "success" ? "studio-notice--success" : "studio-notice--error"}`}
            role="alert"
          >
            <span className="studio-notice__text">{notice.text}</span>
          </p>
        ) : null}

        <div className="studio-editor__bar">
          <p className="studio-editor__bar-note">
            Your changes apply to the next sign-in. The initial credentials come
            from ADMIN_EMAIL / ADMIN_PASSWORD in your .env file.
          </p>
          <div className="studio-editor__bar-actions">
            <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
              {saving ? "Saving…" : "Save admin login"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}