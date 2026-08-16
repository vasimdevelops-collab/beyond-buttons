"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Select, Button, Alert } from "@/components/admin/FormComponents";
import { ShoppingCart, Search, Eye } from "lucide-react";
import "@/components/admin/admin-layout.css";
import "@/components/admin/form-components.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      showAlert("error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadOrders]);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order");

      showAlert("success", "Order status updated successfully");
      loadOrders();
    } catch (error) {
      console.error("Update error:", error);
      showAlert("error", "Failed to update order status");
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading orders...</p>
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
        <h1 className="admin-page-title">Orders</h1>
        <p className="admin-page-description">Manage customer orders</p>
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
              placeholder="Search orders..."
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

      {filteredOrders.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <ShoppingCart />
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers make purchases</p>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id || order._id}>
                  <td>
                    <strong>#{order.id?.slice(0, 8) || "N/A"}</strong>
                  </td>
                  <td>
                    {order.customerName || "Guest"}
                    <br />
                    <small style={{ color: "#999" }}>
                      {order.customerEmail || order.email || "—"}
                    </small>
                  </td>
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td>
                    <strong>₹{order.totalAmount || order.total || 0}</strong>
                  </td>
                  <td>
                    <span
                      className={`admin-badge admin-badge--${
                        order.paymentStatus === "paid" ? "success" : "warning"
                      }`}
                    >
                      {order.paymentStatus || "pending"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status || "pending"}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1.5px solid #e0e0e0",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="admin-action-btn"
                      title="View Details"
                      onClick={() => alert(`Order details: ${order.id}`)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
