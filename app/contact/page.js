import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import { getSettingsServer } from "@/lib/data";
import "@/components/about/about.css";

export const metadata = {
  title: "Contact — Beyond Buttons",
  description: "Get in touch with Beyond Buttons. We reply within 72 hours.",
};

export default async function ContactPage() {
  const settings = await getSettingsServer();
  const email = settings.email || "hello@beyondbuttons.in";
  const whatsapp = settings.whatsapp || "";
  const supportHours = settings.supportHours || "Mon - Sat · 10:00 AM to 7:00 PM";
  const instagram = settings.instagram
    ? `@${settings.instagram.replace(/^@/, "").split("/").pop()}`
    : "@beyondbuttons";

  return (
    <>
      <Navbar />

      <main className="bb-contact">
        {/* ── Hero — full-bleed, borderless ─────────────────────────── */}
        <section className="bb-contact__hero">
          <div className="bb-contact__inner">
            <p className="bb-about__eyebrow">Contact</p>
            <h1>Let&apos;s talk essentials.</h1>
            <p className="bb-contact__intro">
              For bespoke wardrobe questions, first-time orders, styling guidance, or
              wholesale conversations — we&apos;re here to help.
            </p>
          </div>
        </section>

        {/* ── Primary — email + 72h (client requirement) ────────────── */}
        <section className="bb-contact__primary">
          <div className="bb-contact__inner">
            <div className="bb-contact__card">
              <p className="bb-about__section-tag">Write to us</p>
              <a className="bb-contact__email" href={`mailto:${email}`}>
                {email}
              </a>
              <p className="bb-contact__reply">We reply within 72 hours.</p>
              <p className="bb-contact__assessment">
                For a quick assessment, please share your personal phone number and
                email address in your message.
              </p>
              <div className="bb-about__cta-row">
                <a href={`mailto:${email}`} className="about-page__cta about-page__cta--primary">
                  Email us
                </a>
                <Link href="/shop" className="about-page__cta">
                  Shop now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Other ways to reach us — hairline grid ────────────────── */}
        <section className="bb-contact__other">
          <div className="bb-contact__inner">
            <p className="bb-about__section-tag">Other ways to reach us</p>
            <div className="bb-contact__grid">
              <div className="bb-contact__tile">
                <b>WhatsApp</b>
                <p>{whatsapp || "Available on request"}</p>
              </div>
              <div className="bb-contact__tile">
                <b>Instagram</b>
                <p>{instagram}</p>
              </div>
              <div className="bb-contact__tile">
                <b>Business hours</b>
                <p>{supportHours}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}