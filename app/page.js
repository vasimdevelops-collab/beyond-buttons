"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";

import Intro from "@/components/intro/Intro";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Products from "@/components/home/Products";
import BrandStory from "@/components/home/BrandStory";
import VisionMission from "@/components/home/VisionMission";
import WhyBeyond from "@/components/home/WhyBeyond";
import { getHomepage, getSettings } from "@/lib/data";
import "@/components/home/sections.css";
import "@/components/home/brand-story.css";
import "@/components/home/vision-mission.css";

const INTRO_SESSION_KEY = "bb-intro-complete";

function SiteFooter() {
  const homepage = getHomepage();
  const footer = homepage.footer || {};
  const social = homepage.socialLinks || {};
  const [liveSettings, setLiveSettings] = useState(getSettings());

  useEffect(() => {
    let active = true;
    fetch("/api/site/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active && data && typeof data === "object") setLiveSettings(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const settings = liveSettings || getSettings();

  const brandName = settings.brandName || footer.brandName;
  const tagline = footer.tagline;
  const columns = footer.columns || [];
  const copyright = footer.copyright;

  const contact = [
    settings.email ? { label: settings.email, href: `mailto:${settings.email}` } : null,
    settings.phone ? { label: settings.phone, href: `tel:${settings.phone}` } : null,
    settings.whatsapp
      ? {
          label: "WhatsApp",
          href: settings.whatsapp.startsWith("http")
            ? settings.whatsapp
            : `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`,
        }
      : null,
  ].filter(Boolean);

  const socialLinks = [
    social.instagram || settings.instagram
      ? { label: "Instagram", href: social.instagram || settings.instagram }
      : null,
    social.facebook || settings.facebook
      ? { label: "Facebook", href: social.facebook || settings.facebook }
      : null,
    social.youtube || settings.youtube
      ? { label: "YouTube", href: social.youtube || settings.youtube }
      : null,
  ].filter(Boolean);

  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer__backdrop" aria-hidden="true" />
      <div className="site-footer__container">
        <div className="site-footer__brand">
          <p className="site-footer__name">{brandName}</p>
          {tagline ? <p className="site-footer__tagline">{tagline}</p> : null}
        </div>

        {columns.length > 0 ? (
          <div className="site-footer__columns">
            {columns.map((column) => (
              <div key={column.id || column.title}>
                <p className="site-footer__column-title">{column.title}</p>
                <ul className="site-footer__links">
                  {(column.links || []).map((link) => (
                    <li key={`${column.id}-${link.href}-${link.label}`}>
                      {link.href?.startsWith("/") ? (
                        <Link href={link.href}>{link.label}</Link>
                      ) : (
                        <a href={link.href}>{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        <div className="site-footer__meta">
          <div>
            {contact.length > 0 ? (
              <p className="site-footer__contact">
                {contact.map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </p>
            ) : null}
            {copyright ? <p className="site-footer__copy">{copyright}</p> : null}
          </div>

          {socialLinks.length > 0 ? (
            <ul className="site-footer__social">
              {socialLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function HomeShell() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Products />
        <BrandStory />
        <VisionMission />
        <WhyBeyond
          media={{
            type: "image",
            src: "/images/images%20(5).jfif",
            alt: "Beyond Buttons — editorial presence",
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}

export default function Home() {
  // pending → avoids SSR/client hydration mismatch while we read sessionStorage
  const [boot, setBoot] = useState({ ready: false, showIntro: false });

  useEffect(() => {
    let showIntro = true;

    try {
      const nav = performance.getEntriesByType("navigation")[0];
      // Full refresh should replay the intro; client navigations keep the session flag.
      if (nav?.type === "reload") {
        sessionStorage.removeItem(INTRO_SESSION_KEY);
      }
      showIntro = sessionStorage.getItem(INTRO_SESSION_KEY) !== "1";
    } catch {
      showIntro = true;
    }

    startTransition(() => {
      setBoot({ ready: true, showIntro });
    });
  }, []);

  const finishIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // private mode — still continue into the site for this view
    }
    setBoot({ ready: true, showIntro: false });
  };

  if (!boot.ready) {
    return (
      <div
        className="app-boot"
        aria-hidden="true"
        style={{ minHeight: "100vh", background: "var(--color-bg)" }}
      />
    );
  }

  if (boot.showIntro) {
    return <Intro onFinish={finishIntro} />;
  }

  return <HomeShell />;
}
