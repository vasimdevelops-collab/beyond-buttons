"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const STUDIO_PATHS = Object.freeze({
  root: "/studio.admins",
  login: "/studio.admins/login",
  admin: "/studio.admins/admin",
  products: "/studio.admins/products",
  categories: "/studio.admins/categories",
  media: "/studio.admins/media",
  homepage: "/studio.admins/homepage",
  orders: "/studio.admins/orders",
  customers: "/studio.admins/customers",
  contacts: "/studio.admins/contacts",
  coupons: "/studio.admins/coupons",
  theme: "/studio.admins/theme",
  settings: "/studio.admins/settings",
  analytics: "/studio.admins/analytics",
});

const STUDIO_NAV = [
  { label: "Overview", href: STUDIO_PATHS.root },
  { label: "Products", href: STUDIO_PATHS.products },
  { label: "Categories", href: STUDIO_PATHS.categories },
  { label: "Media Library", href: STUDIO_PATHS.media },
  { label: "Homepage", href: STUDIO_PATHS.homepage },
  { label: "Orders", href: STUDIO_PATHS.orders },
  { label: "Customers", href: STUDIO_PATHS.customers },
  { label: "Contacts", href: STUDIO_PATHS.contacts },
  { label: "Coupons", href: STUDIO_PATHS.coupons },
  { label: "Theme", href: STUDIO_PATHS.theme },
  { label: "Settings", href: STUDIO_PATHS.settings },
  { label: "Analytics", href: STUDIO_PATHS.analytics },
  { label: "Admin", href: STUDIO_PATHS.admin },
];

function resolveActiveNav(pathname) {
  if (pathname === STUDIO_PATHS.products || pathname.startsWith(`${STUDIO_PATHS.products}/`)) {
    return "Products";
  }
  if (pathname === STUDIO_PATHS.categories || pathname.startsWith(`${STUDIO_PATHS.categories}/`)) {
    return "Categories";
  }
  if (pathname === STUDIO_PATHS.media || pathname.startsWith(`${STUDIO_PATHS.media}/`)) {
    return "Media Library";
  }
  if (pathname === STUDIO_PATHS.homepage || pathname.startsWith(`${STUDIO_PATHS.homepage}/`)) {
    return "Homepage";
  }
  if (pathname === STUDIO_PATHS.orders || pathname.startsWith(`${STUDIO_PATHS.orders}/`)) {
    return "Orders";
  }
  if (pathname === STUDIO_PATHS.customers || pathname.startsWith(`${STUDIO_PATHS.customers}/`)) {
    return "Customers";
  }
  if (pathname === STUDIO_PATHS.contacts || pathname.startsWith(`${STUDIO_PATHS.contacts}/`)) {
    return "Contacts";
  }
  if (pathname === STUDIO_PATHS.coupons || pathname.startsWith(`${STUDIO_PATHS.coupons}/`)) {
    return "Coupons";
  }
  if (pathname === STUDIO_PATHS.theme || pathname.startsWith(`${STUDIO_PATHS.theme}/`)) {
    return "Theme";
  }
  if (pathname === STUDIO_PATHS.settings || pathname.startsWith(`${STUDIO_PATHS.settings}/`)) {
    return "Settings";
  }
  if (pathname === STUDIO_PATHS.admin || pathname.startsWith(`${STUDIO_PATHS.admin}/`)) {
    return "Admin";
  }
  if (pathname === STUDIO_PATHS.analytics || pathname.startsWith(`${STUDIO_PATHS.analytics}/`)) {
    return "Analytics";
  }
  if (pathname === STUDIO_PATHS.root) {
    return "Overview";
  }
  return null;
}

function StudioBrand() {
  return (
    <Link className="studio-brand" href={STUDIO_PATHS.root} aria-label="Beyond Buttons Studio">
      <Image
        src="/images/logo.png"
        alt="Beyond Buttons"
        width={577}
        height={433}
        sizes="42px"
        priority
      />
      <span className="studio-brand__text">
        <p className="studio-brand__name">Beyond Buttons</p>
        <p className="studio-brand__meta">Studio</p>
      </span>
    </Link>
  );
}

/**
 * Studio shell — sidebar, module nav, and sign-out. Wraps every route inside
 * app/(studio)/studio.admins/(protected)/, which already enforces a valid
 * admin session server-side before this ever renders.
 */
export function StudioShell({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = resolveActiveNav(pathname);

  async function handleSignOut() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Best-effort — the cookie still gets cleared by the redirect below.
    }
    router.replace(STUDIO_PATHS.login);
    router.refresh();
  }

  return (
    <div className="studio-root studio-shell">
      <aside className="studio-sidebar" aria-label="Studio navigation">
        <StudioBrand />
        <nav className="studio-nav" aria-label="Studio modules">
          {STUDIO_NAV.map((item) => {
            const isActive = item.label === active;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  className="studio-nav__item"
                  href={item.href}
                  data-active={isActive ? "true" : "false"}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <span
                key={item.label}
                className="studio-nav__item studio-nav__item--placeholder"
                data-active="false"
                aria-disabled="true"
              >
                {item.label}
              </span>
            );
          })}
        </nav>
        <div className="studio-sidebar__footer">
          {user ? (
            <p className="studio-sidebar__user" title={user.email}>
              <span className="studio-sidebar__user-name">{user.email}</span>
              <span className="studio-sidebar__user-role">Admin</span>
            </p>
          ) : null}
          <button
            type="button"
            className="studio-nav__item studio-nav__signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </aside>
      <div className="studio-main">{children}</div>
    </div>
  );
}
