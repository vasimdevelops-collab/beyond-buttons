"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import gsap from "gsap";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Luxury product gallery — Phase A
 * Vertical thumbs · fullscreen · mouse reflection · cursor glow · depth · shadow
 * Magnifier / 360 viewer wire in later phases on the same stage.
 */
export default function ProductGallery({ product, images = [] }) {
  const views =
    images.length > 0
      ? images
      : [
          { id: "front", label: "Front", src: null, kind: "still" },
          { id: "detail", label: "Detail", src: null, kind: "still" },
          { id: "fabric", label: "Fabric", src: null, kind: "still" },
          { id: "spin", label: "360°", src: null, kind: "spin" },
        ];

  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const reflectionRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const ambientGlowRef = useRef(null);
  const fsRef = useRef(null);

  const current = views[active] ?? views[0];

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  useEffect(() => {
    const fs = fsRef.current;
    if (!fs) return;
    gsap.to(fs, {
      autoAlpha: fullscreen ? 1 : 0,
      duration: prefersReducedMotion() ? 0 : 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [fullscreen]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const reflection = reflectionRef.current;
    const cursorGlow = cursorGlowRef.current;
    const ambient = ambientGlowRef.current;
    if (!stage || !frame) return undefined;

    if (prefersReducedMotion()) return undefined;

    const qx = gsap.quickTo(frame, "rotateY", { duration: 0.55, ease: "power3.out" });
    const qy = gsap.quickTo(frame, "rotateX", { duration: 0.55, ease: "power3.out" });
    const qz = gsap.quickTo(frame, "z", { duration: 0.55, ease: "power3.out" });

    const mediaX = media
      ? gsap.quickTo(media, "xPercent", { duration: 0.7, ease: "power3.out" })
      : null;
    const mediaY = media
      ? gsap.quickTo(media, "yPercent", { duration: 0.7, ease: "power3.out" })
      : null;

    const reflX = reflection
      ? gsap.quickTo(reflection, "xPercent", { duration: 0.65, ease: "power3.out" })
      : null;
    const reflY = reflection
      ? gsap.quickTo(reflection, "yPercent", { duration: 0.65, ease: "power3.out" })
      : null;

    const glowX = cursorGlow
      ? gsap.quickTo(cursorGlow, "x", { duration: 0.4, ease: "power3.out" })
      : null;
    const glowY = cursorGlow
      ? gsap.quickTo(cursorGlow, "y", { duration: 0.4, ease: "power3.out" })
      : null;

    const onMove = (e) => {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const nx = (px - 0.5) * 2;
      const ny = (py - 0.5) * 2;

      qx(nx * 5.5);
      qy(ny * -4.5);
      qz(18);

      mediaX?.(nx * -2.2);
      mediaY?.(ny * -1.8);
      reflX?.(nx * 8);
      reflY?.(ny * 6);

      if (cursorGlow && glowX && glowY) {
        glowX(e.clientX - rect.left - 110);
        glowY(e.clientY - rect.top - 110);
        gsap.to(cursorGlow, { opacity: 0.55, duration: 0.25, overwrite: "auto" });
      }

      if (ambient) {
        gsap.to(ambient, {
          xPercent: nx * 6,
          yPercent: ny * 4,
          opacity: 0.55,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      gsap.to(frame, {
        boxShadow: `
          ${nx * -14}px ${18 + ny * 10}px 48px rgba(0, 0, 0, 0.22),
          ${nx * -4}px ${8 + ny * 4}px 20px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(176, 141, 87, 0.12)
        `,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      qx(0);
      qy(0);
      qz(0);
      mediaX?.(0);
      mediaY?.(0);
      reflX?.(0);
      reflY?.(0);
      if (cursorGlow) {
        gsap.to(cursorGlow, { opacity: 0, duration: 0.35, overwrite: "auto" });
      }
      if (ambient) {
        gsap.to(ambient, {
          xPercent: 0,
          yPercent: 0,
          opacity: 0.4,
          duration: 0.55,
          overwrite: "auto",
        });
      }
      gsap.to(frame, {
        boxShadow: `
          0 4px 12px rgba(0, 0, 0, 0.04),
          0 18px 48px rgba(0, 0, 0, 0.12),
          0 0 0 1px rgba(176, 141, 87, 0.08)
        `,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [active]);

  return (
    <>
      <div
        className="pdp-gallery"
        data-gallery
        data-spin-ready={current?.kind === "spin" ? "true" : "false"}
      >
        <ul className="pdp-gallery__thumbs" role="list" aria-label="Product views">
          {views.map((view, index) => (
            <li key={view.id}>
              <button
                type="button"
                className="pdp-gallery__thumb"
                aria-pressed={index === active}
                aria-label={`View ${view.label}`}
                onClick={() => setActive(index)}
              >
                {view.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={view.src}
                    alt=""
                    className="pdp-gallery__thumb-media"
                  />
                ) : (
                  <span className="pdp-gallery__thumb-frame" aria-hidden="true">
                    <span className="pdp-gallery__thumb-label">{view.label}</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="pdp-gallery__stage" ref={stageRef}>
          <div className="pdp-gallery__glow" ref={ambientGlowRef} aria-hidden="true" />

          <div
            className="pdp-gallery__frame"
            ref={frameRef}
            data-depth-stage
          >
            <div className="pdp-gallery__border" aria-hidden="true" />
            <div
              className="pdp-gallery__reflection"
              ref={reflectionRef}
              aria-hidden="true"
            />
            <div
              className="pdp-gallery__cursor-glow"
              ref={cursorGlowRef}
              aria-hidden="true"
            />

            {current?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={mediaRef}
                src={current.src}
                alt={`${product.name} — ${current.label}`}
                className="pdp-gallery__media"
              />
            ) : (
              <div className="pdp-gallery__empty" ref={mediaRef} aria-hidden="true">
                <span className="pdp-gallery__corner pdp-gallery__corner--tl" />
                <span className="pdp-gallery__corner pdp-gallery__corner--tr" />
                <span className="pdp-gallery__corner pdp-gallery__corner--bl" />
                <span className="pdp-gallery__corner pdp-gallery__corner--br" />
                <span className="pdp-gallery__mark">BB</span>
                <span className="pdp-gallery__caption">{current?.label ?? "Studio"}</span>
              </div>
            )}

            <button
              type="button"
              className="pdp-gallery__expand"
              aria-label="Open fullscreen viewer"
              onClick={() => setFullscreen(true)}
            >
              <Expand size={14} strokeWidth={1.6} aria-hidden="true" />
              View
            </button>
          </div>
        </div>
      </div>

      <div
        ref={fsRef}
        className={`pdp-gallery__fs${fullscreen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen product viewer"
        aria-hidden={!fullscreen}
      >
        <div className="pdp-gallery__fs-stage">
          <button
            type="button"
            className="pdp-gallery__fs-close"
            aria-label="Close fullscreen"
            onClick={() => setFullscreen(false)}
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
          {current?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.src}
              alt={`${product.name} — ${current.label}`}
              className="pdp-gallery__media"
            />
          ) : (
            <div className="pdp-gallery__empty" aria-hidden="true">
              <span className="pdp-gallery__corner pdp-gallery__corner--tl" />
              <span className="pdp-gallery__corner pdp-gallery__corner--tr" />
              <span className="pdp-gallery__corner pdp-gallery__corner--bl" />
              <span className="pdp-gallery__corner pdp-gallery__corner--br" />
              <span className="pdp-gallery__mark">BB</span>
              <span className="pdp-gallery__caption">{current?.label ?? "Studio"}</span>
            </div>
          )}
        </div>
        <ul className="pdp-gallery__fs-film" role="list">
          {views.map((view, index) => (
            <li key={`fs-${view.id}`}>
              <button
                type="button"
                className="pdp-gallery__thumb"
                aria-pressed={index === active}
                aria-label={`View ${view.label}`}
                onClick={() => setActive(index)}
              >
                <span className="pdp-gallery__thumb-frame" aria-hidden="true">
                  <span className="pdp-gallery__thumb-label">{view.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
