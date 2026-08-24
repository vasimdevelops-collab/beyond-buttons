import fs from "node:fs";
import path from "node:path";

import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import AboutMotion from "@/components/about/AboutMotion";
import "@/components/about/about.css";

function hasImage(rel) {
  return fs.existsSync(path.join(process.cwd(), "public", rel));
}

function Figure({ src, alt, caption }) {
  if (hasImage(src)) {
    return (
      <figure className="bb-about__figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="bb-about__figure bb-about__figure--placeholder">
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

const STORY = [
  "Beyond Buttons began with a simple question: why does a wardrobe that should simplify dressing so often complicate it? We believed the answer wasn't more clothes — it was better ones.",
  "So we started the way every honest brand should: with a single garment. One shirt, cut clean and made properly. Not to follow a trend, but to fix a feeling — the feeling of dressing in something that finally meets your standard.",
  "That first shirt taught us everything. That fabric weight matters more than fabric trends. That a seam placed right is quieter than a logo placed loudly. That restraint is not the absence of design, but the presence of intention.",
  "Today Beyond Buttons is still built on that same conviction: fewer, better. Every piece is a study in premium fabrics, honest construction, and proportions that work hard so you don't have to think about them.",
];

const PULL_QUOTE =
  "The name is the promise. Beyond the buttons — beyond the obvious details — is a sharper everyday uniform.";

const VALUES = [
  {
    index: "01",
    title: "Craft",
    copy: "Premium fabrics and honest construction — combed cottons, real seams, garment-dyed and pre-shrunk so the fit you buy is the fit you keep.",
  },
  {
    index: "02",
    title: "Restraint",
    copy: "Quiet palettes and deliberate proportions. Fewer, better pieces designed to last years, not seasons — a small collection that is complete.",
  },
  {
    index: "03",
    title: "Presence",
    copy: "Built for real life — work, travel, and evenings that need an easy upgrade — and made to let you walk in quietly confident.",
  },
];

const MISSION = {
  title: "Mission",
  copy: "To make premium solid shirts accessible to everyone by combining timeless design, exceptional quality, and honest pricing. We exist to prove that simplicity is not ordinary—it is confidence, crafted for everyday life.",
};

const VISION = {
  title: "Vision",
  copy: "To become the world's most trusted solid shirt brand, redefining everyday fashion through simplicity, consistency, and affordability—making BEYOND BUTTONS™ the first name people think of whenever they choose a solid shirt.",
};

const STATS = [
  { href: "#foundation", value: "01", label: "The first shirt" },
  { href: "#craft", value: "02", label: "Craft principles" },
  { href: "#vision", value: "03", label: "Mission & Vision" },
];

export const metadata = {
  title: "Our Story — Beyond Buttons",
  description: "The story of Beyond Buttons: a single shirt, a sharper everyday uniform, and a promise about quality.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <AboutMotion />

      <main className="bb-about">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bb-about__hero">
          <div className="bb-about__backdrop" aria-hidden="true" />
          <div className="bb-about__inner">
            <p className="bb-about__eyebrow" data-hero="eyebrow">
              Our story
            </p>
            <h1 data-hero="title">
              Beyond buttons,
              <br />
              into a sharper everyday uniform.
            </h1>
            <span
              className="bb-about__divider bb-about__divider--left"
              aria-hidden="true"
              data-hero="divider"
            />
            <p className="bb-about__hero-intro" data-hero="intro">
              Where we came from, how we make things, and what we&apos;re
              building — the whole story in three chapters.
            </p>

            <nav className="bb-about__stats" aria-label="Jump to sections">
              {STATS.map((stat) => (
                <a key={stat.href} className="bb-about__stat" href={stat.href}>
                  <b>{stat.value}</b>
                  <small>{stat.label}</small>
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* ── Editorial frame ──────────────────────────────────────────── */}
        <div className="bb-about__editorial-wrapper">
          <div className="bb-about__inner">
            <Figure
              src="/images/homeback.jpeg"
              alt="Beyond Buttons editorial"
              caption="The studio"
            />
          </div>
        </div>

        {/* ── Chapter one — founding story ─────────────────────────────── */}
        <section id="foundation" className="bb-about__chapter">
          <div className="bb-about__inner bb-about__inner--narrow">
            <p className="bb-about__section-tag" data-motion="rise">
              Chapter one
            </p>
            <h2 className="bb-about__section-title" data-motion="rise">
              The first shirt
            </h2>
            <span
              className="bb-about__divider bb-about__divider--left"
              aria-hidden="true"
              data-motion="divider-left"
            />
            <div className="bb-about__story">
              {STORY.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <blockquote className="bb-about__pull">{PULL_QUOTE}</blockquote>
          </div>
        </section>

        {/* ── Ornament divider ─────────────────────────────────────────── */}
        <div className="bb-about__ornament" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        {/* ── Chapter two — craft principles ───────────────────────────── */}
        <section id="craft" className="bb-about__chapter bb-about__chapter--band">
          <div className="bb-about__inner">
            <p className="bb-about__section-tag" data-motion="rise">
              Chapter two
            </p>
            <h2 className="bb-about__section-title" data-motion="rise">
              Cut clean, made properly
            </h2>
            <span
              className="bb-about__divider bb-about__divider--left"
              aria-hidden="true"
              data-motion="divider-left"
            />
            <p className="bb-about__chapter-intro" data-motion="rise">
              Every piece starts with the fabric and ends with the finish.
              Nothing is left to chance, and nothing is added that doesn&apos;t
              earn its place.
            </p>

            <div className="bb-about__values">
              {VALUES.map((value) => (
                <article key={value.index} className="bb-about__value">
                  <b>{value.index}</b>
                  <h3>{value.title}</h3>
                  <p>{value.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Chapter three — Mission & Vision ─────────────────────────── */}
        <section id="vision" className="bb-about__vm">
          <div className="bb-about__inner bb-about__inner--center">
            <p className="bb-about__eyebrow" data-motion="rise">
              Chapter three
            </p>
            <h2 className="bb-about__section-title" data-motion="rise">
              Mission &amp; Vision
            </h2>
            <span
              className="bb-about__divider"
              aria-hidden="true"
              data-motion="divider-center"
            />
            <div className="bb-about__vm-grid">
              <article className="bb-about__vm-card">
                <h3>{MISSION.title}</h3>
                <span className="bb-about__vm-rule" aria-hidden="true" />
                <p>{MISSION.copy}</p>
              </article>
              <article className="bb-about__vm-card">
                <h3>{VISION.title}</h3>
                <span className="bb-about__vm-rule" aria-hidden="true" />
                <p>{VISION.copy}</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────────── */}
        <section className="bb-about__closing">
          <div className="bb-about__backdrop" aria-hidden="true" />
          <div className="bb-about__inner bb-about__inner--center">
            <h2 className="bb-about__closing-title">Fewer, better.</h2>
            <p className="bb-about__closing-copy">
              Three principles. One shirt. Explore the edit and see what a
              considered wardrobe feels like.
            </p>
            <div className="bb-about__cta-row">
              <Link href="/shop" className="about-page__cta about-page__cta--primary">
                Shop the edit
              </Link>
              <Link href="/contact" className="about-page__cta">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
