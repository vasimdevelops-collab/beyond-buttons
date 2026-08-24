"use client";

import { startTransition, useEffect, useState } from "react";

import Intro from "@/components/intro/Intro";
import Navbar from "@/components/layout/Navbar";
import SiteFooter from "@/components/layout/SiteFooter";
import Hero from "@/components/home/Hero";
import Products from "@/components/home/Products";
import BrandStory from "@/components/home/BrandStory";
import VisionMission from "@/components/home/VisionMission";
import WhyBeyond from "@/components/home/WhyBeyond";
import "@/components/home/sections.css";
import "@/components/home/brand-story.css";
import "@/components/home/vision-mission.css";

const INTRO_SESSION_KEY = "bb-intro-complete";

function HomeShell() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Products />
        <BrandStory />
        <VisionMission />
        <WhyBeyond
          media={{
            type: "image",
            src: "/images/images%20(5).jfif",
            alt: "Beyond Buttons — editorial presence",
            caption: "The Beyond Standard",
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}

export default function Home() {
  // pending → avoids SSR/client hydration mismatch while we read sessionStorage
  const [boot, setBoot] = useState({ ready: false, showIntro: false });

  useEffect(() => {
    let showIntro = true;

    try {
      const nav = performance.getEntriesByType("navigation")[0];
      // Full refresh should replay the intro; client navigations keep the session flag.
      if (nav?.type === "reload") {
        sessionStorage.removeItem(INTRO_SESSION_KEY);
      }
      showIntro = sessionStorage.getItem(INTRO_SESSION_KEY) !== "1";
    } catch {
      showIntro = true;
    }

    startTransition(() => {
      setBoot({ ready: true, showIntro });
    });
  }, []);

  const finishIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // private mode — still continue into the site for this view
    }
    setBoot({ ready: true, showIntro: false });
  };

  if (!boot.ready) {
    return (
      <div
        className="app-boot"
        aria-hidden="true"
        style={{ minHeight: "100vh", background: "var(--color-bg)" }}
      />
    );
  }

  if (boot.showIntro) {
    return <Intro onFinish={finishIntro} />;
  }

  return <HomeShell />;
}
