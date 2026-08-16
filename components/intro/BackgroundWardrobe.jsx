"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "@studio-freight/lenis";

export default function BackgroundWardrobe() {
  const rootRef = useRef(null);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: false,
      smoothTouch: false,
      lerp: 0.08,
    });

    const root = rootRef.current;
    if (!root) return undefined;

    const photo = root.querySelector(".wardrobe-photo__img");

    const onPointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRef.current = { x: nx, y: ny };
    };

    const tick = (time) => {
      lenis.raf(time);

      parallaxRef.current.x += (targetRef.current.x - parallaxRef.current.x) * 0.04;
      parallaxRef.current.y += (targetRef.current.y - parallaxRef.current.y) * 0.04;

      const { x, y } = parallaxRef.current;
      const drift = Math.sin(time * 0.00015) * 4;

      if (photo) {
        photo.style.transform = `translate3d(${x * -12 + drift * 0.4}px, ${y * -7}px, 0) scale(1.1)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="intro-wardrobe" ref={rootRef} aria-hidden="true">
      <div className="wardrobe-photo">
        <Image
          src="/images/homeback.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          className="wardrobe-photo__img"
        />
      </div>

      <div className="wardrobe-overlay" />
    </div>
  );
}
