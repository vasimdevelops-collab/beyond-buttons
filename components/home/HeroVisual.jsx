"use client";

import { useEffect, useRef } from "react";

/**
 * Right-column Hero media slot.
 *
 * No campaign photography/video exists in the project yet, so this renders a
 * deliberate, art-directed placeholder frame instead of a real asset. Once a
 * final asset is supplied, pass it in as `media` and it renders in its place
 * — no structural changes needed elsewhere:
 *
 *   <HeroVisual media={{ type: "image", src: "/images/hero-campaign.jpg", alt: "..." }} />
 *   <HeroVisual media={{ type: "video", src: "/videos/hero-campaign.mp4", poster: "..." }} />
 *
 * For future 3D content, swap the placeholder branch below for a canvas/WebGL
 * mount — the surrounding frame, glow and parallax wiring stay identical.
 */
export default function HeroVisual({ media }) {
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const frame = frameRef.current;
    const root = rootRef.current;
    if (!frame || !root || reducedMotion) return undefined;

    let time = 0;

    const handlePointerMove = (event) => {
      const rect = root.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRef.current = { x: nx, y: ny };
    };

    const tick = () => {
      time += 1;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.05;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.05;

      const drift = Math.sin(time * 0.01) * 6;
      const { x, y } = currentRef.current;
      const parallaxX = canHover ? x * -10 : 0;
      const parallaxY = canHover ? y * -8 : 0;

      frame.style.transform = `translate3d(${parallaxX}px, ${parallaxY + drift * 0.5}px, 0)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    if (canHover) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="hero-visual" ref={rootRef} aria-hidden={!media}>
      <div className="hero-visual__frame" ref={frameRef}>
        {media?.type === "video" ? (
          <video
            className="hero-visual__media"
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : media?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-visual__media" src={media.src} alt={media.alt || ""} />
        ) : (
          <div className="hero-visual__placeholder">
            <span className="hero-visual__corner hero-visual__corner--tl" />
            <span className="hero-visual__corner hero-visual__corner--tr" />
            <span className="hero-visual__corner hero-visual__corner--bl" />
            <span className="hero-visual__corner hero-visual__corner--br" />
            <span className="hero-visual__placeholder-label">Campaign Visual</span>
          </div>
        )}
        <div className="hero-visual__sheen" />
      </div>
      <div className="hero-visual__glow" />
    </div>
  );
}
