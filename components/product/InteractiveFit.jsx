"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./product-phase-c.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function hasValue(value) {
  return value != null && String(value).trim() !== "";
}

function normalizePoints(fit) {
  if (!fit) return [];
  const source = Array.isArray(fit) ? fit : fit.points || fit.hotspots || [];
  return source
    .map((point, index) => {
      if (!point || typeof point !== "object") return null;
      const label = point.label || point.title || point.name;
      const description = point.description || point.detail || point.copy || "";
      if (!hasValue(label) || !hasValue(description)) return null;
      return {
        id: point.id || `fit-${index}`,
        label: String(label).trim(),
        description: String(description).trim(),
        x: Number(point.x ?? point.left ?? 50),
        y: Number(point.y ?? point.top ?? 50),
      };
    })
    .filter(Boolean);
}

export default function InteractiveFit({ fit = null, productName = "" }) {
  const rootRef = useRef(null);
  const points = useMemo(() => normalizePoints(fit), [fit]);
  const [activeId, setActiveId] = useState("");
  const [hoveredId, setHoveredId] = useState("");

  const active = points.find((point) => point.id === activeId) || points[0] || null;

  const illustration =
    (fit && !Array.isArray(fit) && (fit.svg || fit.illustration || fit.media)) || null;
  const illustrationSrc =
    typeof illustration === "string" ? illustration : illustration?.src || "";
  const illustrationAlt =
    (typeof illustration === "object" && illustration?.alt) ||
    `${productName || "Product"} fit`;
  const summary =
    (!Array.isArray(fit) && (fit?.summary || fit?.lead || fit?.type)) || "";

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !points.length) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const ctx = gsap.context(() => {
      const reveal = root.querySelectorAll("[data-fit-reveal]");
      gsap.set(reveal, { y: 24, opacity: 0, force3D: true });
      gsap.to(reveal, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.07,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          once: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [points.length]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const markers = root.querySelectorAll("[data-fit-marker]");
    markers.forEach((marker) => {
      const active = marker.getAttribute("data-active") === "true";
      const hovered = marker.getAttribute("data-hovered") === "true";
      gsap.to(marker, {
        scale: active || hovered ? 1.12 : 1,
        opacity: active || hovered ? 1 : 0.82,
        duration: 0.28,
        ease: "power2.out",
        force3D: true,
        overwrite: "auto",
      });
    });
  }, [activeId, hoveredId, points.length]);

  if (!points.length || !active) return null;

  return (
    <section
      ref={rootRef}
      className="phase-c phase-c--fit"
      aria-labelledby="interactive-fit-title"
    >
      <header className="phase-c__header" data-fit-reveal>
        <span className="phase-c__eyebrow">Fit</span>
        <h2 id="interactive-fit-title">Interactive Fit</h2>
        {hasValue(summary) ? (
          <p className="phase-c__support">{String(summary).trim()}</p>
        ) : (
          <p className="phase-c__support">
            Explore the cut through quiet markers — hover or select each point.
          </p>
        )}
      </header>

      <div className="fit-desktop" data-fit-reveal>
        <div className="fit-stage">
          <div className="fit-stage__frame">
            {illustrationSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={illustrationSrc} alt={illustrationAlt} className="fit-stage__media" />
            ) : (
              <div className="fit-stage__placeholder" aria-hidden="true">
                <span className="fit-stage__placeholder-mark" />
                <span className="fit-stage__placeholder-label">Fit silhouette</span>
              </div>
            )}

            {points.map((point) => {
              const isActive = point.id === active.id;
              const isHovered = point.id === hoveredId;
              return (
                <button
                  key={point.id}
                  type="button"
                  className="fit-marker"
                  data-fit-marker
                  data-active={isActive ? "true" : "false"}
                  data-hovered={isHovered ? "true" : "false"}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  aria-pressed={isActive}
                  aria-label={point.label}
                  onMouseEnter={() => setHoveredId(point.id)}
                  onMouseLeave={() => setHoveredId("")}
                  onFocus={() => setHoveredId(point.id)}
                  onBlur={() => setHoveredId("")}
                  onClick={() => setActiveId(point.id)}
                >
                  <span className="fit-marker__dot" />
                  <span className="fit-marker__ring" />
                  {(isActive || isHovered) && (
                    <span className="fit-marker__tip">{point.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="fit-panel" aria-live="polite">
          <span className="fit-panel__index">
            {String(points.findIndex((point) => point.id === active.id) + 1).padStart(2, "0")}
          </span>
          <h3 className="fit-panel__title">{active.label}</h3>
          <p className="fit-panel__copy">{active.description}</p>
        </aside>
      </div>

      <div className="fit-mobile" data-fit-reveal>
        <div className="fit-stage fit-stage--mobile">
          <div className="fit-stage__frame">
            {illustrationSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={illustrationSrc} alt={illustrationAlt} className="fit-stage__media" />
            ) : (
              <div className="fit-stage__placeholder" aria-hidden="true">
                <span className="fit-stage__placeholder-mark" />
                <span className="fit-stage__placeholder-label">Fit silhouette</span>
              </div>
            )}
          </div>
        </div>

        <div className="fit-accordion" role="list">
          {points.map((point, index) => {
            const open = point.id === active.id;
            return (
              <div
                className="fit-accordion__item"
                role="listitem"
                key={point.id}
                data-open={open ? "true" : "false"}
              >
                <button
                  type="button"
                  className="fit-accordion__trigger"
                  aria-expanded={open}
                  onClick={() => setActiveId(point.id)}
                >
                  <span className="fit-accordion__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="fit-accordion__label">{point.label}</span>
                </button>
                {open ? <p>{point.description}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
