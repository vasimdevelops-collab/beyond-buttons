import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { CustomerAuth } from "@/components/auth/CustomerAuth";
import { getAuth } from "@/lib/auth/server";

// Paths that now have explicit route files — redirect in case someone hits
// the catch-all URL directly (e.g., from an old cached link).
const EXPLICIT_REDIRECTS = {
  cart: "/cart",
  checkout: "/checkout",
  "order/success": "/order/success",
};

const AUTH_VIEW_BY_PATH = {
  login: "login",
  register: "register",
  account: "account",
  "forgot-password": "forgot-password",
};

// Guest checkout is not allowed — these views require an authenticated customer.
const CUSTOMER_ONLY_VIEWS = new Set(["account"]);

// Auth-gated / personalized views (login, register, account,
// forgot-password) read live session state per request and must not be
// statically prerendered — Next.js renders them dynamically on demand.
export function generateStaticParams() {
  // No static params needed here — all shop/auth routes are dynamic.
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const path = (slug || []).join("/");
  const titles = {
    login: "Sign In — Beyond Buttons",
    register: "Create Account — Beyond Buttons",
    account: "Account — Beyond Buttons",
    "forgot-password": "Forgot Password — Beyond Buttons",
  };

  return {
    title: titles[path] || "Beyond Buttons",
  };
}

async function requireCustomerSession(currentPath) {
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

  return session;
}

export default async function ShopFlowPage({ params }) {
  const { slug } = await params;
  const path = (slug || []).join("/");

  // Redirect any stale catch-all hits for paths that now have explicit routes.
  if (EXPLICIT_REDIRECTS[path]) {
    redirect(EXPLICIT_REDIRECTS[path]);
  }

  const authView = AUTH_VIEW_BY_PATH[path];
  if (authView) {
    if (CUSTOMER_ONLY_VIEWS.has(authView)) {
      await requireCustomerSession(`/${path}`);
    }
    return <CustomerAuth view={authView} />;
  }

  notFound();
}
