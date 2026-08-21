"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";

import Navbar from "@/components/layout/Navbar";
import { authClient, useSession } from "@/lib/auth/client";
import {
  AUTH_PATHS,
  hasFormErrors,
  validateForgotPasswordForm,
  validateLoginForm,
  validateRegisterForm,
} from "@/lib/auth/customer-auth";

import "./customer-auth.css";

function useAuthReveal(key) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parts = root.querySelectorAll("[data-auth-reveal]");

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(parts, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(parts, { autoAlpha: 0, y: 20 });
      gsap.to(parts, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power2.out",
        force3D: true,
      });
    }, root);

    return () => ctx.revert();
  }, [key]);

  return rootRef;
}

function AuthShell({ title, support, children, revealKey, footer }) {
  const rootRef = useAuthReveal(revealKey);

  return (
    <div className="customer-auth" ref={rootRef}>
      <Navbar />
      <main className="customer-auth__main">
        <section className="customer-auth__card" data-auth-reveal>
          <Link className="customer-auth__brand" href="/" aria-label="Beyond Buttons home">
            <Image
              src="/images/logo.png"
              alt="Beyond Buttons"
              width={577}
              height={433}
              sizes="72px"
              priority
            />
          </Link>
          <p className="customer-auth__eyebrow">Beyond Buttons</p>
          <h1 className="customer-auth__title">{title}</h1>
          {support ? <p className="customer-auth__support">{support}</p> : null}
          {children}
          {footer}
        </section>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  disabled,
}) {
  return (
    <label className="customer-auth__field" htmlFor={id}>
      <span className="customer-auth__label">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <span className="customer-auth__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function GoogleButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="customer-auth__google"
      onClick={onClick}
      disabled={disabled}
    >
      Continue with Google
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="customer-auth__divider" aria-hidden="true">
      <span>or</span>
    </div>
  );
}

function useGoogleSignIn(callbackURL) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function trigger() {
    setError("");
    setPending(true);
    const result = await authClient.signIn.social({ provider: "google", callbackURL });
    if (result?.error) {
      setError(
        result.error.message ||
          "Google sign-in is not configured yet. Contact support."
      );
      setPending(false);
    }
    // On success, Better Auth redirects the browser to Google — no further action needed.
  }

  return { trigger, pending, error };
}

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || AUTH_PATHS.account;
  const { data: session, isPending: sessionPending } = useSession();

  // Login/register are guest-only. Redirect away only when a *validated*
  // session exists (not cookie presence), so a stale/expired cookie can
  // never bounce between /account and /login in a redirect loop.
  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace(nextPath);
    }
  }, [session, sessionPending, nextPath, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const google = useGoogleSignIn(nextPath);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLoginForm({ email, password });
    setErrors(nextErrors);
    setFormError("");

    if (hasFormErrors(nextErrors)) return;

    setSubmitting(true);
    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error.message || "Invalid email or password.");
      return;
    }

    router.replace(nextPath);
  }

  return (
    <AuthShell
      title="Sign In"
      support="Access your Beyond Buttons account with email and password."
      revealKey="login"
      footer={
        <p className="customer-auth__footer">
          New here? <Link href={AUTH_PATHS.register}>Create an account</Link>
        </p>
      }
    >
      <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoComplete="email"
          placeholder="you@email.com"
          disabled={submitting}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={submitting}
        />
        <div className="customer-auth__row customer-auth__row--split">
          <label className="customer-auth__checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={submitting}
            />
            <span>Remember me</span>
          </label>
          <Link className="customer-auth__link" href={AUTH_PATHS.forgotPassword}>
            Forgot password?
          </Link>
        </div>
        {formError ? <p className="customer-auth__form-error">{formError}</p> : null}
        <button className="customer-auth__submit" type="submit" disabled={submitting}>
          {submitting ? "Signing In…" : "Sign In"}
        </button>
      </form>
      <AuthDivider />
      {google.error ? <p className="customer-auth__form-error">{google.error}</p> : null}
      <GoogleButton onClick={google.trigger} disabled={google.pending} />
    </AuthShell>
  );
}

function RegisterView() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace(AUTH_PATHS.account);
    }
  }, [session, sessionPending, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const google = useGoogleSignIn(AUTH_PATHS.account);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegisterForm({
      name,
      email,
      password,
      confirmPassword,
    });
    setErrors(nextErrors);
    setFormError("");
    if (hasFormErrors(nextErrors)) return;

    setSubmitting(true);
    const result = await authClient.signUp.email({ email, password, name });
    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error.message || "Unable to create your account.");
      return;
    }

    router.replace(AUTH_PATHS.account);
  }

  return (
    <AuthShell
      title="Create Account"
      support="Registration is required before accessing your account."
      revealKey="register"
      footer={
        <p className="customer-auth__footer">
          Already a member? <Link href={AUTH_PATHS.login}>Sign in</Link>
        </p>
      }
    >
      <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
        <Field
          id="name"
          label="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoComplete="name"
          placeholder="Your name"
          disabled={submitting}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoComplete="email"
          placeholder="you@email.com"
          disabled={submitting}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          disabled={submitting}
        />
        <Field
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="Repeat password"
          disabled={submitting}
        />
        {formError ? <p className="customer-auth__form-error">{formError}</p> : null}
        <button className="customer-auth__submit" type="submit" disabled={submitting}>
          {submitting ? "Creating Account…" : "Create Account"}
        </button>
      </form>
      <AuthDivider />
      {google.error ? <p className="customer-auth__form-error">{google.error}</p> : null}
      <GoogleButton onClick={google.trigger} disabled={google.pending} />
    </AuthShell>
  );
}

function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForgotPasswordForm({ email });
    setErrors(nextErrors);
    setFormError("");
    if (hasFormErrors(nextErrors)) return;

    setSubmitting(true);
    const result = await authClient.forgetPassword({
      email,
      redirectTo: AUTH_PATHS.login,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error.message || "Unable to send reset link.");
      return;
    }

    setSent(true);
  }

  return (
    <AuthShell
      title="Forgot Password"
      support="Enter your email and we will send a secure reset link."
      revealKey="forgot"
      footer={
        <p className="customer-auth__footer">
          Remembered it? <Link href={AUTH_PATHS.login}>Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <div className="customer-auth__success" role="status" data-auth-reveal>
          <p>
            If an account exists for <strong>{email.trim()}</strong>, a reset
            link has been sent.
          </p>
        </div>
      ) : (
        <form className="customer-auth__form" onSubmit={handleSubmit} noValidate>
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder="you@email.com"
            disabled={submitting}
          />
          {formError ? <p className="customer-auth__form-error">{formError}</p> : null}
          <button className="customer-auth__submit" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function formatMoney(amount, currency = "INR") {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }
}

function getStatusLabel(status, type) {
  const labels = {
    payment: {
      pending: "Payment: Pending",
      paid: "Payment: Paid",
      failed: "Payment: Failed",
      refunded: "Payment: Refunded",
    },
    shipping: {
      pending: "Order: Pending",
      processing: "Order: Processing",
      shipped: "Order: Shipped",
      delivered: "Order: Delivered",
      cancelled: "Order: Cancelled",
    },
  };
  return labels[type]?.[status] || `${type}: ${status}`;
}

function AccountView() {
  const router = useRouter();
  const rootRef = useAuthReveal("account");
  const { data, isPending } = useSession();
  const session = data;
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!session?.user) return;

    let active = true;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load orders.");
        }
        const payload = await response.json();
        if (active) {
          setOrders(Array.isArray(payload.orders) ? payload.orders : []);
        }
      } catch (error) {
        if (active) {
          setOrdersError(error?.message || "Unable to load your orders.");
          setOrders([]);
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace(AUTH_PATHS.login);
    router.refresh();
  }

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace(`/login?next=${encodeURIComponent(AUTH_PATHS.account)}`);
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="customer-auth customer-auth--gate" role="status">
        Checking your session…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="customer-auth customer-auth--gate" role="status">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="customer-auth" ref={rootRef}>
      <Navbar />
      <main className="customer-auth__main customer-auth__main--account">
        <section className="customer-auth__card customer-auth__card--account" data-auth-reveal>
          <p className="customer-auth__eyebrow">Account</p>
          <h1 className="customer-auth__title">Welcome back</h1>
          <p className="customer-auth__support">
            Your orders, account details, and recent activity live here.
          </p>
          <dl className="customer-auth__meta">
            <div>
              <dt>Name</dt>
              <dd>{session.user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session.user.email}</dd>
            </div>
          </dl>

          <div className="customer-auth__account-orders">
            <h2 className="customer-auth__subheading">Recent Orders</h2>
            {ordersLoading ? (
              <p className="customer-auth__muted">Loading your orders…</p>
            ) : ordersError ? (
              <p className="customer-auth__form-error">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="customer-auth__muted">No orders yet. Start shopping to see them here.</p>
            ) : (
              <ul className="customer-auth__order-list">
                {orders.map((order) => (
                  <li key={order.id} className="customer-auth__order-item">
                    <article className="customer-auth__order-card">
                      <div className="customer-auth__order-main">
                        <header className="customer-auth__order-header">
                          <h3 className="customer-auth__order-product">{order.productName}</h3>
                          <div className="customer-auth__order-meta">
                            <span className="customer-auth__order-number">{order.orderNumber}</span>
                            <time className="customer-auth__order-date">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </time>
                          </div>
                        </header>
                        <div className="customer-auth__order-statuses">
                          <span className={`customer-auth__status-badge customer-auth__status-badge--payment ${order.paymentStatus}`}>
                            {getStatusLabel(order.paymentStatus, "payment")}
                          </span>
                          <span className={`customer-auth__status-badge customer-auth__status-badge--shipping ${order.shippingStatus}`}>
                            {getStatusLabel(order.shippingStatus, "shipping")}
                          </span>
                        </div>
                      </div>
                      <div className="customer-auth__order-total">
                        {formatMoney(order.total, order.currency || "INR")}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="customer-auth__account-actions">
            <Link className="customer-auth__submit customer-auth__submit--ghost" href="/">
              Continue Shopping
            </Link>
            <button
              type="button"
              className="customer-auth__submit"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Customer authentication views — real Better Auth wiring behind the
 * locked storefront UI. Session/role enforcement for /account happens
 * server-side in app/(shop)/[...slug]/page.js; this component renders
 * the already-authorized state reactively.
 */
export function CustomerAuth({ view }) {
  const screen = useMemo(() => {
    switch (view) {
      case "login":
        return (
          <Suspense fallback={null}>
            <LoginView />
          </Suspense>
        );
      case "register":
        return <RegisterView />;
      case "forgot-password":
        return <ForgotPasswordView />;
      case "account":
        return <AccountView />;
      default:
        return null;
    }
  }, [view]);

  return screen;
}
