"use client";

import { useRef } from "react";
import Image from "next/image";

import "./intro.css";
import useIntroTimeline from "./useIntroTimeline";
import BackgroundWardrobe from "./BackgroundWardrobe";
import GoldParticles from "./GoldParticles";
import EnterButton from "./EnterButton";

export default function Intro({ onFinish }) {
  const root = useRef(null);
  const impactRef = useRef(null);
  const trailRef = useRef(null);

  const { playExit } = useIntroTimeline(root, {
    impactRef,
    trailRef,
    onFinish,
  });

  return (
    <section className="intro" ref={root} aria-label="Beyond Buttons introduction">
      <div className="intro-camera">
        <BackgroundWardrobe />

        <div className="intro-black-screen" aria-hidden="true" />

        <div className="intro-impact-glow" aria-hidden="true" />

        <GoldParticles ref={impactRef} mode="impact" />
        <GoldParticles ref={trailRef} mode="trail" />

        <div className="intro-content">
          <Image
            src="/images/logo.png"
            alt="Beyond Buttons"
            width={280}
            height={120}
            priority
            className="intro-logo"
          />

          <div className="intro-copy">
            <h2 className="intro-copy__line intro-copy__line--tag">
              THE WORLD&apos;S ONLY BRAND
            </h2>
            <h2 className="intro-copy__line intro-copy__line--accent">
              BUILT FOR ONE THING
            </h2>
            <h1 className="intro-copy__title">THE PERFECT SOLID SHIRT</h1>
            <p className="intro-copy__subtitle">Enter the world of solids.</p>
          </div>

          <EnterButton onClick={playExit} />
        </div>

        <div className="intro-b-wrap">
          <Image
            src="/images/B.png"
            alt=""
            width={320}
            height={320}
            priority
            className="intro-b-mark"
            aria-hidden="true"
          />
          <div className="intro-b-shine" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
