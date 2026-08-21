"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getHomepage, getSettings } from "@/lib/data";

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Return & Exchange Policy", href: "/return-exchange" },
  { label: "Contact Us", href: "/contact" },
  { label: "Sitemap", href: "/sitemap" },
];

export default function SiteFooter() {
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

  const brandName = settings.brandName || footer.brandName || "Beyond Buttons";
  const tagline = footer.tagline;
  const copyright = footer.copyright;
  const statementLines = homepage.hero?.subtitleLines || [];

  const contact = [
    settings.email ? { label: settings.email, href: `mailto:${settings.email}` } : null,
    settings.phone ? { label: settings.phone, href: `tel:${settings.phone}` } : null,
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
        <nav className="site-footer__company" aria-label="Company links">
          <p className="site-footer__company-title">Company</p>
          <ul className="site-footer__company-links">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__brand">
          <p className="site-footer__name">{brandName}</p>
          {tagline ? <p className="site-footer__tagline">{tagline}</p> : null}
          {statementLines.length > 0 ? (
            <p className="site-footer__statement">{statementLines.join(" ")}</p>
          ) : null}
          <Link href="/#shop" className="site-footer__cta">
            Shop the Collection
          </Link>
        </div>

        <div className="site-footer__meta">
          <div className="site-footer__contact">
            {contact.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            {copyright ? <span className="site-footer__copy">{copyright}</span> : null}
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