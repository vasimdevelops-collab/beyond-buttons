"use client";

import { useEffect, useRef, useState } from "react";

function formatAxisMoney(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

export default function SalesChart({ series }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth || 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const width = 900;
  const height = 240;
  const padL = 46;
  const padR = 12;
  const padT = 16;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxRevenue = Math.max(1, ...series.map((d) => d.revenue));
  const scaleY = (value) => padT + innerH - (value / maxRevenue) * innerH;

  const stepX = series.length > 1 ? innerW / (series.length - 1) : innerW;

  const barW = Math.max(2, Math.min(14, (innerW / series.length) * 0.55));
  const linePath = series
    .map((d, i) => {
      const x = padL + i * stepX;
      const y = scaleY(d.revenue);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = series.length
    ? `${linePath} L${padL + (series.length - 1) * stepX},${padT + innerH} L${padL},${padT + innerH} Z`
    : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Label density follows the actual rendered width (desktop → ~12 labels,
  // narrow mobile → only a handful so they never collide).
  const measured = containerWidth || 700;
  const targetLabels = Math.max(4, Math.floor(measured / 62));
  const labelEvery = Math.max(1, Math.ceil(series.length / targetLabels));

  return (
    <div ref={containerRef} style={{ width: "100%", minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Daily sales and revenue for the last 30 days"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <defs>
          <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => {
          const y = padT + innerH - line * innerH;
          const value = maxRevenue * line;
          return (
            <g key={line}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(255,255,255,0.55)"
              >
                {formatAxisMoney(value)}
              </text>
            </g>
          );
        })}

        {series.map((d, i) => {
          if (i % labelEvery !== 0) return null;
          const x = padL + i * stepX;
          return (
            <text
              key={d.date}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.5)"
            >
              {d.label}
            </text>
          );
        })}

        {series.map((d, i) => {
          const x = padL + i * stepX;
          const barH = (d.revenue / maxRevenue) * innerH;
          return (
            <g key={`bar-${d.date}`}>
              <rect
                x={x - barW / 2}
                y={scaleY(d.revenue)}
                width={barW}
                height={barH}
                rx="2"
                fill="#d4af37"
                opacity="0.45"
              />
              <title>{`${d.date} — ${d.orders} order${d.orders === 1 ? "" : "s"} · ₹${d.revenue.toLocaleString("en-IN")}`}</title>
            </g>
          );
        })}

        {areaPath ? (
          <path d={areaPath} fill="url(#salesArea)" stroke="none" />
        ) : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </div>
  );
}