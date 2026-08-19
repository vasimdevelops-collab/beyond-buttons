"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const STATUS_ACTIONS = [
  { value: "read", label: "Mark read" },
  { value: "replied", label: "Mark replied" },
  { value: "archived", label: "Archive" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudioContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const mountedRef = useRef(false);

  async function fetchContacts() {
    try {
      const response = await fetch("/api/admin/contacts", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load contact submissions.");
      const data = await response.json();
      if (mountedRef.current) {
        setContacts(
          Array.isArray(data)
            ? data.map((contact) => ({
                ...contact,
                id: contact.id || contact._id || contact._id?.toString?.() || "",
              }))
            : []
        );
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "Failed to load contact submissions.");
        setContacts([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContacts();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const visibleContacts = useMemo(() => {
    if (statusFilter === "all") return contacts;
    return contacts.filter((contact) => (contact.status || "unread") === statusFilter);
  }, [contacts, statusFilter]);

  async function handleSetStatus(contact, status) {
    const contactId = contact.id || contact._id;
    if (!contactId) {
      if (mountedRef.current) {
        setError("This contact has no identifier and cannot be updated.");
      }
      return;
    }
    setBusyId(contactId);
    try {
      const response = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, status }),
      });
      if (!response.ok) throw new Error("Update failed.");
      await fetchContacts();
      toast.success(`Marked as ${status}`);
    } catch (err) {
      if (mountedRef.current) setError(err?.message || "Failed to update status.");
      toast.error("Failed to update status");
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }

  async function handleDelete(contact) {
    if (!window.confirm(`Delete submission from ${contact.name}?`)) return;
    const contactId = contact.id || contact._id;
    setBusyId(contactId);
    try {
      const response = await fetch(`/api/admin/contacts?id=${encodeURIComponent(contactId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed.");
      await fetchContacts();
      toast.success("Submission deleted");
    } catch (err) {
      if (mountedRef.current) setError(err?.message || "Failed to delete submission.");
      toast.error("Failed to delete submission");
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }

  const unreadCount = contacts.filter((contact) => (contact.status || "unread") === "unread").length;

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Contacts</h1>
          <p className="studio-main__copy">
            Contact form submissions from the storefront.
            {!loading && unreadCount > 0 ? ` ${unreadCount} unread.` : ""}
          </p>
        </div>
      </header>

      <section className="studio-toolbar" aria-label="Contact filters">
        <label className="studio-field">
          <span className="studio-field__label">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <p role="alert" style={{ color: "#f7a1a1", padding: "12px 0" }}>{error}</p>
      ) : null}

      <section
        className="studio-table"
        data-state={loading ? "loading" : visibleContacts.length ? "ready" : "empty"}
        aria-label="Contact submissions"
      >
        <div className="studio-table__head" role="row">
          <span>From</span>
          <span>Subject</span>
          <span>Status</span>
          <span>Received</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">Loading contacts…</p>
          </div>
        ) : visibleContacts.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No contact submissions</p>
            <p className="studio-table__empty-copy">
              {statusFilter !== "all"
                ? "Try a different status filter."
                : "Messages from the storefront contact form will appear here."}
            </p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {visibleContacts.map((contact) => {
              const expanded = expandedId === contact.id;
              return (
                <li key={contact.id || contact._id}>
                  <div
                    className="studio-table__row"
                    onClick={() => setExpandedId(expanded ? null : contact.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="studio-table__product">
                      <strong>{contact.name || "Anonymous"}</strong>
                      <small>{contact.email || "—"}</small>
                      {contact.phone ? <small>{contact.phone}</small> : null}
                    </span>
                    <span>{contact.subject || "—"}</span>
                    <span className="studio-table__status" data-status={contact.status || "unread"}>
                      {contact.status || "unread"}
                    </span>
                    <span>{formatDate(contact.createdAt)}</span>
                    <span onClick={(event) => event.stopPropagation()}>
                      <select
                        className="studio-table__select"
                        value=""
                        aria-label={`Change status for message from ${contact.name}`}
                        disabled={busyId === contact.id}
                        onChange={(event) => {
                          if (event.target.value) handleSetStatus(contact, event.target.value);
                        }}
                      >
                        <option value="" disabled>Change status…</option>
                        {STATUS_ACTIONS.map((action) => (
                          <option key={action.value} value={action.value}>{action.label}</option>
                        ))}
                      </select>
                    </span>
                  </div>
                  {expanded ? (
                    <div className="studio-table__expand" style={{ padding: "0 20px 16px" }}>
                      <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {contact.message || "No message body."}
                      </p>
                      <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--danger"
                        disabled={busyId === contact.id}
                        onClick={() => handleDelete(contact)}
                        style={{ marginTop: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
