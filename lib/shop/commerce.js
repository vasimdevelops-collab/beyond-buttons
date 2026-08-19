"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { getProductBySlug, getSettings } from "@/lib/data";
import { toast } from "@/components/toast/toast-store";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const CART_STORAGE_KEY = "bb-cart-v1";
const CHECKOUT_STORAGE_KEY = "bb-checkout-v1";
const ORDER_STORAGE_KEY = "bb-last-order-v1";
const WISHLIST_STORAGE_KEY = "bb-wishlist-v1";

/* ── Placeholder adapters (swap for real services later) ── */

export const shippingAdapter = {
  listMethods() {
    return [
      {
        id: "standard",
        label: "Standard Delivery",
        detail: "4–6 business days",
        amount: 199,
      },
      {
        id: "express",
        label: "Express Delivery",
        detail: "1–2 business days",
        amount: 399,
      },
    ];
  },
  resolveAmount(methodId) {
    const method = this.listMethods().find((entry) => entry.id === methodId);
    if (!method || method.amount == null) return 0;
    return Number(method.amount) || 0;
  },
};

export const paymentAdapter = {
  listMethods() {
    const methods = [
      {
        id: "cod",
        label: "Cash on Delivery",
        detail: "Pay on delivery",
      },
    ];

    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      methods.push({
        id: "online",
        label: "Online Payment",
        detail: "Secure card / UPI / net banking",
      });
    }

    return methods;
  },

  async createRazorpayOrder(amount, currency = "INR", receipt, notes = {}) {
    const response = await fetch("/api/payments/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Unable to initialize payment.");
    }
    return data.order;
  },

  async verifyRazorpayPayment(orderId, paymentId, signature) {
    const response = await fetch("/api/payments/razorpay", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.verified) {
      throw new Error(data?.error || "Payment verification failed.");
    }
    return true;
  },
};

export const couponAdapter = {
  async apply(code, subtotal = 0) {
    const trimmed = String(code || "").trim();
    if (!trimmed) {
      return { valid: false, discount: 0, message: "" };
    }

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.valid) {
        return {
          valid: false,
          discount: 0,
          message: data?.message || "Coupon is invalid.",
        };
      }

      return {
        valid: true,
        discount: Number(data.discount) || 0,
        message: data.message || "Coupon applied successfully.",
      };
    } catch {
      return {
        valid: false,
        discount: 0,
        message: "Coupon service unavailable.",
      };
    }
  },
};

export const orderAdapter = {
  async create(payload) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      const message = data?.error || "Unable to place order.";
      throw new Error(message);
    }

    return {
      id: data.order?.id || `BB-${Date.now().toString(36).toUpperCase()}`,
      number: data.order?.orderNumber || data.order?.id || `BB-${Date.now().toString(36).toUpperCase()}`,
      status: "placed",
      createdAt: new Date().toISOString(),
      ...data.order,
    };
  },
};

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode
  }
}

const EMPTY_CHECKOUT = {
  contact: { email: "", phone: "" },
  shippingAddress: {
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  },
  deliveryMethodId: "standard",
  paymentMethodId: "cod",
  couponCode: "",
  notes: "",
};

function createPersistedStore(key, fallback) {
  let snapshot = fallback;
  let ready = false;
  const listeners = new Set();

  const emit = () => listeners.forEach((listener) => listener());

  const hydrate = () => {
    if (typeof window === "undefined") return;
    snapshot = readStorage(key, fallback);
    ready = true;
  };

  return {
    subscribe(listener) {
      hydrate();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      if (!ready && typeof window !== "undefined") hydrate();
      return snapshot;
    },
    getServerSnapshot() {
      return fallback;
    },
    set(next) {
      if (!ready && typeof window !== "undefined") hydrate();
      snapshot = typeof next === "function" ? next(snapshot) : next;
      ready = true;
      writeStorage(key, snapshot);
      emit();
    },
  };
}

const itemsStore = createPersistedStore(CART_STORAGE_KEY, []);
const checkoutStore = createPersistedStore(CHECKOUT_STORAGE_KEY, EMPTY_CHECKOUT);
const orderStore = createPersistedStore(ORDER_STORAGE_KEY, null);
const wishlistStore = createPersistedStore(WISHLIST_STORAGE_KEY, []);

function lineKey({ productId, color, size }) {
  return [productId, color || "", size || ""].join("::");
}

function resolveCatalogLine(item) {
  const product = getProductBySlug(item.slug || item.productId);
  if (!product) return item;

  const image =
    item.image ||
    product.gallery?.[0]?.src ||
    product.gallery?.[0] ||
    "";

  return {
    ...item,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image,
    unitPrice: product.price == null ? null : Number(product.price),
  };
}

export function formatMoney(amount, currency = "INR", locale = "en-IN") {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${Number(amount).toLocaleString(locale)}`;
  }
}

export async function computeTotals(items, { shippingMethodId, couponCode } = {}) {
  const lines = (items || []).map(resolveCatalogLine);
  let pricesPending = false;
  let subtotal = 0;

  lines.forEach((line) => {
    if (line.unitPrice == null) {
      pricesPending = true;
      return;
    }
    subtotal += Number(line.unitPrice) * Number(line.quantity || 0);
  });

  const shipping = shippingAdapter.resolveAmount(shippingMethodId);
  const coupon = await couponAdapter.apply(couponCode, subtotal);
  const discount = coupon.valid ? Number(coupon.discount) || 0 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  return {
    lines,
    subtotal,
    shipping,
    discount,
    total,
    pricesPending,
    coupon,
    itemCount: lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
  };
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const items = useSyncExternalStore(
    itemsStore.subscribe,
    itemsStore.getSnapshot,
    itemsStore.getServerSnapshot
  );
  const checkoutRaw = useSyncExternalStore(
    checkoutStore.subscribe,
    checkoutStore.getSnapshot,
    checkoutStore.getServerSnapshot
  );
  const lastOrder = useSyncExternalStore(
    orderStore.subscribe,
    orderStore.getSnapshot,
    orderStore.getServerSnapshot
  );
  const wishlist = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot
  );

  const checkout = useMemo(
    () => ({
      ...EMPTY_CHECKOUT,
      ...checkoutRaw,
      contact: { ...EMPTY_CHECKOUT.contact, ...checkoutRaw?.contact },
      shippingAddress: {
        ...EMPTY_CHECKOUT.shippingAddress,
        ...checkoutRaw?.shippingAddress,
      },
    }),
    [checkoutRaw]
  );

  const settings = getSettings();

  const addItem = useCallback((input) => {
    const product = getProductBySlug(input.slug || input.productId);
    if (!product && !input.name) return;

    const next = {
      id: lineKey({
        productId: product?.id || input.productId,
        color: input.color,
        size: input.size,
      }),
      productId: product?.id || input.productId,
      slug: product?.slug || input.slug,
      name: product?.name || input.name,
      image:
        input.image ||
        product?.gallery?.[0]?.src ||
        product?.gallery?.[0] ||
        "",
      color: input.color || "",
      size: input.size || "",
      quantity: Math.max(1, Number(input.quantity) || 1),
      unitPrice: product?.price == null ? null : Number(product.price),
    };

    itemsStore.set((prev) => {
      const existing = prev.find((line) => line.id === next.id);
      if (!existing) return [...prev, next];
      return prev.map((line) =>
        line.id === next.id
          ? { ...line, quantity: line.quantity + next.quantity }
          : line
      );
    });

    toast.success(`Added ${product?.name || input.name} to cart`);
  }, []);

  const removeItem = useCallback((id) => {
    itemsStore.set((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    const qty = Number(quantity) || 0;
    if (qty < 1) {
      itemsStore.set((prev) => prev.filter((line) => line.id !== id));
      return;
    }
    itemsStore.set((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity: qty } : line))
    );
  }, []);

  const clearCart = useCallback(() => itemsStore.set([]), []);

  const toggleWishlist = useCallback((product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    wishlistStore.set((prev) => {
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image || product.gallery?.[0]?.src,
        },
      ];
    });

    if (exists) {
      toast.info("Removed from wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  }, [wishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some((item) => item.id === productId);
  }, [wishlist]);

  const updateCheckout = useCallback((patch) => {
    checkoutStore.set((prev) => {
      const base = { ...EMPTY_CHECKOUT, ...prev };
      if (patch.contact) {
        return {
          ...base,
          contact: { ...EMPTY_CHECKOUT.contact, ...base.contact, ...patch.contact },
        };
      }
      if (patch.shippingAddress) {
        return {
          ...base,
          shippingAddress: {
            ...EMPTY_CHECKOUT.shippingAddress,
            ...base.shippingAddress,
            ...patch.shippingAddress,
          },
        };
      }
      return { ...base, ...patch };
    });
  }, []);

  const [totals, setTotals] = useState({
    lines: items.map(resolveCatalogLine),
    subtotal: 0,
    shipping: shippingAdapter.resolveAmount(checkout.deliveryMethodId),
    discount: 0,
    total: 0,
    pricesPending: false,
    coupon: { valid: false, discount: 0, message: "" },
    itemCount: items.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
  });

  useEffect(() => {
    let active = true;

    async function refresh() {
      const next = await computeTotals(items, {
        shippingMethodId: checkout.deliveryMethodId,
        couponCode: checkout.couponCode,
      });

      if (active) setTotals(next);
    }

    refresh();
    return () => {
      active = false;
    };
  }, [items, checkout.deliveryMethodId, checkout.couponCode]);

  const placeOrder = useCallback(
    async (overrides = {}) => {
      const snapshot = await computeTotals(items, {
        shippingMethodId: checkout.deliveryMethodId,
        couponCode: checkout.couponCode,
      });

      // Always set paymentStatus to "pending" initially.
      // The Razorpay webhook will update it to "paid" after verification.
      // Never trust client-side payment status for online orders.
      const paymentStatus = "pending";

      const order = await orderAdapter.create({
        items: snapshot.lines,
        shippingAddress: checkout.shippingAddress,
        contact: checkout.contact,
        notes: checkout.notes,
        couponCode: checkout.couponCode,
        paymentMethodId: checkout.paymentMethodId,
        deliveryMethodId: checkout.deliveryMethodId,
        paymentStatus,
        totals: {
          subtotal: snapshot.subtotal,
          shipping: snapshot.shipping,
          discount: snapshot.discount,
          total: snapshot.total,
          pricesPending: snapshot.pricesPending,
        },
        currency: settings.currency || "INR",
        locale: settings.locale || "en-IN",
      });

      orderStore.set(order);
      itemsStore.set([]);
      return order;
    },
    [items, checkout, settings.currency, settings.locale]
  );

  const placeOrderWithPayment = useCallback(
    async () => {
      if (checkout.paymentMethodId !== "online") {
        return placeOrder();
      }

      const snapshot = await computeTotals(items, {
        shippingMethodId: checkout.deliveryMethodId,
        couponCode: checkout.couponCode,
      });

      const amount = Math.round(snapshot.total * 100);
      const receipt = `bb-${Date.now()}`;
      const notes = {
        email: checkout.contact.email,
        phone: checkout.contact.phone,
      };

      const razorpayOrder = await paymentAdapter.createRazorpayOrder(amount, "INR", receipt, notes);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please try again.");
      }

      return new Promise((resolve, reject) => {
        const options = {
          key: razorpayOrder.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Beyond Buttons",
          description: "Order payment",
          order_id: razorpayOrder.orderId,
          prefill: {
            name: checkout.shippingAddress.fullName,
            email: checkout.contact.email,
            contact: checkout.contact.phone,
          },
          notes: {
            address: `${checkout.shippingAddress.line1}, ${checkout.shippingAddress.city}, ${checkout.shippingAddress.postalCode}`,
          },
          theme: {
            color: "#0A0A0A",
          },
          handler: async (response) => {
            try {
              await paymentAdapter.verifyRazorpayPayment(
                razorpayOrder.orderId,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              const order = await placeOrder({ paymentStatus: "paid" });
              resolve(order);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled."));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed."));
        });
        rzp.open();
      });
    },
    [items, checkout, placeOrder]
  );

  const value = useMemo(
    () => ({
      hydrated: true,
      items: totals.lines,
      itemCount: totals.itemCount,
      totals,
      checkout,
      lastOrder,
      wishlist,
      wishlistCount: wishlist.length,
      settings,
      shippingMethods: shippingAdapter.listMethods(),
      paymentMethods: paymentAdapter.listMethods(),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      updateCheckout,
      placeOrder,
      placeOrderWithPayment,
      toggleWishlist,
      isInWishlist,
      formatMoney: (amount) =>
        formatMoney(amount, settings.currency || "INR", settings.locale || "en-IN"),
    }),
    [
      totals,
      checkout,
      lastOrder,
      wishlist,
      settings,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      updateCheckout,
      placeOrder,
      placeOrderWithPayment,
      toggleWishlist,
      isInWishlist,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
