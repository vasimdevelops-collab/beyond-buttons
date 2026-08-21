import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import "@/components/legal/legal.css";

export default function LegalPage({
  eyebrow = "Legal",
  title,
  lead,
  updated,
  sections,
  toc = false,
}) {
  return (
    <>
      <Navbar />

      <main className="legal-page">
        <section className="legal-page__hero">
          <div>
            <p className="legal-page__eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {lead ? <p className="legal-page__lead">{lead}</p> : null}
            {updated ? <span className="legal-page__updated">Last updated: {updated}</span> : null}
          </div>
        </section>

        <section className="legal-page__body">
          {toc ? (
            <details className="legal-page__toc">
              <summary>Contents</summary>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}

          <div className="legal-page__sections">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="legal-page__section">
                <h2>{section.heading}</h2>
                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.list?.length ? (
                  <ul>
                    {section.list.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="legal-page__cta-row">
            <Link href="/contact" className="legal-page__cta legal-page__cta--primary">
              Contact us
            </Link>
            <Link href="/" className="legal-page__cta">
              Back home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}