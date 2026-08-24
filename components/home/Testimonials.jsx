"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai",
    role: "Creative Director",
    text: "Beyond Buttons has completely changed how I think about everyday dressing. The Cloud White shirt is the first piece in years that fits perfectly off the rack -- no tailoring needed.",
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    name: "Rohit Malhotra",
    location: "Delhi",
    role: "Founder, Tech Startup",
    text: "I've bought three shirts now -- Navy, Olive, and Charcoal. The fabric doesn't wrinkle, the collar holds its shape, and I genuinely feel more put-together without trying.",
    rating: 5,
    verified: true,
  },
  {
    id: 3,
    name: "Ananya Iyer",
    location: "Bangalore",
    role: "Architect",
    text: "Finally, a brand that understands proportions for Indian bodies. The sleeve length, the shoulder width, the torso length -- it's like they were made for me.",
    rating: 5,
    verified: true,
  },
  {
    id: 4,
    name: "Karan Mehta",
    location: "Pune",
    role: "Photographer",
    text: "The Cream Relaxed Cargo pants paired with the Boxy shirt -- best fit combo I own. Wore them for a 12-hour shoot day and zero discomfort. The fabric breathes.",
    rating: 5,
    verified: true,
  },
  {
    id: 5,
    name: "Sneha Reddy",
    location: "Hyderabad",
    role: "Product Designer",
    text: "Ordered online, hesitated on sizing -- their guide was spot on. Beautiful minimal packaging, handwritten note included. That level of care tells you everything about the brand.",
    rating: 5,
    verified: true,
  },
  {
    id: 6,
    name: "Arjun Patel",
    location: "Ahmedabad",
    role: "Business Owner",
    text: "Been wearing the Solid White for client meetings all month. Zero see-through issues, collar stays crisp through humid days, and the hidden placket gives a clean line.",
    rating: 5,
    verified: true,
  },
];

const LOOP_DURATION = 20;

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    "linear-gradient(135deg, var(--gold), var(--goldLight))",
    "linear-gradient(135deg, #c9a96e, var(--gold))",
    "linear-gradient(135deg, #b8965c, #c9a96e)",
    "linear-gradient(135deg, #a6834a, #b8965c)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Testimonials() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile || TESTIMONIALS.length < 2) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [isMobile]);

  const renderCard = (testimonial, keySuffix) => (
    <article key={`${testimonial.id}-${keySuffix}`} className="testimonial-card">
      <div className="testimonial-card__inner">
        <div
          className="testimonial-card__rating"
          aria-label={`${testimonial.rating} out of 5 stars`}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`testimonial-card__star ${i < testimonial.rating ? "is-filled" : ""}`}
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ))}
        </div>

        <blockquote className="testimonial-card__quote">
          {"\u201C"}{testimonial.text}{"\u201D"}
        </blockquote>

        <footer className="testimonial-card__footer">
          <div className="testimonial-card__avatar-wrapper">
            <div
              className="testimonial-card__avatar"
              style={{ background: getAvatarColor(testimonial.name) }}
              aria-hidden="true"
            >
              {getInitials(testimonial.name)}
            </div>
            {testimonial.verified && (
              <span className="testimonial-card__verified" aria-label="Verified purchase">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
            )}
          </div>

          <div className="testimonial-card__info">
            <cite className="testimonial-card__name">{testimonial.name}</cite>
            <div className="testimonial-card__meta">
              <span className="testimonial-card__location">{testimonial.location}</span>
              <span className="testimonial-card__divider" aria-hidden="true">{"\u00B7"}</span>
              <span className="testimonial-card__role">{testimonial.role}</span>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );

  if (isMobile) {
    return (
      <section className="testimonials-section testimonials-section--mobile" aria-label="Customer testimonials">
        <div className="testimonials__container">
          <header className="testimonials__header">
            <p className="testimonials__eyebrow">Testimonials</p>
            <h2 className="testimonials__title">Loved by our community</h2>
          </header>

          <div
            className="testimonials__track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {TESTIMONIALS.map((testimonial, i) => renderCard(testimonial, i))}
          </div>

          <div className="testimonials__dots" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                className={`testimonials__dot ${index === activeIndex ? "is-active" : ""}`}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === activeIndex ? "true" : "false"}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="testimonials-section" aria-label="Customer testimonials">
      <div className="testimonials__container">
        <header className="testimonials__header">
          <p className="testimonials__eyebrow">Testimonials</p>
          <h2 className="testimonials__title">Loved by our community</h2>
        </header>

        <div className="testimonials__track-wrapper">
          <div
            className="testimonials__track"
            style={{ "--loop-duration": `${LOOP_DURATION}s` }}
          >
            {TESTIMONIALS.map((testimonial, i) => renderCard(testimonial, i))}

            {/* Duplicate set for seamless loop */}
            {TESTIMONIALS.map((testimonial, i) => renderCard(testimonial, `dup-${i}`))}
          </div>
        </div>
      </div>
    </section>
  );
}
