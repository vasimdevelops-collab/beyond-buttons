"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import ThemeToggle from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useCart } from "@/lib/shop/commerce";

import MegaMenu from "./MegaMenu";
import MobileDrawer from "./MobileDrawer";
import "./navbar.css";

const NAV_LINKS = [
  { label: "Home", href: "/", current: true },
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const NAV_ACTIONS = [
  { label: "Cart", href: "/cart", Icon: ShoppingBag },
  { label: "Search", href: "/search", Icon: Search },
  { label: "Wishlist", href: "/wishlist", Icon: Heart },
  { label: "Account", href: "/account", Icon: UserRound },
];

// The navbar's height and logo size are intentionally fixed per breakpoint —
// scrolling only ever morphs the background (see Issue: logo/inner must
// never move or resize while scrolling, only the glass background changes).
function getNavHeight() {
  const width = window.innerWidth;

  if (width >= 1920) return 104;
  if (width <= 767) return 82;
  if (width <= 1023) return 86;
  return 92;
}

function getBrandWidth() {
  const width = window.innerWidth;

  if (width >= 1920) return 108;
  if (width <= 767) return 84;
  if (width <= 1023) return 88;
  return 94;
}

// The scroll-driven glass surface and hover colors are applied as inline
// styles by GSAP, which never re-reads CSS custom properties on its own.
// Reading the live theme tokens here — instead of hardcoding hex/rgba
// strings — is what lets the navbar actually repaint when the theme
// toggle flips data-theme, rather than staying stuck on its first color.
function readThemeTokens() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();

  return {
    surface: read("--surface-glass"),
    surfaceTransparent: read("--surface-glass-transparent"),
    borderGold: read("--hairline-gold"),
    borderGoldTransparent: read("--hairline-gold-transparent"),
    shadow: read("--shadow-soft"),
    shadowTransparent: read("--shadow-soft-transparent"),
    goldLight: read("--goldLight"),
    offWhite: read("--offWhite"),
  };
}

export default function Navbar() {
  const { theme } = useTheme();
  const { itemCount, wishlistCount } = useCart();
  const headerRef = useRef(null);
  const surfaceRef = useRef(null);
  const innerRef = useRef(null);
  const brandRef = useRef(null);
  const menuButtonRef = useRef(null);
  const shopItemRef = useRef(null);
  const compactRef = useRef(false);
  const frameRef = useRef(null);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const closeAllNavigation = useCallback(() => {
    setIsMegaOpen(false);
    setIsDrawerOpen(false);
  }, []);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const surface = surfaceRef.current;
    const inner = innerRef.current;
    const brand = brandRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const compact = window.scrollY > 50;
      compactRef.current = compact;
      const tokens = readThemeTokens();

      gsap.set(surface, {
        backgroundColor: compact ? tokens.surface : tokens.surfaceTransparent,
        borderBottomColor: compact ? tokens.borderGold : tokens.borderGoldTransparent,
        boxShadow: compact
          ? `0 12px 38px ${tokens.shadow}`
          : `0 0 0 ${tokens.shadowTransparent}`,
        backdropFilter: compact ? "blur(14px)" : "blur(0px)",
      });
      gsap.set(inner, { height: getNavHeight() });
      gsap.set(brand, { width: getBrandWidth() });
      gsap.set(".luxury-navbar__underline", {
        scaleX: 0,
        scaleY: 0.6,
        transformOrigin: "50% 50%",
      });
      gsap.set('.luxury-navbar__link[aria-current="page"] .luxury-navbar__underline', {
        scaleX: 1,
      });

      gsap.fromTo(
        header,
        { autoAlpha: 0, y: reducedMotion ? 0 : -12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: reducedMotion ? 0 : 0.7,
          ease: "power2.out",
          clearProps: "transform",
        }
      );
    }, header);

    // Only the translucent surface (background, blur, shadow, border) ever
    // animates on scroll. The navbar's height and logo are set once per
    // breakpoint and never move, so the header stays perfectly still.
    const setCompactState = (compact) => {
      if (compact === compactRef.current) return;
      compactRef.current = compact;
      const tokens = readThemeTokens();

      gsap.killTweensOf(surface);
      gsap.to(surface, {
        backgroundColor: compact ? tokens.surface : tokens.surfaceTransparent,
        borderBottomColor: compact ? tokens.borderGold : tokens.borderGoldTransparent,
        boxShadow: compact
          ? `0 12px 38px ${tokens.shadow}`
          : `0 0 0 ${tokens.shadowTransparent}`,
        backdropFilter: compact ? "blur(14px)" : "blur(0px)",
        duration: reducedMotion ? 0 : 0.7,
        ease: "power2.inOut",
      });
    };

    // A single 50px trigger line would flip back and forth (and re-fire the
    // tween) whenever the scroll position hovers near it. A small hysteresis
    // band keeps the compact state — and therefore the transition — stable.
    const handleScroll = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const next = compactRef.current ? y > 32 : y > 50;
        setCompactState(next);
        frameRef.current = null;
      });
    };

    const handleResize = () => {
      gsap.set(inner, { height: getNavHeight() });
      gsap.set(brand, { width: getBrandWidth() });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      gsap.killTweensOf(surface);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleDesktopChange = (event) => {
      if (event.matches) setIsDrawerOpen(false);
    };

    media.addEventListener("change", handleDesktopChange);
    return () => media.removeEventListener("change", handleDesktopChange);
  }, []);

  // Close the Shop mega menu when the user clicks anywhere outside the
  // trigger <li> — hover is covered by onMouseLeave, but a click elsewhere
  // (e.g. tapping the page while the pointer never leaves) would otherwise
  // leave the panel lingering on top of the content.
  useEffect(() => {
    if (!isMegaOpen) return undefined;
    const handlePointerDown = (event) => {
      if (shopItemRef.current && !shopItemRef.current.contains(event.target)) {
        setIsMegaOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMegaOpen]);

  // GSAP writes the glass surface + hovered-label colors as inline styles,
  // which — unlike plain CSS — never re-evaluate var(--...) on their own.
  // Whenever the theme flips, re-read the live tokens and re-apply them so
  // the navbar actually repaints instead of staying pinned to whichever
  // theme was active when a color was last animated.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const tokens = readThemeTokens();
    const compact = compactRef.current;

    gsap.set(surface, {
      backgroundColor: compact ? tokens.surface : tokens.surfaceTransparent,
      borderBottomColor: compact ? tokens.borderGold : tokens.borderGoldTransparent,
      boxShadow: compact
        ? `0 12px 38px ${tokens.shadow}`
        : `0 0 0 ${tokens.shadowTransparent}`,
    });
    gsap.set(".luxury-navbar__label", { clearProps: "color" });
  }, [theme]);

  const animateLink = (target, entering) => {
    const underline = target.querySelector(".luxury-navbar__underline");
    const label = target.querySelector(".luxury-navbar__label");
    const isCurrent = target.getAttribute("aria-current") === "page";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tokens = readThemeTokens();

    gsap.killTweensOf([underline, label]);
    gsap.to(underline, {
      scaleX: entering || isCurrent ? 1 : 0,
      opacity: entering || isCurrent ? 1 : 0.65,
      duration: reducedMotion ? 0 : entering ? 0.42 : 0.36,
      ease: "power3.out",
    });
    gsap.to(label, {
      color: entering ? tokens.goldLight : tokens.offWhite,
      opacity: entering ? 1 : 0.84,
      duration: reducedMotion ? 0 : 0.34,
      ease: "power3.out",
    });
  };

  const animateAction = (target, entering) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf(target);
    gsap.to(target, {
      opacity: entering ? 1 : 0.86,
      y: entering ? -2 : 0,
      duration: reducedMotion ? 0 : 0.28,
      ease: "power2.out",
    });
  };

  const handleShopBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsMegaOpen(false);
    }
  };

  return (
    <header ref={headerRef} className="luxury-navbar">
      <div ref={surfaceRef} className="luxury-navbar__surface">
        <div ref={innerRef} className="luxury-navbar__inner">
          <Link
            ref={brandRef}
            className="luxury-navbar__brand"
            href="/"
            aria-label="Beyond Buttons home"
          >
            <span className="luxury-navbar__brand-frame" aria-hidden="true" />
            <Image
              src="/images/logo.png"
              alt="Beyond Buttons"
              width={577}
              height={433}
              sizes="(min-width: 1024px) 94px, 84px"
              priority
            />
          </Link>

          <nav className="luxury-navbar__desktop-nav" aria-label="Primary">
            <ul>
              {NAV_LINKS.map((link) => {
                if (link.label === "Shop") {
                  return (
                    <li
                      key={link.label}
                      ref={shopItemRef}
                      className="luxury-navbar__shop-item"
                      onMouseEnter={() => setIsMegaOpen(true)}
                      onMouseLeave={() => setIsMegaOpen(false)}
                      onFocus={() => setIsMegaOpen(true)}
                      onBlur={handleShopBlur}
                    >
                      <div className="luxury-navbar__shop-trigger">
                        <button
                          className="luxury-navbar__link"
                          type="button"
                          aria-expanded={isMegaOpen}
                          aria-haspopup="true"
                          onMouseEnter={(event) => animateLink(event.currentTarget, true)}
                          onMouseLeave={(event) => animateLink(event.currentTarget, false)}
                          onFocus={(event) => animateLink(event.currentTarget, true)}
                        >
                          <span className="luxury-navbar__label">Shop</span>
                          <span className="luxury-navbar__underline" aria-hidden="true" />
                        </button>
                      </div>
                      <MegaMenu
                        isOpen={isMegaOpen}
                        onNavigate={() => setIsMegaOpen(false)}
                      />
                    </li>
                  );
                }

                return (
                  <li key={link.label}>
                    <Link
                      className="luxury-navbar__link"
                      href={link.href}
                      aria-current={link.current ? "page" : undefined}
                      onMouseEnter={(event) => animateLink(event.currentTarget, true)}
                      onMouseLeave={(event) => animateLink(event.currentTarget, false)}
                      onFocus={(event) => animateLink(event.currentTarget, true)}
                      onBlur={(event) => animateLink(event.currentTarget, false)}
                    >
                      <span className="luxury-navbar__label">{link.label}</span>
                      <span className="luxury-navbar__underline" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="luxury-navbar__actions" aria-label="Customer tools">
            {NAV_ACTIONS.map(({ label, href, Icon }) => {
              const count = label === "Cart" ? itemCount : label === "Wishlist" ? wishlistCount : 0;
              
              return (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="luxury-navbar__action"
                  onMouseEnter={(event) => animateAction(event.currentTarget, true)}
                  onMouseLeave={(event) => animateAction(event.currentTarget, false)}
                  onFocus={(event) => animateAction(event.currentTarget, true)}
                  onBlur={(event) => animateAction(event.currentTarget, false)}
                >
                  <Icon aria-hidden="true" size={19} strokeWidth={1.35} />
                  {count > 0 && (
                    <span className="luxury-navbar__badge">{count}</span>
                  )}
                </Link>
              );
            })}
            <ThemeToggle />
          </div>

          <div className="luxury-navbar__mobile-controls">
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              className="luxury-navbar__menu-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu aria-hidden="true" size={25} strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </div>

      <MobileDrawer
        isOpen={isDrawerOpen}
        links={NAV_LINKS}
        onClose={closeDrawer}
        onNavigate={closeAllNavigation}
        triggerRef={menuButtonRef}
      />
    </header>
  );
}
