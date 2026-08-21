"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import {
  Heart,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { getProducts } from "@/lib/data";
import { getShopMenuItems } from "./MegaMenu";

const MOBILE_ACTIONS = [
  { label: "Cart", href: "/cart", Icon: ShoppingBag },
  { label: "Wishlist", href: "/wishlist", Icon: Heart },
  { label: "Account", href: "/account", Icon: UserRound },
];

export default function MobileDrawer({
  isOpen,
  links,
  onClose,
  onNavigate,
  triggerRef,
}) {
  const drawerRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const linksRef = useRef(null);
  const actionsRef = useRef(null);
  const hasOpenedRef = useRef(false);

  const shopItems = useMemo(
    () => getShopMenuItems().filter((item) => item.kind === "category"),
    []
  );
  const feature = useMemo(() => getProducts()[0] || null, []);

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    const panel = panelRef.current;
    const navItems = linksRef.current?.children;
    const actionItems = actionsRef.current?.children;

    gsap.set(drawer, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set(panel, { xPercent: 100 });
    gsap.set([navItems, actionItems], {
      autoAlpha: 0,
      x: 20,
    });

    return () => {
      gsap.killTweensOf([drawer, panel, navItems, actionItems]);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const drawer = drawerRef.current;
    const panel = panelRef.current;
    const navItems = linksRef.current?.children;
    const actionItems = actionsRef.current?.children;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf([drawer, panel, navItems, actionItems]);

    if (isOpen) {
      hasOpenedRef.current = true;
      document.body.style.overflow = "hidden";
      gsap.set(drawer, {
        visibility: "visible",
        pointerEvents: "auto",
      });

      gsap
        .timeline({
          onComplete: () => closeRef.current?.focus(),
        })
        .to(drawer, {
          autoAlpha: 1,
          duration: reducedMotion ? 0 : 0.25,
          ease: "power2.out",
        })
        .to(
          panel,
          {
            xPercent: 0,
            duration: reducedMotion ? 0 : 0.55,
            ease: "power3.out",
          },
          0
        )
        .to(
          navItems,
          {
            autoAlpha: 1,
            x: 0,
            duration: reducedMotion ? 0 : 0.32,
            stagger: reducedMotion ? 0 : 0.045,
            ease: "power2.out",
          },
          reducedMotion ? 0 : 0.2
        )
        .to(
          actionItems,
          {
            autoAlpha: 1,
            x: 0,
            duration: reducedMotion ? 0 : 0.26,
            stagger: reducedMotion ? 0 : 0.035,
            ease: "power2.out",
          },
          reducedMotion ? 0 : 0.32
        );
      return;
    }

    document.body.style.overflow = "";

    if (!hasOpenedRef.current) return;

    gsap
      .timeline({
        onComplete: () => {
          gsap.set(drawer, { visibility: "hidden" });
          triggerRef.current?.focus();
        },
      })
      .to([navItems, actionItems], {
        autoAlpha: 0,
        x: 14,
        duration: reducedMotion ? 0 : 0.16,
        ease: "power1.in",
      })
      .to(
        panel,
        {
          xPercent: 100,
          duration: reducedMotion ? 0 : 0.38,
          ease: "power3.inOut",
        },
        reducedMotion ? 0 : "-=0.08"
      )
      .to(
        drawer,
        {
          autoAlpha: 0,
          pointerEvents: "none",
          duration: reducedMotion ? 0 : 0.2,
          ease: "power1.in",
        },
        reducedMotion ? 0 : "-=0.15"
      );
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      ref={drawerRef}
      className="luxury-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        className="luxury-drawer__backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <div ref={panelRef} className="luxury-drawer__panel">
        <div className="luxury-drawer__top">
          <Link className="luxury-drawer__brand" href="/" onClick={onNavigate}>
            <Image
              src="/images/logo.png"
              alt="Beyond Buttons"
              width={577}
              height={433}
              sizes="84px"
              priority
            />
          </Link>
          <button
            ref={closeRef}
            className="luxury-drawer__close"
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X aria-hidden="true" size={24} strokeWidth={1.25} />
          </button>
        </div>

        <nav aria-label="Mobile">
          <ul ref={linksRef} className="luxury-drawer__links">
            {links.map((link, index) => (
              <li key={link.label}>
                <Link href={link.href} onClick={onNavigate}>
                  <span className="luxury-drawer__link-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="luxury-drawer__link-label">{link.label}</span>
                  <span className="luxury-drawer__link-arrow" aria-hidden="true">↗</span>
                </Link>
                {link.label === "Shop" && shopItems.length > 0 && (
                  <div className="luxury-drawer__shop-block">
                    <p className="luxury-drawer__shop-title">Collections</p>
                    <ul className="luxury-drawer__shop" aria-label="Shop">
                      {shopItems.map((item) => (
                        <li key={item.id || item.label}>
                          <Link href={item.href} onClick={onNavigate}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      className="luxury-drawer__shop-all"
                      href="/shop"
                      onClick={onNavigate}
                    >
                      View all products <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {feature ? (
          <Link
            className="luxury-drawer__feature"
            href={`/product/${feature.slug}`}
            onClick={onNavigate}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={feature.gallery?.[0]?.src || feature.gallery?.[0] || "/images/logo.png"}
              alt=""
            />
            <span className="luxury-drawer__feature-overlay">
              <span className="luxury-drawer__feature-eyebrow">New Arrivals</span>
              <strong>{feature.name}</strong>
              <span className="luxury-drawer__feature-cta">
                Shop now <span aria-hidden="true">→</span>
              </span>
            </span>
          </Link>
        ) : null}

        <div ref={actionsRef} className="luxury-drawer__actions">
          {MOBILE_ACTIONS.map(({ label, href, Icon }) => (
            <Link key={label} href={href} onClick={onNavigate}>
              <Icon aria-hidden="true" size={20} strokeWidth={1.35} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <p className="luxury-drawer__footer">
          Beyond the ordinary · Crafted in solids
        </p>
      </div>
    </div>
  );
}
