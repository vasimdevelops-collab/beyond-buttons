"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RevealOnScroll — simple IntersectionObserver-based fade-up reveal
 * - Starts with opacity: 0, translateY(24px)
 * - Adds .is-visible when element enters viewport (threshold ~0.15)
 * - Once revealed, stops observing (no re-trigger on scroll back up)
 * - Respects prefers-reduced-motion
 */
export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply delay if specified
            if (delay > 0) {
              setTimeout(() => {
                setIsVisible(true);
                setHasAnimated(true);
              }, delay);
            } else {
              setIsVisible(true);
              setHasAnimated(true);
            }

            if (once) {
              observer.unobserve(element);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold, rootMargin, once]);

  // Initial hidden state (unless reduced motion)
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const initialHidden = !prefersReducedMotion && !hasAnimated;

  return (
    <div
      ref={elementRef}
      className={`reveal-on-scroll ${isVisible ? "is-visible" : ""} ${initialHidden ? "is-hidden" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Hook version for when you need more control
 */
export function useRevealOnScroll(options = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true, delay = 0 } = options;
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                setIsVisible(true);
                setHasAnimated(true);
              }, delay);
            } else {
              setIsVisible(true);
              setHasAnimated(true);
            }

            if (once) {
              observer.unobserve(element);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, threshold, rootMargin, once]);

  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  return {
    ref: elementRef,
    isVisible: prefersReducedMotion || isVisible,
    isHidden: !prefersReducedMotion && !hasAnimated,
  };
}