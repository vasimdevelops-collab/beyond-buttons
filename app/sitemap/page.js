import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import { getCategoriesServer, getProductsServer } from "@/lib/data";
import "@/components/about/about.css";

const MAIN_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Cart", href: "/cart" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Track Order", href: "/track" },
  { label: "My Account", href: "/account" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Return & Exchange Policy", href: "/return-exchange" },
];

export const metadata = {
  title: "Sitemap — Beyond Buttons",
  description: "Every page on the Beyond Buttons store, in one place.",
};

export default async function SitemapPage() {
  const [categories, products] = await Promise.all([
    getCategoriesServer(),
    getProductsServer(),
  ]);

  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Pages</p>
            <h1>Sitemap</h1>
            <p>Every page on the Beyond Buttons store, in one place.</p>
          </div>
        </section>

        <section className="about-page__section">
          <div className="about-page__story" style={{ display: "grid", gap: 28 }}>
            <div>
              <h3 className="about-page__card-eyebrow">Main</h3>
              <ul className="sitemap-page__list">
                {MAIN_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="about-page__card-eyebrow">Categories</h3>
              <ul className="sitemap-page__list">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="about-page__card-eyebrow">Products</h3>
              <ul className="sitemap-page__list">
                {products.map((product) => (
                  <li key={product.slug}>
                    <Link href={`/product/${product.slug}`}>{product.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="about-page__card-eyebrow">Legal</h3>
              <ul className="sitemap-page__list">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="about-page__cta-row">
            <Link href="/#shop" className="about-page__cta about-page__cta--primary">
              Shop the collection
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