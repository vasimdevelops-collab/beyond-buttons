"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  Image,
  Palette,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft
} from "lucide-react";
import "../admin/admin-layout.css";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Products", icon: Package, href: "/admin/products" },
  { label: "Categories", icon: FolderTree, href: "/admin/categories" },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  { label: "Coupons", icon: Tag, href: "/admin/coupons" },
  { label: "Media", icon: Image, href: "/admin/media" },
  { label: "Theme", icon: Palette, href: "/admin/theme" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Basic auth check - can be enhanced later
  useEffect(() => {
    async function checkAuth() {
      try {
        // For now, just allow access - can add actual auth check later
        // const response = await fetch("/api/auth/session");
        // const session = await response.json();
        // if (!session?.user) {
        //   router.push("/login?redirect=/admin");
        //   return;
        // }
        setChecking(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid #e8e8e8",
          borderTopColor: "#d4af37",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#666" }}>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "" : "admin-sidebar--collapsed"} ${mobileMenuOpen ? "admin-sidebar--mobile-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <span className="admin-logo-text">{sidebarOpen ? "Beyond Buttons" : "BB"}</span>
          </div>
          <button
            className="admin-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? "admin-nav-item--active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item">
            <LogOut size={20} />
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="admin-header-title">
            <h1>Admin Panel</h1>
          </div>

          <div className="admin-header-actions">
            <Link href="/" className="admin-view-site-btn" target="_blank">
              View Site
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
