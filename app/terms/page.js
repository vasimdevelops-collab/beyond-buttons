import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import "@/components/about/about.css";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    copy: "By accessing or purchasing from Beyond Buttons, you agree to these Terms & Conditions, our Privacy Policy, and our Shipping & Returns policy. If you do not agree, please do not use the website.",
  },
  {
    title: "2. Orders & acceptance",
    copy: "All orders are subject to availability and confirmation. We may refuse or cancel any order (including those with pricing errors or suspected misuse) at our discretion. You will be notified and refunded if your order is cancelled after payment.",
  },
  {
    title: "3. Pricing & payments",
    copy: "All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We accept prepaid (cards, UPI, net banking, wallets) and Cash on Delivery up to ₹5,000. Payment details are processed through Razorpay; Beyond Buttons does not store your card or bank details.",
  },
  {
    title: "4. Delivery & risk",
    copy: "Delivery timelines are estimates and not guaranteed. Risk of loss passes to you upon successful delivery. Please inspect the package at the time of delivery and report any transit damage within 48 hours.",
  },
  {
    title: "5. Returns & exchanges",
    copy: "Returns and size exchanges are accepted within 7 days of delivery under the conditions described on our Shipping & Returns page. The garment must be unworn, unwashed, and in its original packaging with tags attached.",
  },
  {
    title: "6. Intellectual property",
    copy: "All content on this website — including branding, text, imagery, and design — is the property of Beyond Buttons and may not be reproduced or distributed without prior written consent.",
  },
  {
    title: "7. Limitation of liability",
    copy: "Beyond Buttons is not liable for indirect, incidental, or consequential damages arising from the use of the website or products, to the maximum extent permitted by law.",
  },
  {
    title: "8. Governing law",
    copy: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of your state of residence, as applicable under consumer protection law.",
  },
  {
    title: "9. Contact",
    copy: "For any questions about these Terms & Conditions, reach us at hello@beyondbuttons.in.",
  },
];

export const metadata = {
  title: "Terms & Conditions — Beyond Buttons",
  description: "Beyond Buttons terms and conditions.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Legal</p>
            <h1>Terms &amp; Conditions</h1>
            <p>
              Last updated: August 2026. Please read these terms carefully before
              placing an order with Beyond Buttons.
            </p>
          </div>
        </section>

        <section className="about-page__section">
          <div className="about-page__values">
            {SECTIONS.map((section) => (
              <article key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
              </article>
            ))}
          </div>

          <div className="about-page__cta-row">
            <Link href="/contact" className="about-page__cta about-page__cta--primary">
              Contact us
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