import fs from "node:fs";
import path from "node:path";

import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import "@/components/about/about.css";

function hasImage(rel) {
  return fs.existsSync(path.join(process.cwd(), "public", rel));
}

function Figure({ src, alt, caption, className }) {
  if (hasImage(src)) {
    return (
      <figure className={`bb-about__figure ${className || ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className={`bb-about__figure bb-about__figure--placeholder ${className || ""}`}>
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
  "The name is the promise. Beyond the buttons — beyond the obvious details — is a sharper everyday uniform. Quiet, deliberate, lasting.";

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

const VISION = {
  eyebrow: "Vision",
  title: "The Standard",
  copy: "To build the world's most considered solid-shirt brand — where quality, craft, and quiet confidence make everyday dressing feel effortless. We measure success not in how many garments leave the studio, but in how long they stay in a wardrobe.",
};

const MISSION = {
  eyebrow: "Mission",
  title: "The Work",
  copy: "To make one thing brilliantly: the perfect solid shirt. Premium fabrics, honest construction, and a tighter, smarter edit that earns its place in your rotation — with responsible sourcing and fair, considered production at every step.",
};

export const metadata = {
  title: "Our Story — Beyond Buttons",
  description: "The story of Beyond Buttons: a single shirt, a sharper everyday uniform, and a promise about quality.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="bb-about">
        {/* ── Hero — full-bleed, borderless ─────────────────────────── */}
        <section className="bb-about__hero">
          <div className="bb-about__inner">
            <p className="bb-about__eyebrow">Our story</p>
            <h1>Beyond buttons, into a sharper everyday uniform.</h1>
            <p className="bb-about__hero-intro">
              The whole story — where we came from, how we make things, and what
              we&apos;re building.
            </p>

            <nav className="bb-about__stats" aria-label="Jump to sections">
              <a className="bb-about__stat" href="#foundation">
                <b>01</b>
                <small>The first shirt</small>
              </a>
              <a className="bb-about__stat" href="#craft">
                <b>03</b>
                <small>Craft principles</small>
              </a>
              <a className="bb-about__stat" href="#vision">
                <b>∞</b>
                <small>Style goal</small>
              </a>
            </nav>
          </div>
        </section>

        {/* ── Image break #1 — full-bleed editorial ─────────────────── */}
        <Figure
          src="/images/homeback.jpeg"
          alt="Beyond Buttons editorial"
          caption="The studio"
          className="bb-about__figure--wide"
        />

        {/* ── The founding story — borderless narrative ─────────────── */}
        <section id="foundation" className="bb-about__foundation">
          <div className="bb-about__inner">
            <p className="bb-about__section-tag">How it began</p>
            <h2 className="bb-about__section-title">The first shirt</h2>
            <div className="bb-about__story">
              {STORY.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p className="bb-about__pull">{PULL_QUOTE}</p>
            </div>
          </div>
        </section>

        {/* ── Craft — one values grid ────────────────────────────────── */}
        <section id="craft" className="bb-about__craft">
          <div className="bb-about__inner">
            <p className="bb-about__section-tag">The craft</p>
            <h2 className="bb-about__section-title">Cut clean, made properly</h2>
            <p className="bb-about__craft-intro">
              Every piece starts with the fabric and ends with the finish.
              Nothing is left to chance, and nothing is added that doesn&apos;t
              earn its place.
            </p>

            <div className="bb-about__values">
              {VALUES.map((value) => (
                <article className="bb-about__value" key={value.index}>
                  <b>{value.index}</b>
                  <h3>{value.title}</h3>
                  <p>{value.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vision & Mission — alternating tone band ──────────────── */}
        <section id="vision" className="bb-about__vision">
          <div className="bb-about__inner">
            <p className="bb-about__section-tag">Where we&apos;re going</p>
            <h2 className="bb-about__section-title">Vision &amp; Mission</h2>
            <div className="bb-about__vision-grid">
              <div className="bb-about__vision-col">
                <p className="bb-about__card-eyebrow">{VISION.eyebrow}</p>
                <h3>{VISION.title}</h3>
                <p>{VISION.copy}</p>
              </div>
              <div className="bb-about__vision-col">
                <p className="bb-about__card-eyebrow">{MISSION.eyebrow}</p>
                <h3>{MISSION.title}</h3>
                <p>{MISSION.copy}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────── */}
        <section className="bb-about__closing">
          <div className="bb-about__inner">
            <h2 className="bb-about__section-title">Fewer, better.</h2>
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