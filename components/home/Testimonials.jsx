"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

if (typeof window !== "undefined") {
  gsap.registerPlugin();
}

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Mumbai",
    role: "Creative Director",
    text: "Beyond Buttons has completely changed how I think about everyday dressing. The Cloud White shirt is the first piece in years that fits perfectly off the rack — no tailoring needed. The fabric weight, the collar roll, the way it drapes... it's evident that every decision was intentional.",
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    name: "Rohit Malhotra",
    location: "Delhi",
    role: "Founder, Tech Startup",
    text: "I've bought three shirts now — Navy, Olive, and Charcoal. They've become my uniform for investor meetings and long travel days. The fabric doesn't wrinkle, the collar holds its shape, and I genuinely feel more put-together without trying. This is what 'quiet luxury' should mean.",
    rating: 5,
    verified: true,
  },
  {
    id: 3,
    name: "Ananya Iyer",
    location: "Bangalore",
    role: "Architect",
    text: "Finally, a brand that understands proportions for Indian bodies. The sleeve length, the shoulder width, the torso length — it's like they were made for me. The Maroon Boxy shirt gets compliments every time I wear it. Quality you can feel in the stitching and the hand-feel of the cotton.",
    rating: 5,
    verified: true,
  },
  {
    id: 4,
    name: "Karan Mehta",
    location: "Pune",
    role: "Photographer",
    text: "The Cream Relaxed Cargo pants paired with the Boxy shirt — best fit combo I own. Wore them for a 12-hour shoot day and zero discomfort. The fabric breathes, the pockets are actually usable, and they look better after washing. Beyond Buttons gets the 'lived-in' aesthetic right.",
    rating: 5,
    verified: true,
  },
  {
    id: 5,
    name: "Sneha Reddy",
    location: "Hyderabad",
    role: "Product Designer",
    text: "Ordered online, hesitated on sizing — their guide was spot on. The package arrived in beautiful minimal packaging, handwritten note included. That level of care in the unboxing experience tells you everything about the brand. The shirt itself? Impeccable. Will be a repeat customer.",
    rating: 5,
    verified: true,
  },
  {
    id: 6,
    name: "Arjun Patel",
    location: "Ahmedabad",
    role: "Business Owner",
    text: "Been wearing the Solid White for client meetings all month. Zero see-through issues, collar stays crisp through humid days, and the hidden placket gives that clean architectural line I prefer. It's rare to find basics this well-engineered at this price point.",
    rating: 5,
    verified: true,
  },
];

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  // Generate a consistent color based on name for variety
  const colors = [
    "linear-gradient(135deg, var(--gold), var(--goldLight))",
    "linear-gradient(135deg, var(--goldLight), #f5e6a0)",
    "linear-gradient(135deg, #c9a96e, var(--gold))",
    "linear-gradient(135deg, #b8965c, #c9a96e)",
    "linear-gradient(135deg, #a6834a, #b8965c)",
    "linear-gradient(135deg, #94703a, #a6834a)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Testimonials() {
  const trackRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const cardsToShow = 3;
  const totalCards = TESTIMONIALS.length;
  const cardWidth = 100 / cardsToShow;

  // Duplicate cards for infinite loop effect
  const duplicated = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];
  const startOffset = totalCards; // Start from the middle set

  // Calculate transform based on currentIndex
  const getTransform = () => {
    const offset = (startOffset + currentIndex) * cardWidth;
    return `translateX(-${offset}%)`;
  };

  // Auto-slide logic
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, totalCards]);

  // GSAP entrance animation
  useEffect(() => {
    const section = trackRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from(".testimonial-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="testimonials-section" ref={trackRef} aria-label="Customer testimonials">
      <div className="testimonials__container">
        <header className="testimonials__header">
          <p className="testimonials__eyebrow">Trusted by thousands</p>
          <h2 className="testimonials__title">What our community says</h2>
          <p className="testimonials__subtitle">
            Real experiences from people who made the switch to fewer, better.
          </p>
        </header>

        <div
          className="testimonials__track-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="testimonials__track"
            style={{
              transform: getTransform(),
              display: "flex",
              width: `${duplicated.length * cardWidth}%`,
              transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {duplicated.map((testimonial, index) => (
              <article
                key={`${testimonial.id}-${index}`}
                className="testimonial-card"
                style={{ width: `${cardWidth}%`, flexShrink: 0 }}
              >
                <div className="testimonial-card__inner">
                  <div className="testimonial-card__rating" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="testimonial-card__star" aria-hidden="true">★</span>
                    ))}
                  </div>

                  <blockquote className="testimonial-card__quote">
                    &ldquo;{testimonial.text}&rdquo;
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
                        <span className="testimonial-card__divider" aria-hidden="true">·</span>
                        <span className="testimonial-card__role">{testimonial.role}</span>
                      </div>
                    </div>
                  </footer>
                </div>
              </article>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            className="testimonials__nav testimonials__nav--prev"
            aria-label="Previous testimonial"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            className="testimonials__nav testimonials__nav--next"
            aria-label="Next testimonial"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % totalCards)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="testimonials__dots" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                className={`testimonials__dot ${index === currentIndex ? "is-active" : ""}`}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}