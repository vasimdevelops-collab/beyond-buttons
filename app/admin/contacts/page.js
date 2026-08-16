"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button, Card, Alert } from "@/components/admin/FormComponents";
import { Mail, Search, Trash2, Eye, X, MessageSquare } from "lucide-react";
import "@/components/admin/admin-layout.css";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [alert, setAlert] = useState(null);

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadContacts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/contacts");
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      showAlert("error", "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadContacts]);

  async function updateStatus(id, status) {
    try {
      const response = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      
      const updated = await response.json();
      setContacts(contacts.map(c => c._id === id ? updated : c));
      if (selectedContact?._id === id) setSelectedContact(updated);
    } catch (error) {
      showAlert("error", "Failed to update status");
    }
  }

  async function handleDelete(contact) {
    if (!confirm(`Delete message from ${contact.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/contacts?id=${contact._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");

      showAlert("success", "Message deleted");
      setContacts(contacts.filter(c => c._id !== contact._id));
      if (selectedContact?._id === contact._id) setSelectedContact(null);
    } catch (error) {
      showAlert("error", "Failed to delete message");
    }
  }

  function handleView(contact) {
    setSelectedContact(contact);
    if (contact.status === "unread") {
      updateStatus(contact._id, "read");
    }
  }

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjectLabels = {
    general: "General Inquiry",
    order: "Order Related",
    wholesale: "Wholesale / B2B",
    styling: "Styling Advice",
    other: "Other"
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading messages...</p>
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
        <h1 className="admin-page-title">Contact Messages</h1>
        <p className="admin-page-description">Manage inquiries from your customers</p>
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
              placeholder="Search by name, email or subject..."
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
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedContact ? "1fr 400px" : "1fr", gap: "24px" }}>
        <div className="admin-table-container">
          {filteredContacts.length === 0 ? (
            <div className="admin-empty-state">
              <MessageSquare />
              <h3>No messages found</h3>
              <p>When customers use the contact form, their messages will appear here</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name & Email</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact._id} style={{ opacity: contact.status === "unread" ? 1 : 0.7 }}>
                    <td>
                      <div style={{ fontWeight: contact.status === "unread" ? "bold" : "normal" }}>
                        {contact.name}
                      </div>
                      <small style={{ color: "#777" }}>{contact.email}</small>
                    </td>
                    <td>{subjectLabels[contact.subject] || contact.subject}</td>
                    <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${
                        contact.status === "unread" ? "warning" : 
                        contact.status === "read" ? "default" : 
                        contact.status === "replied" ? "success" : "default"
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" onClick={() => handleView(contact)} title="View">
                          <Eye size={16} />
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(contact)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedContact && (
          <div className="admin-contact-detail">
            <Card title="Message Detail" actions={
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <Button variant="secondary" onClick={() => setSelectedContact(null)} style={{ flex: 1 }}>Close</Button>
                <Button variant="primary" onClick={() => window.location.href = `mailto:${selectedContact.email}`} style={{ flex: 1 }}>
                  <Mail size={16} style={{ marginRight: "8px" }} />
                  Reply
                </Button>
              </div>
            }>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>Status</label>
                <select 
                  value={selectedContact.status} 
                  onChange={(e) => updateStatus(selectedContact._id, e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>Customer</label>
                <p style={{ margin: 0, fontWeight: "500" }}>{selectedContact.name}</p>
                <p style={{ margin: 0, color: "#666" }}>{selectedContact.email}</p>
                {selectedContact.phone && <p style={{ margin: 0, color: "#666" }}>{selectedContact.phone}</p>}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>Subject</label>
                <p style={{ margin: 0, fontWeight: "500" }}>{subjectLabels[selectedContact.subject] || selectedContact.subject}</p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>Message</label>
                <div style={{ 
                  background: "#f9f9f9", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  border: "1px solid #eee",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap"
                }}>
                  {selectedContact.message}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>Date Received</label>
                <p style={{ margin: 0, fontSize: "14px" }}>{new Date(selectedContact.createdAt).toLocaleString()}</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-contact-detail {
          position: sticky;
          top: 0;
          height: fit-content;
        }
      `}</style>
    </AdminLayout>
  );
}
