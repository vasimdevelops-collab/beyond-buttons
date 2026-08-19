import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import "@/components/about/about.css";

const SHIPPING = [
  {
    title: "Dispatch time",
    copy: "Orders are dispatched within 24–48 hours on working days. You'll receive a tracking ID on email/WhatsApp as soon as your order ships.",
  },
  {
    title: "Delivery time",
    copy: "Metros and major cities: 2–4 working days. Rest of India: 4–7 working days.",
  },
  {
    title: "Shipping cost",
    copy: "Free shipping on all prepaid orders. COD orders include a small handling charge of ₹49.",
  },
  {
    title: "COD availability",
    copy: "Cash on Delivery is available on orders up to ₹5,000. Amount is collected by the courier partner at the time of delivery.",
  },
];

const RETURNS = [
  {
    title: "7-day returns",
    copy: "You can request a return within 7 days of delivery for a refund or exchange, as long as the garment is unworn, unwashed, and has all tags intact.",
  },
  {
    title: "How to initiate",
    copy: "Drop an email to hello@beyondbuttons.in with your order ID and a photo of the item. We'll pick it up within 2–3 working days.",
  },
  {
    title: "Refunds",
    copy: "Once the pickup is complete and the item is inspected, refunds are processed within 5–7 working days to the original payment method.",
  },
  {
    title: "Size exchanges",
    copy: "If the fit isn't right, request a size exchange instead of a return — we'll ship the replacement size free of charge on the same pickup.",
  },
];

export const metadata = {
  title: "Shipping & Returns — Beyond Buttons",
  description: "Beyond Buttons shipping and return policy. Free shipping, 7-day returns, easy size exchanges.",
};

export default function ShippingPage() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-page__hero">
          <div>
            <p className="about-page__eyebrow">Support</p>
            <h1>Shipping &amp; Returns</h1>
            <p>
              Clear, honest delivery and returns — so buying your next essential is
              effortless from checkout to doorstep.
            </p>
          </div>

          <div className="about-page__meta">
            <div>
              <span>24–48h</span>
              <small>Dispatch</small>
            </div>
            <div>
              <span>7 days</span>
              <small>Returns</small>
            </div>
            <div>
              <span>Free</span>
              <small>Prepaid shipping</small>
            </div>
          </div>
        </section>

        <section className="about-page__section">
          <h2>Shipping</h2>
          <div className="about-page__values">
            {SHIPPING.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-page__section">
          <h2>Returns &amp; exchanges</h2>
          <div className="about-page__principles">
            {RETURNS.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>

          <div className="about-page__cta-row">
            <Link href="/contact" className="about-page__cta about-page__cta--primary">
              Contact us
            </Link>
            <Link href="/shop" className="about-page__cta">
              Shop now
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}