import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import ContactForm from "@/components/contact/ContactForm";
import "@/components/about/about.css";
import "@/components/contact/contact-form.css";

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Contact</p>
            <h1>Let&apos;s talk essentials.</h1>
            <p>
              For bespoke wardrobe questions, first-time orders, styling guidance, or
              wholesale conversations, we&apos;re here to help.
            </p>
          </div>

          <div className="about-page__meta">
            <div>
              <span>Email</span>
              <small>hello</small>
            </div>
            <div>
              <span>Phone</span>
              <small>WhatsApp</small>
            </div>
            <div>
              <span>Reply</span>
              <small>Within 24h</small>
            </div>
          </div>
        </section>

        <section className="about-page__section">
          <h2>Send us a message</h2>
          <ContactForm />
        </section>

        <section className="about-page__section" style={{ marginTop: "24px" }}>
          <h2>Other ways to reach us</h2>
          <div className="about-page__principles">
            <article>
              <h3>Email</h3>
              <p>hello@beyondbuttons.in</p>
            </article>
            <article>
              <h3>Phone</h3>
              <p>+91 98765 43210</p>
            </article>
            <article>
              <h3>Instagram</h3>
              <p>@beyondbuttons</p>
            </article>
            <article>
              <h3>Business hours</h3>
              <p>Mon - Sat · 10:00 AM to 7:00 PM</p>
            </article>
          </div>

          <div className="about-page__cta-row">
            <a href="mailto:hello@beyondbuttons.in" className="about-page__cta about-page__cta--primary">
              Email us
            </a>
            <Link href="/shop" className="about-page__cta">
              Shop now
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
