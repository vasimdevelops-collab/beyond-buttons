"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Leaf, Minimize2, Ruler, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./why.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FEATURES = [
  {
    id: "fabric",
    title: "Premium Fabric",
    copy: "Made using premium cotton for all-day comfort.",
    Icon: Leaf,
  },
  {
    id: "design",
    title: "Minimal Design",
    copy: "Timeless silhouettes that never go out of style.",
    Icon: Minimize2,
  },
  {
    id: "fit",
    title: "Perfect Fit",
    copy: "Balanced proportions for every body.",
    Icon: Ruler,
  },
  {
    id: "lasting",
    title: "Made To Last",
    copy: "Designed for years, not seasons.",
    Icon: ShieldCheck,
  },
];

const DUST_COLORS = ["#D4AF37", "#F1D37B", "#C9A227", "#B08D57"];

function createMote(width, height, seedTop = false) {
  return {
    x: Math.random() * width,
    y: seedTop ? Math.random() * height : height + Math.random() * 40,
    size: 0.5 + Math.random() * 1.4,
    speed: 0.035 + Math.random() * 0.08,
    drift: Math.random() * Math.PI * 2,
    driftSpeed: 0.0015 + Math.random() * 0.003,
    opacity: 0.08 + Math.random() * 0.18,
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
  };
}

function useAmbientDust(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = canvas.getContext("2d");
    let motes = [];
    let rafId = null;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 640 ? 14 : width < 1200 ? 24 : 34;
      motes = Array.from({ length: count }, () => createMote(width, height, true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const mote of motes) {
        mote.y -= mote.speed;
        mote.drift += mote.driftSpeed;
        mote.x += Math.sin(mote.drift) * 0.1;
        if (mote.y < -10) {
          Object.assign(mote, createMote(width, height, false));
          mote.y = height + 10;
        }
        ctx.globalAlpha = mote.opacity;
        ctx.fillStyle = mote.color;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef]);
}

function readToken(name, fallback) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Premium editorial media frame.
 * Pass `media` when the final asset is ready — layout never changes:
 *   media={{ type: "image", src: "/images/why-editorial.jpg", alt: "..." }}
 *   media={{ type: "video", src: "/videos/why-editorial.mp4", poster: "..." }}
 */
function EditorialMedia({ media, mediaRef, frameRef }) {
  const dustRef = useRef(null);
  useAmbientDust(dustRef);

  return (
    <div className="why__media" ref={mediaRef}>
      <div className="why__media-glow" aria-hidden="true" />
      <div className="why__media-frame" ref={frameRef}>
        <span className="why__media-glass" aria-hidden="true" />
        <span className="why__media-border" aria-hidden="true" />
        <span className="why__media-shimmer" aria-hidden="true" />
        <canvas className="why__media-dust" ref={dustRef} aria-hidden="true" />

        {media?.type === "video" ? (
          <video
            className="why__media-asset"
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : media?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="why__media-asset" src={media.src} alt={media.alt || ""} />
        ) : (
          <div className="why__media-stage" aria-hidden="true">
            <span className="why__media-corner why__media-corner--tl" />
            <span className="why__media-corner why__media-corner--tr" />
            <span className="why__media-corner why__media-corner--bl" />
            <span className="why__media-corner why__media-corner--br" />
            <span className="why__media-mark">BB</span>
            <span className="why__media-caption">Editorial Frame</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const accentRef = useRef(null);
  const iconRef = useRef(null);
  const { Icon } = feature;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleEnter = () => {
      gsap.to(card, {
        y: -6,
        boxShadow: `0 18px 40px ${readToken("--shadow-soft", "rgba(0,0,0,0.12)")}, 0 8px 24px ${readToken("--wash-gold-soft", "rgba(176,141,87,0.1)")}`,
        duration: reducedMotion ? 0 : 0.45,
        ease: "power3.out",
      });
      gsap.to(glowRef.current, { opacity: 1, duration: reducedMotion ? 0 : 0.45, ease: "power2.out" });
      gsap.to(accentRef.current, { scaleX: 1, duration: reducedMotion ? 0 : 0.5, ease: "power3.out" });
      gsap.to(iconRef.current, {
        y: -3,
        color: readToken("--goldLight", "#c9a46a"),
        duration: reducedMotion ? 0 : 0.35,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: `0 8px 24px ${readToken("--shadow-soft", "rgba(0,0,0,0.08)")}`,
        duration: reducedMotion ? 0 : 0.45,
        ease: "power3.out",
        onComplete() {
          gsap.set(card, { clearProps: "boxShadow" });
        },
      });
      gsap.to(glowRef.current, { opacity: 0, duration: reducedMotion ? 0 : 0.4, ease: "power2.out" });
      gsap.to(accentRef.current, { scaleX: 0, duration: reducedMotion ? 0 : 0.4, ease: "power3.inOut" });
      gsap.to(iconRef.current, {
        y: 0,
        color: readToken("--gold", "#b08d57"),
        duration: reducedMotion ? 0 : 0.35,
        ease: "power2.out",
        onComplete() {
          gsap.set(iconRef.current, { clearProps: "color" });
        },
      });
    };

    card.addEventListener("pointerenter", handleEnter);
    card.addEventListener("pointerleave", handleLeave);
    card.addEventListener("focus", handleEnter);
    card.addEventListener("blur", handleLeave);

    return () => {
      card.removeEventListener("pointerenter", handleEnter);
      card.removeEventListener("pointerleave", handleLeave);
      card.removeEventListener("focus", handleEnter);
      card.removeEventListener("blur", handleLeave);
    };
  }, []);

  return (
    <article className="why__card" ref={cardRef} tabIndex={0}>
      <span className="why__card-glow" ref={glowRef} aria-hidden="true" />
      <span className="why__card-accent" ref={accentRef} aria-hidden="true" />
      <span className="why__card-icon" ref={iconRef}>
        <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
      </span>
      <h3 className="why__card-title">{feature.title}</h3>
      <p className="why__card-copy">{feature.copy}</p>
    </article>
  );
}

export default function WhyBeyond({ media }) {
  const sectionRef = useRef(null);
  const dustRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const mediaWrapRef = useRef(null);
  const frameRef = useRef(null);
  const cardsWrapRef = useRef(null);

  useAmbientDust(dustRef);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = Array.from(section.querySelectorAll(".why__card"));

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(
          [eyebrowRef.current, titleRef.current, subtitleRef.current, mediaWrapRef.current, ...cards],
          { autoAlpha: 1, y: 0, scale: 1 }
        );
        return;
      }

      gsap.set([eyebrowRef.current, titleRef.current, subtitleRef.current], {
        autoAlpha: 0,
        y: 24,
      });
      gsap.set(mediaWrapRef.current, { autoAlpha: 0, y: 40 });
      gsap.set(cards, { autoAlpha: 0, y: 36 });

      const headerTl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: section, start: "top 78%" },
      });

      headerTl
        .to(eyebrowRef.current, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
        .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.65 }, 0.08)
        .to(subtitleRef.current, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.22)
        .to(mediaWrapRef.current, { autoAlpha: 1, y: 0, duration: 0.85 }, 0.18);

      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsWrapRef.current,
          start: "top 82%",
        },
      });

      if (frameRef.current) {
        gsap.to(frameRef.current, {
          yPercent: 8,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: mediaWrapRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      const glow = section.querySelector(".why__media-glow");
      if (glow) {
        gsap.to(glow, {
          opacity: 0.75,
          scale: 1.06,
          duration: 5.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="why" ref={sectionRef} id="about" aria-label="Why Beyond Buttons">
      <div className="why__backdrop" aria-hidden="true" />
      <canvas className="why__dust" ref={dustRef} aria-hidden="true" />

      <div className="why__container">
        <header className="why__header">
          <p className="why__eyebrow" ref={eyebrowRef}>
            The Difference
          </p>
          <h2 className="why__title" ref={titleRef}>
            Why Beyond Buttons
          </h2>
          <p className="why__subtitle" ref={subtitleRef}>
            Crafted for people who believe
            <br />
            quality is remembered long after
            <br />
            price is forgotten.
          </p>
        </header>

        <div className="why__layout">
          <EditorialMedia media={media} mediaRef={mediaWrapRef} frameRef={frameRef} />

          <div className="why__cards" ref={cardsWrapRef}>
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
