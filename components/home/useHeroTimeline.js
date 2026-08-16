import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canHover() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

// Subtle magnetic pull toward the cursor — mouse-capable devices only, killed
// automatically when the component unmounts via the returned cleanup fn.
function attachMagnetic(el, strength = 0.3) {
  if (!el || !canHover()) return () => {};

  const quickX = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
  const quickY = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

  const handleMove = (event) => {
    const rect = el.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    quickX(relX * strength);
    quickY(relY * strength);
  };
  const handleLeave = () => {
    quickX(0);
    quickY(0);
  };

  el.addEventListener("pointermove", handleMove);
  el.addEventListener("pointerleave", handleLeave);

  return () => {
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerleave", handleLeave);
  };
}

// Soft gold glow + icon nudge for the primary CTA — driven by GSAP rather
// than CSS transitions so it stays consistent with the rest of the timeline.
function attachButtonGlow(el) {
  if (!el) return () => {};
  const glow = el.querySelector(".hero__cta-glow");
  const icon = el.querySelector(".hero__cta-icon");
  const reducedMotion = prefersReducedMotion();

  const handleEnter = () => {
    gsap.to(glow, { opacity: 1, duration: reducedMotion ? 0 : 0.4, ease: "power2.out" });
    gsap.to(icon, {
      x: 4,
      opacity: 1,
      duration: reducedMotion ? 0 : 0.35,
      ease: "power2.out",
    });
  };
  const handleLeave = () => {
    gsap.to(glow, { opacity: 0, duration: reducedMotion ? 0 : 0.45, ease: "power2.out" });
    gsap.to(icon, {
      x: 0,
      opacity: 0.85,
      duration: reducedMotion ? 0 : 0.35,
      ease: "power2.out",
    });
  };

  el.addEventListener("pointerenter", handleEnter);
  el.addEventListener("pointerleave", handleLeave);
  el.addEventListener("focus", handleEnter);
  el.addEventListener("blur", handleLeave);

  return () => {
    el.removeEventListener("pointerenter", handleEnter);
    el.removeEventListener("pointerleave", handleLeave);
    el.removeEventListener("focus", handleEnter);
    el.removeEventListener("blur", handleLeave);
  };
}

// Elegant hover: thin underline draws in + letter-spacing eases open —
// shared by the secondary "OUR STORY" link.
function attachUnderlineHover(el) {
  if (!el) return () => {};
  const underline = el.querySelector(".hero__link-underline");
  const label = el.querySelector(".hero__link-label");
  if (!underline || !label) return () => {};

  const reducedMotion = prefersReducedMotion();

  const handleEnter = () => {
    gsap.to(underline, {
      scaleX: 1,
      duration: reducedMotion ? 0 : 0.45,
      ease: "power3.out",
    });
    gsap.to(label, {
      letterSpacing: reducedMotion ? "0.14em" : "0.18em",
      duration: reducedMotion ? 0 : 0.45,
      ease: "power3.out",
    });
  };
  const handleLeave = () => {
    gsap.to(underline, {
      scaleX: 0,
      duration: reducedMotion ? 0 : 0.4,
      ease: "power3.out",
    });
    gsap.to(label, {
      letterSpacing: "0.14em",
      duration: reducedMotion ? 0 : 0.4,
      ease: "power3.out",
    });
  };

  el.addEventListener("pointerenter", handleEnter);
  el.addEventListener("pointerleave", handleLeave);
  el.addEventListener("focus", handleEnter);
  el.addEventListener("blur", handleLeave);

  return () => {
    el.removeEventListener("pointerenter", handleEnter);
    el.removeEventListener("pointerleave", handleLeave);
    el.removeEventListener("focus", handleEnter);
    el.removeEventListener("blur", handleLeave);
  };
}

export default function useHeroTimeline(root) {
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    if (!root.current) return undefined;

    const reducedMotion = prefersReducedMotion();
    const cleanupFns = [];

    const ctx = gsap.context(() => {
      const backdrop = root.current.querySelector(".hero__backdrop");
      const visual = root.current.querySelector(".hero-visual");
      const content = root.current.querySelector(".hero__content");
      const label = root.current.querySelector(".hero__label");
      const lines = root.current.querySelectorAll(".hero__line");
      const subtitle = root.current.querySelector(".hero__subtitle");
      const primaryBtn = root.current.querySelector(".hero__cta--primary");
      const secondaryBtn = root.current.querySelector(".hero__cta--secondary");
      const scrollCue = root.current.querySelector(".hero__scroll-cue");
      const scrollDot = root.current.querySelector(".hero__scroll-dot");

      gsap.set(root.current, { autoAlpha: 0 });
      gsap.set(visual, { autoAlpha: 0, y: reducedMotion ? 0 : 36 });
      gsap.set(label, { autoAlpha: 0, y: reducedMotion ? 0 : 12 });
      gsap.set(lines, {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 28,
        letterSpacing: reducedMotion ? "normal" : "0.28em",
      });
      gsap.set(subtitle, { autoAlpha: 0, y: reducedMotion ? 0 : 16 });
      gsap.set([primaryBtn, secondaryBtn], { autoAlpha: 0, y: reducedMotion ? 0 : 14 });
      gsap.set(scrollCue, { autoAlpha: 0 });
      gsap.set(primaryBtn?.querySelector(".hero__cta-glow"), { opacity: 0 });
      gsap.set(primaryBtn?.querySelector(".hero__cta-icon"), { opacity: 0.85 });

      if (reducedMotion) {
        gsap.set(
          [root.current, visual, label, lines, subtitle, primaryBtn, secondaryBtn, scrollCue],
          { autoAlpha: 1, y: 0, letterSpacing: "normal" }
        );
      } else {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        tl.to(root.current, { autoAlpha: 1, duration: 0.45 }, 0)
          .to(visual, { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out" }, 0.1)
          .to(label, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.3)
          .to(
            lines,
            { autoAlpha: 1, y: 0, letterSpacing: "normal", duration: 0.55, stagger: 0.1 },
            0.45
          )
          .to(subtitle, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.8)
          .to(primaryBtn, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.95)
          .to(secondaryBtn, { autoAlpha: 1, y: 0, duration: 0.35 }, 1.05)
          .to(scrollCue, { autoAlpha: 1, duration: 0.35 }, 1.15);
      }

      if (!reducedMotion && scrollDot) {
        gsap.to(scrollDot, {
          y: 14,
          duration: 1.4,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (!reducedMotion) {
        gsap.to(visual, {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
        gsap.to(content, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
        gsap.to(backdrop, {
          scale: 1.02,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }

      cleanupFns.push(attachMagnetic(primaryBtn));
      cleanupFns.push(attachButtonGlow(primaryBtn));
      cleanupFns.push(attachUnderlineHover(secondaryBtn));

      readyRef.current = true;
    }, root);

    return () => {
      cleanupFns.forEach((fn) => fn());
      ctx.revert();
    };
  }, [root]);

  return readyRef;
}
