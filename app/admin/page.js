"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Package, ShoppingCart, Tag, TrendingUp } from "lucide-react";
import "@/components/admin/admin-layout.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCoupons: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [productsRes, ordersRes, couponsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/coupons"),
      ]);

      const products = await productsRes.json();
      const orders = await ordersRes.json();
      const coupons = await couponsRes.json();

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalOrders: Array.isArray(orders) ? orders.length : 0,
        totalCoupons: Array.isArray(coupons) ? coupons.length : 0,
        recentOrders: Array.isArray(orders) ? orders.slice(0, 5) : [],
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-description">
          Welcome to Beyond Buttons Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(212, 175, 55, 0.1)" }}>
            <Package size={24} style={{ color: "#d4af37" }} />
          </div>
          <div className="admin-stat-content">
            <p className="admin-stat-label">Total Products</p>
            <h3 className="admin-stat-value">{stats.totalProducts}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(52, 152, 219, 0.1)" }}>
            <ShoppingCart size={24} style={{ color: "#3498db" }} />
          </div>
          <div className="admin-stat-content">
            <p className="admin-stat-label">Total Orders</p>
            <h3 className="admin-stat-value">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(46, 204, 113, 0.1)" }}>
            <Tag size={24} style={{ color: "#2ecc71" }} />
          </div>
          <div className="admin-stat-content">
            <p className="admin-stat-label">Active Coupons</p>
            <h3 className="admin-stat-value">{stats.totalCoupons}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: "rgba(155, 89, 182, 0.1)" }}>
            <TrendingUp size={24} style={{ color: "#9b59b6" }} />
          </div>
          <div className="admin-stat-content">
            <p className="admin-stat-label">Revenue (Demo)</p>
            <h3 className="admin-stat-value">₹0</h3>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ marginTop: "32px" }}>
        <h2 className="admin-section-title">Recent Orders</h2>
        
        {stats.recentOrders.length === 0 ? (
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
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td>#{order.id?.slice(0, 8) || "N/A"}</td>
                    <td>{order.customerEmail || order.email || "Guest"}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>₹{order.totalAmount || 0}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${
                          order.status === "completed"
                            ? "success"
                            : order.status === "pending"
                            ? "warning"
                            : "default"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
