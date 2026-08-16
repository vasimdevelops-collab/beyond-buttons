"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import Navbar from "@/components/layout/Navbar";
import { CartProvider, useCart } from "@/lib/shop/commerce";
import "./shopping.css";

function useShopReveal(dependencyKey = "") {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parts = root.querySelectorAll("[data-shop-reveal]");

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(parts, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(parts, { autoAlpha: 0, y: 18 });
      gsap.to(parts, {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.06,
        ease: "power2.out",
        force3D: true,
      });
    }, root);

    return () => ctx.revert();
  }, [dependencyKey]);

  return rootRef;
}

function ShopShell({ title, eyebrow, support, children, revealKey }) {
  const rootRef = useShopReveal(revealKey);

  return (
    <div className="shop-flow" ref={rootRef}>
      <Navbar />
      <main className="shop-flow__main">
        <header className="shop-flow__header" data-shop-reveal>
          {eyebrow ? <p className="shop-flow__eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {support ? <p className="shop-flow__support">{support}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

function OrderSummary({ primaryHref, primaryLabel, primaryDisabled, onPrimary, showContinue }) {
  const { totals, formatMoney } = useCart();

  return (
    <aside className="shop-summary" data-shop-reveal aria-label="Order summary">
      <h2 className="shop-section__title">Order Summary</h2>
      <div className="shop-summary__row">
        <span>Subtotal</span>
        <span>{totals.pricesPending && totals.subtotal === 0 ? "â€”" : formatMoney(totals.subtotal)}</span>
      </div>
      <div className="shop-summary__row">
        <span>Shipping</span>
        <span>{formatMoney(totals.shipping)}</span>
      </div>
      {totals.discount > 0 ? (
        <div className="shop-summary__row">
          <span>Discount</span>
          <span>-{formatMoney(totals.discount)}</span>
        </div>
      ) : null}
      <div className="shop-summary__row shop-summary__row--total">
        <span>Total</span>
        <span>{totals.pricesPending && totals.total === 0 ? "â€”" : formatMoney(totals.total)}</span>
      </div>
      {totals.pricesPending ? (
        <p className="shop-note">Pricing syncs from catalog when available.</p>
      ) : null}
      <div className="shop-summary__actions">
        {onPrimary ? (
          <button
            type="button"
            className="shop-btn shop-btn--primary"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        ) : (
          <Link
            href={primaryHref}
            className={`shop-btn shop-btn--primary${primaryDisabled ? " is-disabled" : ""}`}
            aria-disabled={primaryDisabled ? "true" : undefined}
            onClick={(event) => {
              if (primaryDisabled) event.preventDefault();
            }}
          >
            {primaryLabel}
          </Link>
        )}
        {showContinue ? (
          <Link href="/#shop" className="shop-btn shop-btn--ghost">
            Continue Shopping
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function CartLine({ line }) {
  const { updateQuantity, removeItem, formatMoney } = useCart();

  return (
    <article className="shop-line" data-shop-reveal>
      <div className="shop-line__media">
        {line.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={line.image} alt="" />
        ) : null}
      </div>
      <div>
        <h2 className="shop-line__name">{line.name}</h2>
        {line.color ? <p className="shop-line__meta">Color Â· {line.color}</p> : null}
        {line.size ? <p className="shop-line__meta">Size Â· {line.size}</p> : null}
        <div className="shop-line__controls">
          <div className="shop-qty" aria-label={`Quantity for ${line.name}`}>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateQuantity(line.id, line.quantity - 1)}
            >
              âˆ’
            </button>
            <span aria-live="polite">{line.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => updateQuantity(line.id, line.quantity + 1)}
            >
              +
            </button>
          </div>
          <button type="button" className="shop-remove" onClick={() => removeItem(line.id)}>
            Remove
          </button>
        </div>
      </div>
      <p className="shop-line__price">{formatMoney(line.unitPrice)}</p>
    </article>
  );
}

export function CartView() {
  const { items, itemCount, hydrated } = useCart();

  return (
    <ShopShell
      eyebrow="Bag"
      title="Your Cart"
      support="Review your selection before checkout."
      revealKey={`cart-${hydrated}-${itemCount}`}
    >
      {!hydrated ? (
        <div className="shop-card shop-empty" data-shop-reveal aria-hidden="true">
          <p>&nbsp;</p>
        </div>
      ) : items.length === 0 ? (
        <div className="shop-card shop-empty" data-shop-reveal>
          <h2>Your bag is empty</h2>
          <p>When pieces are added, they will appear here from shared cart state.</p>
          <div style={{ marginTop: 24 }}>
            <Link href="/#shop" className="shop-btn shop-btn--primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="shop-flow__grid">
            <div className="shop-card" aria-label="Cart items">
              {items.map((line) => (
                <CartLine key={line.id} line={line} />
              ))}
            </div>
            <OrderSummary
              primaryHref="/checkout"
              primaryLabel="Proceed to Checkout"
              showContinue
            />
          </div>
          <div className="shop-sticky-cta">
            <Link href="/checkout" className="shop-btn shop-btn--primary" style={{ width: "100%" }}>
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </ShopShell>
  );
}

/** Validate all required checkout fields; returns a map of field â†’ error message. */
function validateCheckoutFields(checkout, items) {
  const errors = {};

  if (!checkout.contact.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkout.contact.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!checkout.shippingAddress.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }
  if (!checkout.shippingAddress.line1.trim()) {
    errors.line1 = "Address line 1 is required.";
  }
  if (!checkout.shippingAddress.city.trim()) {
    errors.city = "City is required.";
  }
  if (!checkout.shippingAddress.postalCode.trim()) {
    errors.postalCode = "Postal code is required.";
  }
  if (items.length === 0) {
    errors._form = "Your cart is empty.";
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="shop-field-error"
      style={{ color: "var(--color-error, #c0392b)", fontSize: "0.8125rem", marginTop: "4px" }}
    >
      {message}
    </p>
  );
}

function Field({ id, label, value, onChange, type = "text", required, autoComplete, rows, error }) {
  const Tag = rows ? "textarea" : "input";
  return (
    <div className="shop-field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true" style={{ color: "var(--color-error, #c0392b)", marginLeft: 2 }}>*</span> : null}
      </label>
      <Tag
        id={id}
        name={id}
        type={rows ? undefined : type}
        rows={rows}
        value={value}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        style={error ? { borderColor: "var(--color-error, #c0392b)" } : undefined}
      />
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const {
    items,
    checkout,
    updateCheckout,
    shippingMethods,
    paymentMethods,
    placeOrder,
    placeOrderWithPayment,
    totals,
    hydrated,
  } = useCart();

  const [placing, setPlacing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const onPlaceOrder = async () => {
    if (placing) return;

    // Client-side validation first.
    const errors = validateCheckoutFields(checkout, items);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(errors._form || "Please fix the errors above before placing your order.");
      // Scroll to first error.
      const firstErrorId = Object.keys(errors).find((k) => k !== "_form");
      if (firstErrorId) {
        document.getElementById(firstErrorId)?.focus();
      }
      return;
    }

    setFieldErrors({});
    setFormError("");
    setPlacing(true);

    try {
      const order = await placeOrderWithPayment();
      // Redirect to server-rendered success page using the real order ID.
      const orderId = order?.id || order?.orderId;
      if (orderId) {
        router.push(`/order/success/${orderId}`);
      } else {
        router.push("/order/success");
      }
    } catch (error) {
      const message = error?.message || "Unable to place order right now.";
      setFormError(message);
      setPlacing(false);
    }
  };

  return (
    <ShopShell
      eyebrow="Checkout"
      title="Checkout"
      support="Complete your details to place your order."
      revealKey={`checkout-${hydrated}-${items.length}`}
    >
      {!hydrated ? null : items.length === 0 ? (
        <div className="shop-card shop-empty" data-shop-reveal>
          <h2>Nothing to checkout</h2>
          <p>Add pieces to your cart to continue.</p>
          <div style={{ marginTop: 24 }}>
            <Link href="/cart" className="shop-btn shop-btn--primary">
              Return to Cart
            </Link>
          </div>
        </div>
      ) : (
        <div className="shop-flow__grid">
          <div className="shop-checkout">
            {formError ? (
              <div
                role="alert"
                className="shop-form-error"
                style={{
                  background: "var(--color-error-bg, #fdf3f2)",
                  border: "1px solid var(--color-error, #c0392b)",
                  borderRadius: 6,
                  padding: "12px 16px",
                  marginBottom: 24,
                  color: "var(--color-error, #c0392b)",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span aria-hidden="true">âš </span>
                <span>{formError}</span>
                {!placing && (
                  <button
                    type="button"
                    onClick={() => setFormError("")}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1rem",
                      color: "inherit",
                      padding: "0 4px",
                    }}
                    aria-label="Dismiss error"
                  >
                    âœ•
                  </button>
                )}
              </div>
            ) : null}

            <section className="shop-section" data-shop-reveal aria-labelledby="contact-title">
              <h2 id="contact-title" className="shop-section__title">
                Contact Information
              </h2>
              <div className="shop-form shop-form--2">
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  value={checkout.contact.email}
                  error={fieldErrors.email}
                  onChange={(email) => {
                    updateCheckout({ contact: { email } });
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                />
                <Field
                  id="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  value={checkout.contact.phone}
                  onChange={(phone) => updateCheckout({ contact: { phone } })}
                />
              </div>
            </section>

            <section className="shop-section" data-shop-reveal aria-labelledby="shipping-title">
              <h2 id="shipping-title" className="shop-section__title">
                Shipping Address
              </h2>
              <div className="shop-form">
                <Field
                  id="fullName"
                  label="Full name"
                  required
                  autoComplete="name"
                  value={checkout.shippingAddress.fullName}
                  error={fieldErrors.fullName}
                  onChange={(fullName) => {
                    updateCheckout({ shippingAddress: { fullName } });
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                />
                <Field
                  id="line1"
                  label="Address line 1"
                  required
                  autoComplete="address-line1"
                  value={checkout.shippingAddress.line1}
                  error={fieldErrors.line1}
                  onChange={(line1) => {
                    updateCheckout({ shippingAddress: { line1 } });
                    if (fieldErrors.line1) setFieldErrors((prev) => ({ ...prev, line1: "" }));
                  }}
                />
                <Field
                  id="line2"
                  label="Address line 2"
                  autoComplete="address-line2"
                  value={checkout.shippingAddress.line2}
                  onChange={(line2) => updateCheckout({ shippingAddress: { line2 } })}
                />
                <div className="shop-form shop-form--2">
                  <Field
                    id="city"
                    label="City"
                    required
                    autoComplete="address-level2"
                    value={checkout.shippingAddress.city}
                    error={fieldErrors.city}
                    onChange={(city) => {
                      updateCheckout({ shippingAddress: { city } });
                      if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                    }}
                  />
                  <Field
                    id="state"
                    label="State"
                    autoComplete="address-level1"
                    value={checkout.shippingAddress.state}
                    onChange={(state) => updateCheckout({ shippingAddress: { state } })}
                  />
                </div>
                <div className="shop-form shop-form--2">
                  <Field
                    id="postalCode"
                    label="Postal code"
                    required
                    autoComplete="postal-code"
                    value={checkout.shippingAddress.postalCode}
                    error={fieldErrors.postalCode}
                    onChange={(postalCode) => {
                      updateCheckout({ shippingAddress: { postalCode } });
                      if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: "" }));
                    }}
                  />
                  <Field
                    id="country"
                    label="Country"
                    autoComplete="country-name"
                    value={checkout.shippingAddress.country}
                    onChange={(country) => updateCheckout({ shippingAddress: { country } })}
                  />
                </div>
              </div>
            </section>

            <section className="shop-section" data-shop-reveal aria-labelledby="delivery-title">
              <h2 id="delivery-title" className="shop-section__title">
                Delivery Method
              </h2>
              <div className="shop-choice" role="radiogroup" aria-label="Delivery method">
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    data-active={checkout.deliveryMethodId === method.id ? "true" : "false"}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={checkout.deliveryMethodId === method.id}
                      onChange={() => updateCheckout({ deliveryMethodId: method.id })}
                    />
                    <span>
                      <strong>{method.label}</strong>
                      <small>
                        {method.detail}
                        {method.amount != null ? ` â€” â‚¹${method.amount}` : ""}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="shop-section" data-shop-reveal aria-labelledby="payment-title">
              <h2 id="payment-title" className="shop-section__title">
                Payment Method
              </h2>
              <div className="shop-choice" role="radiogroup" aria-label="Payment method">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    data-active={checkout.paymentMethodId === method.id ? "true" : "false"}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={checkout.paymentMethodId === method.id}
                      onChange={() => updateCheckout({ paymentMethodId: method.id })}
                    />
                    <span>
                      <strong>{method.label}</strong>
                      <small>{method.detail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="shop-section" data-shop-reveal aria-labelledby="coupon-title">
              <h2 id="coupon-title" className="shop-section__title">
                Coupon
              </h2>
              <Field
                id="couponCode"
                label="Coupon code"
                value={checkout.couponCode}
                onChange={(couponCode) => updateCheckout({ couponCode })}
              />
              {totals.coupon?.message ? (
                <p
                  className="shop-note"
                  style={{
                    color: totals.coupon.valid
                      ? "var(--color-success, #27ae60)"
                      : "var(--color-error, #c0392b)",
                  }}
                >
                  {totals.coupon.message}
                </p>
              ) : null}
            </section>

            <section className="shop-section" data-shop-reveal aria-labelledby="notes-title">
              <h2 id="notes-title" className="shop-section__title">
                Notes
              </h2>
              <Field
                id="notes"
                label="Order notes"
                rows={4}
                value={checkout.notes}
                onChange={(notes) => updateCheckout({ notes })}
              />
            </section>
          </div>

          <OrderSummary
            primaryLabel={placing ? "Processingâ€¦" : "Place Order"}
            primaryDisabled={placing}
            onPrimary={onPlaceOrder}
            showContinue={false}
          />

          <div className="shop-sticky-cta">
            <button
              type="button"
              className="shop-btn shop-btn--primary"
              style={{ width: "100%" }}
              disabled={placing}
              onClick={onPlaceOrder}
            >
              {placing ? "Processingâ€¦" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </ShopShell>
  );
}

/** Client-side success view â€” reads lastOrder from localStorage. Used as fallback. */
export function SuccessView() {
  const markRef = useRef(null);
  const { lastOrder, hydrated } = useCart();

  useLayoutEffect(() => {
    const mark = markRef.current;
    if (!mark) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const path = mark.querySelector("path");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mark,
        { scale: 0.86, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: reduced ? 0 : 0.55,
          ease: "power2.out",
          force3D: true,
        }
      );
      if (path && !reduced) {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          fill: "transparent",
        });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.7,
          delay: 0.15,
          ease: "power2.out",
        });
        gsap.to(path, {
          fill: "currentColor",
          duration: 0.25,
          delay: 0.7,
        });
      }
    }, mark);

    return () => ctx.revert();
  }, [lastOrder?.number, hydrated]);

  const orderNumber = lastOrder?.number || "BB-PENDING";

  return (
    <ShopShell
      eyebrow="Confirmed"
      title="Order placed"
      support="Thank you for your order."
      revealKey={`success-${orderNumber}`}
    >
      <div className="shop-success" data-shop-reveal>
        <div className="shop-success__mark" ref={markRef} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 13.5 9.5 18 19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="shop-success__number">Order {orderNumber}</p>
        <div className="shop-success__actions">
          <Link href="/#shop" className="shop-btn shop-btn--primary">
            Continue Shopping
          </Link>
          <Link href="/account" className="shop-btn shop-btn--ghost">
            View Orders
          </Link>
        </div>
        <p className="shop-note">Your order is stored against your customer account.</p>
      </div>
    </ShopShell>
  );
}

/**
 * Server-rendered success view â€” receives a serialized order object from the
 * server component (app/order/success/[orderId]/page.js). No localStorage needed.
 */
export function ServerSuccessView({ order }) {
  const markRef = useRef(null);

  useLayoutEffect(() => {
    const mark = markRef.current;
    if (!mark) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const path = mark.querySelector("path");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mark,
        { scale: 0.86, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: reduced ? 0 : 0.55,
          ease: "power2.out",
          force3D: true,
        }
      );
      if (path && !reduced) {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          fill: "transparent",
        });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.7,
          delay: 0.15,
          ease: "power2.out",
        });
        gsap.to(path, {
          fill: "currentColor",
          duration: 0.25,
          delay: 0.7,
        });
      }
    }, mark);

    return () => ctx.revert();
  }, [order?.id]);

  const address = order?.shippingAddress || {};
  const items = Array.isArray(order?.items) ? order.items : [];

  function fmt(amount) {
    if (amount == null) return "â€”";
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: order?.currency || "INR",
        maximumFractionDigits: 0,
      }).format(Number(amount));
    } catch {
      return `â‚¹${Number(amount).toLocaleString("en-IN")}`;
    }
  }

  return (
    <div className="shop-flow">
      <Navbar />
      <main className="shop-flow__main">
        <header className="shop-flow__header">
          <p className="shop-flow__eyebrow">Confirmed</p>
          <h1>Order placed</h1>
          <p className="shop-flow__support">
            Thank you for your order, {address.fullName || "Customer"}!
          </p>
        </header>

        <div className="shop-success" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="shop-success__mark" ref={markRef} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 13.5 9.5 18 19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="shop-success__number">Order {order?.orderNumber}</p>

          {/* Order items */}
          {items.length > 0 ? (
            <div className="shop-card" style={{ marginTop: 32, width: "100%" }}>
              <h2 className="shop-section__title" style={{ marginBottom: 16 }}>Items Ordered</h2>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "12px 0",
                    borderBottom: i < items.length - 1 ? "1px solid var(--color-border, #e5e5e5)" : "none",
                    alignItems: "center",
                  }}
                >
                  {item.image?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image.src}
                      alt={item.product?.name || ""}
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, background: "var(--color-surface, #f5f5f5)", borderRadius: 4, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.9375rem" }}>
                      {item.product?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8125rem", opacity: 0.7 }}>
                      {item.color?.name}{item.size ? ` Â· ${item.size}` : ""}
                      {" Â· "}Qty {item.quantity}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {fmt(item.lineTotal)}
                  </p>
                </div>
              ))}

              {/* Totals */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "2px solid var(--color-border, #e5e5e5)" }}>
                <div className="shop-summary__row">
                  <span>Subtotal</span>
                  <span>{fmt(order?.subtotal)}</span>
                </div>
                <div className="shop-summary__row">
                  <span>Shipping</span>
                  <span>{fmt(order?.shipping)}</span>
                </div>
                {Number(order?.discounts) > 0 ? (
                  <div className="shop-summary__row">
                    <span>Discount {order?.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span>-{fmt(order?.discounts)}</span>
                  </div>
                ) : null}
                <div className="shop-summary__row shop-summary__row--total">
                  <span>Total</span>
                  <span>{fmt(order?.total)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Shipping address */}
          <div className="shop-card" style={{ marginTop: 16, width: "100%", textAlign: "left" }}>
            <h2 className="shop-section__title" style={{ marginBottom: 12 }}>Shipping Address</h2>
            <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>{address.fullName}</p>
            <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>
              {address.line1}{address.line2 ? `, ${address.line2}` : ""}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>
              {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{address.country || "India"}</p>
          </div>

          <div className="shop-success__actions" style={{ marginTop: 24 }}>
            <Link href="/#shop" className="shop-btn shop-btn--primary">
              Continue Shopping
            </Link>
            <Link href="/account" className="shop-btn shop-btn--ghost">
              View Orders
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ShoppingFlow({ view }) {
  return (
    <CartProvider>
      {view === "cart" ? <CartView /> : null}
      {view === "checkout" ? <CheckoutView /> : null}
      {view === "success" ? <SuccessView /> : null}
    </CartProvider>
  );
}
