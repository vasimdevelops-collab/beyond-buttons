"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const GOLD_PALETTE = ["#D4AF37", "#F1D37B", "#C9A227", "#E8C547", "#B8960C"];

function createParticle(x, y, mode) {
  const angle =
    mode === "impact"
      ? Math.random() * Math.PI * 2
      : Math.PI + (Math.random() - 0.5) * 1.2;

  const speed =
    mode === "impact" ? 1.5 + Math.random() * 5 : 0.8 + Math.random() * 2.5;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (mode === "impact" ? 2 : 0.5),
    size: mode === "impact" ? 1.5 + Math.random() * 3.5 : 1 + Math.random() * 2,
    life: 1,
    decay: mode === "impact" ? 0.012 + Math.random() * 0.018 : 0.008 + Math.random() * 0.012,
    color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
    gravity: mode === "impact" ? 0.06 : 0.04,
  };
}

const GoldParticles = forwardRef(function GoldParticles({ mode = "impact" }, ref) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const activeRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.life -= p.decay;

      const radius = Math.max(p.size * p.life, 0);
      if (radius <= 0) continue;

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (activeRef.current || particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, []);

  const burst = useCallback(
    (x, y, count = 55) => {
      originRef.current = { x, y };
      for (let i = 0; i < count; i += 1) {
        particlesRef.current.push(createParticle(x, y, "impact"));
      }
      activeRef.current = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  const emitTrail = useCallback(
    (x, y, count = 4) => {
      for (let i = 0; i < count; i += 1) {
        particlesRef.current.push(createParticle(x, y, "trail"));
      }
      activeRef.current = true;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    },
    [draw]
  );

  const stop = useCallback(() => {
    activeRef.current = false;
  }, []);

  useImperativeHandle(ref, () => ({
    burst,
    emitTrail,
    stop,
  }));

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`intro-particles intro-particles--${mode}`}
      aria-hidden="true"
    />
  );
});

export default GoldParticles;
