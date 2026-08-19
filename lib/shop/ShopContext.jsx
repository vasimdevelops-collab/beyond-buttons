"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { toast } from "@/components/toast/toast-store";

const ShopContext = createContext(null);

const CART_STORAGE_KEY = "bb-cart";
const WISHLIST_STORAGE_KEY = "bb-wishlist";

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      console.error("Failed to load cart state:", err);
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedWishlist = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (err) {
      console.error("Failed to load wishlist state:", err);
      return [];
    }
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product, size, quantity = 1) => {
    setCart((prev) => {
      const lineKey = `${product.id}-${size}-${product.color?.name || "default"}`;
      const existingIndex = prev.findIndex((item) => item.lineKey === lineKey);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      return [
        ...prev,
        {
          lineKey,
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image || product.gallery?.[0]?.src,
          size,
          quantity,
          color: product.color?.name || "Default",
        },
      ];
    });
  };

  const removeFromCart = (lineKey) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  const updateCartQuantity = (lineKey, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.lineKey === lineKey ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    const exists = isInWishlist(product.id);
    setWishlist((prev) => {
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
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartCount,
        wishlistCount,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
