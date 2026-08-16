"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Heart,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import gsap from "gsap";

import { useShop } from "@/lib/shop/ShopContext";
import { useCart } from "@/lib/shop/commerce";
import "./product.css";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function normalizeMedia(item, index) {
  if (typeof item === "string") {
    return { src: item, alt: "", type: "image", key: `${item}-${index}` };
  }

  return {
    src: item?.src || "",
    alt: item?.alt || "",
    type: item?.type || "image",
    key: `${item?.src || "media"}-${index}`,
  };
}

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function colorAwareTitle(productName, selectedColorName, allColorNames) {
  const base = String(productName || "").trim();
  const selectedWords = String(selectedColorName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!base) return "";
  if (!selectedWords.length) return base;

  const colorWordSet = new Set(
    (Array.isArray(allColorNames) && allColorNames.length
      ? allColorNames
      : [selectedColorName]
    )
      .flatMap((name) =>
        String(name || "").trim().toLowerCase().split(/\s+/).filter(Boolean)
      )
  );

  const words = base.split(/\s+/);
  let cut = 0;
  while (cut < words.length && colorWordSet.has(words[cut].toLowerCase())) cut++;
  const rest = words.slice(cut).join(" ");
  return `${selectedWords.join(" ")} ${rest}`.trim();
}

export default function ProductDetails({ product }) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useShop();
  const { addItem } = useCart();
  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const lensRef = useRef(null);
  const touchStartRef = useRef(null);
  const [activeColor, setActiveColor] = useState(0);
  const [activeMedia, setActiveMedia] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    () => product?.sizes?.find((entry) => String(entry?.size || "").trim())?.size || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const mountedRef = useRef(false);

  const color = product?.colors?.[activeColor] || product?.colors?.[0];
  const title = colorAwareTitle(
    product?.name,
    color?.name,
    (product?.colors || []).map((entry) => entry.name)
  );
  const colorSizes = useMemo(() => {
    const candidate = Array.isArray(color?.sizes) && color.sizes.length > 0 ? color.sizes : product?.sizes || [];
    return candidate.map((entry) => ({
      size: entry?.size || entry?.label || "",
      stock: Number(entry?.stock ?? 0) || 0,
      sku: entry?.sku || "",
    })).filter((entry) => entry.size);
  }, [color?.sizes, product?.sizes, color, product]);

  const gallery = useMemo(() => {
    const combined = [...(color?.gallery || []), ...(product?.gallery || [])];
    const seen = new Set();
    return combined
      .map(normalizeMedia)
      .filter((item) => item.src && !seen.has(item.src) && seen.add(item.src));
  }, [color, product?.gallery]);

  const current = gallery[activeMedia] || gallery[0];
  const selectedSizeOption = colorSizes.find((entry) => entry.size === selectedSize) || null;
  const selectedStock = Math.max(1, Number(selectedSizeOption?.stock ?? 10) || 10);
  const price = formatPrice(Number(product?.price) || 0);
  const comparePrice = formatPrice(product?.comparePrice);
  const canPurchase = Boolean(selectedSize);
  const wishlist = Boolean(product?.id ? isInWishlist(product.id) : false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    const nextSize = colorSizes[0]?.size || "";
    setSelectedSize((currentSize) => {
      if (!currentSize && nextSize) return nextSize;
      if (nextSize && !colorSizes.some((entry) => entry.size === currentSize)) {
        return nextSize;
      }
      if (!nextSize && currentSize) return "";
      return currentSize;
    });
    setQuantity(1);
  }, [activeColor, colorSizes]);

  const changeMedia = useCallback((direction) => {
    if (gallery.length < 2) return;
    setActiveMedia((index) => (index + direction + gallery.length) % gallery.length);
  }, [gallery.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const crumbs = root.querySelectorAll(".pdp__crumbs li");
    const gallery = root.querySelector("[data-gallery]");
    const purchase = root.querySelector("[data-purchase]");

    const ctx = gsap.context(() => {
      gsap.set([crumbs, gallery, purchase], { autoAlpha: 0, y: 18 });
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(crumbs, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
        })
        .to(
          gallery,
          { autoAlpha: 1, y: 0, duration: 0.75 },
          "-=0.25"
        )
        .to(
          purchase,
          { autoAlpha: 1, y: 0, duration: 0.65 },
          "-=0.45"
        );
    }, root);

    return () => ctx.revert();
  }, [product?.slug]);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || prefersReducedMotion()) return;
    gsap.fromTo(
      image,
      { autoAlpha: 0, scale: 1.015 },
      { autoAlpha: 1, scale: 1, duration: 0.55, ease: "power2.out" }
    );
  }, [activeMedia, activeColor]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const controls = root.querySelectorAll("[data-luxury-action]");
    const reduced = prefersReducedMotion();
    const cleanups = [];

    controls.forEach((control) => {
      const enter = () => {
        if (control.disabled) return;
        gsap.to(control, {
          y: reduced ? 0 : -2,
          duration: reduced ? 0 : 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const leave = () => {
        gsap.to(control, {
          y: 0,
          scale: 1,
          duration: reduced ? 0 : 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const down = () => {
        if (control.disabled) return;
        gsap.to(control, {
          y: 0,
          scale: reduced ? 1 : 0.985,
          duration: reduced ? 0 : 0.16,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      control.addEventListener("pointerenter", enter);
      control.addEventListener("pointerleave", leave);
      control.addEventListener("focus", enter);
      control.addEventListener("blur", leave);
      control.addEventListener("pointerdown", down);
      control.addEventListener("pointerup", enter);
      cleanups.push(() => {
        control.removeEventListener("pointerenter", enter);
        control.removeEventListener("pointerleave", leave);
        control.removeEventListener("focus", enter);
        control.removeEventListener("blur", leave);
        control.removeEventListener("pointerdown", down);
        control.removeEventListener("pointerup", enter);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [product?.slug]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") changeMedia(-1);
      if (event.key === "ArrowRight") changeMedia(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [changeMedia, fullscreen]);

  const handlePointerMove = (event) => {
    if (event.pointerType === "touch" || !imageRef.current || !lensRef.current) return;
    const frame = event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - frame.left, 0), frame.width);
    const y = Math.min(Math.max(event.clientY - frame.top, 0), frame.height);
    const xPercent = (x / frame.width) * 100;
    const yPercent = (y / frame.height) * 100;

    gsap.to(imageRef.current, {
      scale: 1.03,
      transformOrigin: `${xPercent}% ${yPercent}%`,
      duration: 0.65,
      ease: "power3.out",
      overwrite: "auto",
    });
    gsap.set(lensRef.current, {
      x: x - 70,
      y: y - 70,
      backgroundImage: `url("${current?.src}")`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
      backgroundSize: `${frame.width * 2.15}px ${frame.height * 2.15}px`,
    });
    gsap.to(lensRef.current, {
      autoAlpha: 1,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handlePointerLeave = () => {
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
    if (lensRef.current) {
      gsap.to(lensRef.current, {
        autoAlpha: 0,
        duration: 0.3,
        overwrite: "auto",
      });
    }
  };

  const handleTouchStart = (event) => {
    touchStartRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartRef.current == null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartRef.current) -
      touchStartRef.current;
    touchStartRef.current = null;
    if (Math.abs(delta) < 45) return;
    changeMedia(delta < 0 ? 1 : -1);
  };

  const handleGalleryKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeMedia(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeMedia(1);
    }
    if (event.key === "Enter") setFullscreen(true);
  };

  const chooseColor = (index) => {
    setActiveColor(index);
    setActiveMedia(0);
  };

  const chooseSize = (entry) => {
    if (!entry || !entry.size) return;
    setSelectedSize(entry.size);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.gallery?.[0]?.src || product.image,
      color: color?.name || "Default",
      size: selectedSize,
      quantity,
    });
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize) return;
    handleAddToCart();
    router.push("/checkout");
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.gallery?.[0]?.src || product.image,
      gallery: product.gallery || [],
    });
  };

  const checkDelivery = (event) => {
    event.preventDefault();
    setDeliveryChecked(/^\d{6}$/.test(pincode));
  };

  if (!product) return null;

  return (
    <section
      ref={rootRef}
      className="pdp"
      aria-label={`${product.name} product details`}
    >
      <div className="pdp__backdrop" aria-hidden="true" />

      <div className="pdp__container">
        <nav aria-label="Breadcrumb">
          <ol className="pdp__crumbs">
            <li>
              <Link href="/">Home</Link>
              <span className="pdp__crumbs-sep" aria-hidden="true">
                ›
              </span>
            </li>
            <li>
              <Link href={`/category/${product.categorySlug}`}>
                {product.category}
              </Link>
              <span className="pdp__crumbs-sep" aria-hidden="true">
                ›
              </span>
            </li>
            <li>
              <span aria-current="page">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="pdp__stage">
          <div className="pdp-gallery" data-gallery>
            <ul className="pdp-gallery__thumbs" aria-label="Product images">
              {gallery.map((item, index) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="pdp-gallery__thumb"
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={index === activeMedia}
                    onClick={() => setActiveMedia(index)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="pdp-gallery__thumb-media"
                      src={item.src}
                      alt=""
                    />
                  </button>
                </li>
              ))}
            </ul>

            <div
              className="pdp-gallery__stage"
              tabIndex={0}
              role="group"
              aria-label="Product gallery. Use arrow keys to change image."
              data-media-type={current?.type}
              onKeyDown={handleGalleryKeyDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="pdp-gallery__frame">
                <span className="pdp-gallery__border" aria-hidden="true" />
                {current ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${current.src}-${activeMedia}`}
                    ref={imageRef}
                    className="pdp-gallery__media"
                    src={current.src}
                    alt={current.alt || product.name}
                  />
                ) : null}
                <span
                  ref={lensRef}
                  className="pdp-gallery__magnifier"
                  aria-hidden="true"
                />
                {current?.type === "360" ? (
                  <span className="pdp-gallery__spin-badge">360°</span>
                ) : null}
                <button
                  type="button"
                  className="pdp-gallery__expand"
                  data-luxury-action
                  aria-label="Open fullscreen gallery"
                  onClick={() => setFullscreen(true)}
                >
                  <Expand size={15} strokeWidth={1.5} aria-hidden="true" />
                  View
                </button>
              </div>
            </div>
          </div>

          <aside className="pdp__purchase" data-purchase>
            <header className="pdp__purchase-header">
              <p className="pdp__category">{product.category}</p>
              <h1 className="pdp__title">{title}</h1>
              {product.brandStatement ? (
                <p className="pdp__statement">{product.brandStatement}</p>
              ) : null}
            </header>

            <div className="pdp__price" aria-label="Price">
              {price ? <span>{price}</span> : <span aria-hidden="true">—</span>}
              {comparePrice ? <del>{comparePrice}</del> : null}
            </div>

            {product.colors?.length ? (
              <fieldset className="pdp__field">
                <legend>
                  Color
                  {color?.name ? <span>{color.name}</span> : null}
                </legend>
                <div className="pdp__swatches">
                  {product.colors.map((entry, index) => (
                    <button
                      key={`${entry.name}-${entry.hex}`}
                      type="button"
                      className="pdp__swatch"
                      style={{ "--swatch": entry.hex }}
                      aria-label={entry.name}
                      aria-pressed={index === activeColor}
                      data-luxury-action
                      onClick={() => chooseColor(index)}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {colorSizes.length ? (
              <fieldset className="pdp__field">
                <legend>Size</legend>
                <div className="pdp__sizes">
                  {colorSizes.map((entry) => (
                    <button
                      key={`${color?.id || product?.id}-${entry.size}`}
                      type="button"
                      className="pdp__size"
                      aria-pressed={selectedSize === entry.size}
                      data-luxury-action
                      onClick={() => chooseSize(entry)}
                    >
                      {entry.size}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="pdp__quantity">
              <span>Quantity</span>
              <div className="pdp__stepper">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  data-luxury-action
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={!selectedSize || quantity >= selectedStock}
                  data-luxury-action
                  onClick={() =>
                    setQuantity((value) => Math.min(selectedStock, value + 1))
                  }
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <form className="pdp__delivery" onSubmit={checkDelivery}>
              <label htmlFor="delivery-pincode">Delivery</label>
              <div className="pdp__delivery-control">
                <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                <input
                  id="delivery-pincode"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(event) => {
                    setPincode(event.target.value.replace(/\D/g, ""));
                    setDeliveryChecked(false);
                  }}
                />
                <button type="submit" data-luxury-action>
                  Check
                </button>
              </div>
              {deliveryChecked ? (
                <p className="pdp__delivery-result" role="status">
                  {product.shipping?.freeShipping
                    ? "Free shipping is available."
                    : "Delivery is available."}
                </p>
              ) : null}
            </form>

            {product.shipping ? (
              <ul className="pdp__trust" aria-label="Shopping assurances">
                {product.shipping.freeShipping ? (
                  <li>
                    <Truck size={17} strokeWidth={1.4} aria-hidden="true" />
                    <span>Free Shipping</span>
                  </li>
                ) : null}
                {product.shipping.cod ? (
                  <li>
                    <ShieldCheck size={17} strokeWidth={1.4} aria-hidden="true" />
                    <span>COD</span>
                  </li>
                ) : null}
                {product.shipping.returnDays ? (
                  <li>
                    <RotateCcw size={17} strokeWidth={1.4} aria-hidden="true" />
                    <span>{product.shipping.returnDays}-Day Returns</span>
                  </li>
                ) : null}
              </ul>
            ) : null}

            <button
              type="button"
              className={`pdp__wishlist${wishlist ? " is-active" : ""}`}
              aria-pressed={wishlist}
              data-luxury-action
              onClick={handleWishlistToggle}
            >
              <Heart
                size={17}
                strokeWidth={1.5}
                fill={wishlist ? "currentColor" : "none"}
                aria-hidden="true"
              />
              Wishlist
            </button>

            <button
              type="button"
              className="pdp__cta pdp__cta--bag"
              disabled={!canPurchase}
              data-luxury-action
              onClick={handleAddToCart}
            >
              <ShoppingBag size={17} strokeWidth={1.5} aria-hidden="true" />
              Add To Bag
            </button>

            <button
              type="button"
              className="pdp__cta pdp__cta--buy"
              disabled={!canPurchase}
              data-luxury-action
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </aside>
        </div>
      </div>

      <div
        className={`pdp-fullscreen${fullscreen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} fullscreen gallery`}
        aria-hidden={!fullscreen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(event) => {
          if (event.target === event.currentTarget) setFullscreen(false);
        }}
      >
        <button
          type="button"
          className="pdp-fullscreen__close"
          aria-label="Close fullscreen gallery"
          onClick={() => setFullscreen(false)}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              className="pdp-fullscreen__nav pdp-fullscreen__nav--prev"
              aria-label="Previous image"
              data-luxury-action
              onClick={() => changeMedia(-1)}
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pdp-fullscreen__nav pdp-fullscreen__nav--next"
              aria-label="Next image"
              data-luxury-action
              onClick={() => changeMedia(1)}
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </>
        ) : null}

        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pdp-fullscreen__image"
            src={current.src}
            alt={current.alt || product.name}
          />
        ) : null}

        <p className="pdp-fullscreen__count">
          {activeMedia + 1} / {gallery.length}
        </p>
      </div>
    </section>
  );
}
