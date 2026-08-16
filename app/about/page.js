import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import "@/components/about/about.css";

const VALUES = [
  {
    title: "Intentional design",
    copy: "Each silhouette is built to feel considered, clean, and easy to live in from day to night.",
  },
  {
    title: "Better materials",
    copy: "We focus on premium cotton, refined textures, and tactile finishes that age beautifully.",
  },
  {
    title: "Wardrobe calm",
    copy: "The wardrobe should simplify dressing, not complicate it — fewer pieces, stronger choices.",
  },
];

const PRINCIPLES = [
  {
    title: "Modern essentials",
    copy: "A tighter, smarter edit of pieces that earn their place in your rotation.",
  },
  {
    title: "Tailored comfort",
    copy: "Function sits alongside refinement, making premium basics feel effortless and polished.",
  },
  {
    title: "Editorial restraint",
    copy: "Our palettes and proportions stay quiet, elevated, and deliberately balanced.",
  },
  {
    title: "Built for real life",
    copy: "We design for everyday wear, travel, work, and evenings that need an easy upgrade.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Our story</p>
            <h1>Beyond buttons, into a sharper everyday uniform.</h1>
            <p>
              Beyond Buttons began with a simple idea: a modern wardrobe should feel
              considered, effortless, and elevated without being loud. We make refined
              essentials that anchor a better routine.
            </p>
          </div>

          <div className="about-page__meta">
            <div>
              <span>01</span>
              <small>Brand</small>
            </div>
            <div>
              <span>04</span>
              <small>Core values</small>
            </div>
            <div>
              <span>∞</span>
              <small>Style goal</small>
            </div>
          </div>
        </section>

        <section className="about-page__section">
          <h2>What we stand for</h2>
          <div className="about-page__values">
            {VALUES.map((value) => (
              <article key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-page__section">
          <h2>Design principles</h2>
          <div className="about-page__principles">
            {PRINCIPLES.map((principle) => (
              <article key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            ))}
          </div>

          <div className="about-page__cta-row">
            <Link href="/shop" className="about-page__cta about-page__cta--primary">
              Shop now
            </Link>
            <Link href="/" className="about-page__cta">
              Back home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
