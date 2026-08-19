"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import "@/components/about/about.css";

function TrackingContent() {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const awbFromUrl = searchParams?.get("awb") || "";

  const [awbCode, setAwbCode] = useState(() => awbFromUrl);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      if (awbFromUrl) {
        setSearchSubmitted(true);
        fetchTracking(awbFromUrl);
      } else {
        setLoading(false);
      }
    }
  }, [awbFromUrl, initialLoad]);

  async function fetchTracking(code) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/shiprocket/track/${encodeURIComponent(code)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || `Tracking failed: ${response.status}`);
      }

      setTrackingData(data);
    } catch (err) {
      setError(err?.message || "Failed to fetch tracking information");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    const code = awbCode.trim().toUpperCase();
    if (!code) return;
    setSearchSubmitted(true);
    fetchTracking(code);
    router.push(`/track?awb=${encodeURIComponent(code)}`);
  }

  function getStatusColor(status) {
    const colors = {
      created: "#f59e0b",
      awb_assigned: "#3b82f6",
      pickup_scheduled: "#8b5cf6",
      picked_up: "#06b6d4",
      shipped: "#06b6d4",
      in_transit: "#06b6d4",
      out_for_delivery: "#f97316",
      delivered: "#22c55e",
      rto_initiated: "#ef4444",
      rto_delivered: "#6b7280",
      lost: "#ef4444",
      cancelled: "#ef4444",
      ndr: "#f97316",
    };
    return colors[status] || "#6b7280";
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatStatus(status) {
    if (!status) return "Unknown";
    return status
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }

  const timelineData = trackingData?.tracking?.shipment_track || [];
  const latestStatus = trackingData?.tracking?.current_status || trackingData?.shiprocketStatus;
  const estimatedDelivery = trackingData?.tracking?.estimated_delivery_date;

  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Track Order</p>
            <h1>Order Tracking</h1>
            <p>Enter your AWB/Tracking number to see real-time shipment status.</p>
          </div>
        </section>

        {/* Search Form */}
        <section className="about-page__section" style={{ maxWidth: 600, margin: "0 auto" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              value={awbCode}
              onChange={(e) => setAwbCode(e.target.value)}
              placeholder="Enter AWB / Tracking Number"
              style={{
                flex: 1,
                padding: "14px 18px",
                fontSize: "1rem",
                borderRadius: 10,
                border: "1px solid var(--hairline)",
                background: "var(--bg)",
                color: "var(--fg)",
              }}
              autoComplete="off"
            />
            <button
              type="submit"
              className="about-page__cta about-page__cta--primary"
              disabled={loading && !searchSubmitted}
              style={{ whiteSpace: "nowrap" }}
            >
              {loading && !searchSubmitted ? "Loading…" : "Track"}
            </button>
          </form>

          {error && (
            <p style={{ marginTop: 12, color: "#f7a1a1", fontSize: "0.875rem" }}>{error}</p>
          )}
        </section>

        {/* Tracking Results */}
        {searchSubmitted && trackingData && (
          <div style={{ maxWidth: 800, margin: "32px auto 0" }}>
            {/* Status Card */}
            <section className="about-page__section" style={{ marginBottom: 24 }}>
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, var(--gold) 0%, var(--goldDark) 100%)",
                  color: "#111",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.875rem", opacity: 0.7 }}>AWB / Tracking</p>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace" }}>
                      {trackingData.awbCode}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.875rem", opacity: 0.7 }}>Current Status</p>
                    <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                      {formatStatus(latestStatus)}
                    </p>
                  </div>
                </div>

                {estimatedDelivery && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(17,17,17,0.1)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.875rem", opacity: 0.7 }}>Estimated Delivery</p>
                    <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                      {formatDate(estimatedDelivery)}
                    </p>
                  </div>
                )}

                {trackingData.courierName && (
                  <div style={{ marginTop: 12, fontSize: "0.875rem", opacity: 0.8 }}>
                    Courier: <strong>{trackingData.courierName}</strong>
                  </div>
                )}
              </div>
            </section>

            {/* Timeline */}
            {timelineData.length > 0 && (
              <section className="about-page__section">
                <h2>Shipment Timeline</h2>
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 7,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: "var(--hairline)",
                    }}
                  />
                  {timelineData.map((event, index) => (
                    <div
                      key={`${event.date}-${event.status}-${index}`}
                      style={{
                        position: "relative",
                        paddingBottom: index === timelineData.length - 1 ? 0 : 24,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -24,
                          top: 4,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: getStatusColor(event.status),
                          border: "3px solid var(--bg)",
                          boxShadow: "0 0 0 2px var(--hairline)",
                        }}
                      />
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{formatStatus(event.status)}</p>
                            {event.location && (
                              <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>{event.location}</p>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.6, whiteSpace: "nowrap" }}>
                            {formatDate(event.date)}
                          </p>
                        </div>
                        {event.instructions && (
                          <p style={{ margin: "8px 0 0", fontSize: "0.8125rem", opacity: 0.5 }}>
                            {event.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Raw tracking data fallback */}
            {timelineData.length === 0 && trackingData.tracking && (
              <section className="about-page__section">
                <h2>Tracking Details</h2>
                <pre style={{ background: "var(--bg)", padding: 16, borderRadius: 10, overflow: "auto", fontSize: "0.75rem" }}>
                  {JSON.stringify(trackingData.tracking, null, 2)}
                </pre>
              </section>
            )}
          </div>
        )}

        {/* Help section when no search */}
        {!searchSubmitted && (
          <section className="about-page__section" style={{ maxWidth: 600, margin: "32px auto 0", textAlign: "center" }}>
            <h2>Need Help?</h2>
            <p style={{ opacity: 0.7, marginBottom: 24 }}>
              Your tracking number (AWB) is sent via email and WhatsApp when your order ships.
              You can also find it in your account under <Link href="/orders" style={{ color: "var(--gold)" }}>My Orders</Link>.
            </p>
            <Link href="/contact" className="about-page__cta about-page__cta--primary">
              Contact Support
            </Link>
          </section>
        )}
      </main>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Track Order</p>
            <h1>Order Tracking</h1>
            <p>Loading…</p>
          </div>
        </section>
      </main>
    </>
  );
}

export const dynamic = "force-dynamic";

export default function TrackingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TrackingContent />
    </Suspense>
  );
}