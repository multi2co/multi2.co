"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import { useSound } from "@/context/SoundContext";
import Link from "next/link";
import AboutSectionText from "./components/AboutSectionText";
import BottomNav from "./components/BottomNav";
import CheckButton from "./components/CheckButton";
import ConnectSection, { type ContactData } from "./components/ConnectSection";
import FeaturedCard from "./components/FeaturedCard";
import LandningBlock from "./components/LandningBlock";
import { Reveal } from "./components/Reveal";
import ShowReel from "./components/ShowReel";

import Footer from "./components/Footer";

/** The standing mobile "sound on/off" toggle in the hero corner — off for now. */
const SHOW_MOBILE_SOUND = false;

function HomeClientInner({
  reelUrl,
  contact,
}: {
  reelUrl?: string;
  contact?: ContactData;
}) {
  const { items } = useWork();
  const { notifyContentDone } = useUI();
  const { muted, toggleMute, consentSettled } = useSound();

  const [revealed, setRevealed] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const hasRevealedRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (items.length === 0 || !timerDone || hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    setRevealed(true);
  }, [items.length, timerDone]);

  useEffect(() => {
    if (!revealed) return;
    notifyContentDone();
  }, [revealed, notifyContentDone]);

  // The landing page's selected-projects block: four works, featured first, in
  // a single four-column row on desktop. Editors pick those with the "Featured
  // on homepage" toggle in the CMS (workCardsQuery orders by year, so newest
  // featured leads); any remaining slots fill with the most recent non-featured
  // works so the row is always full.
  const featuredProjects = useMemo(() => {
    const primary = items.filter((i) => i.isPrimary);
    const picked = primary.filter((i) => i.featured);
    const filler = primary.filter((i) => !i.featured);
    return [...picked, ...filler].slice(0, 4);
  }, [items]);

  // The selected-projects strip pins on every width: the section is `scrollRange`
  // taller than the viewport, its inner wrapper is `sticky`, and the card row
  // translates left in step with the page scroll — a 1:1 mapping, so nothing is
  // left pinned once the row bottoms out. `scrollRange` is the row's own
  // horizontal overflow, measured from the strip.
  const projectsSectionRef = useRef<HTMLElement>(null);
  const projectsStripRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);

  useEffect(() => {
    const el = projectsStripRef.current;
    if (!el) return;
    const measure = () =>
      setScrollRange(Math.max(0, el.scrollWidth - el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [featuredProjects.length]);

  const { scrollYProgress } = useScroll({
    target: projectsSectionRef,
    offset: ["start start", "end end"],
  });
  const stripX = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);
  const trackScroll = scrollRange > 0;

  return (
    <div className="w-full bg-background  px-0 ">
      {/* One gutter for the whole page: px-3 on mobile, px-6 from lg up. */}
      <div className="relative flex  flex-col gap-y-0 w-full px-0 ">
        {/* Relative wrapper so the mobile sound toggle can anchor to the hero's
            bottom corner and scroll away with it, rather than sitting fixed
            over the whole page. Desktop keeps the nav's own Sound On control. */}
        <div className="relative h-screen">
          <LandningBlock
            className="h-screen content-center lg:grid-rows-3  "
            // Second row of the two-row hero grid; `self-end` pins the typed
            // heading to that row's bottom edge — the bottom of the viewport.
            contentClassName="col-span-3 lg:col-start-1 lg:col-span-12 lg:row-start-2 lg:justify-center w-full"
            // The showreel bleeds to the hero's edges. Same reel on every width
            // — ShowReel/ReelContext keep one player.
            background={
              <>
                <ShowReel className=" h-full" src={reelUrl} />
                {/* Light scrim so the thin heading stays legible over the
                    footage. */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
              </>
            }
          >
            {/* The hero has no label, so its wordmark keeps the full twelve
                columns rather than starting at four. */}
            <h2 className="max-w-sm lg:max-w-full px-3  pb-0 text-left h1Text min-w-0 lg:whitespace-nowrap tracking-normal lowercase lg:tracking-tight rotate-90 lg:rotate-0 text-primary">
              multisquared
            </h2>
          </LandningBlock>
          {/* Hero nav — every route but Home, in a 4-col row pinned to the
              bottom-left of the showreel block. Static (no reveal). */}

          {/* Mobile sound toggle — hidden for now; flip SHOW_MOBILE_SOUND to
              bring it back. */}
        </div>
        <Reveal className="col-span-3 lg:col-span-12 mt-48 ">
          <AboutSectionText
            columns
            label="our story"
            className="pb-6 lg:pb-12  w-full
              "
          />
        </Reveal>

        {/* Selected projects. The section is taller than the viewport and its
            inner wrapper is `sticky`: as the page scrolls through, the card row
            slides left in step, bringing the fifth "see all projects" card in
            without the reader touching the strip. Not wrapped in <Reveal> — a
            settling transform on the ancestor would fight the sticky
            positioning. */}

        <section
          ref={projectsSectionRef}
          className="relative bg-background"
          style={
            trackScroll
              ? { height: `calc(100vh + ${scrollRange}px)` }
              : undefined
          }
        >
          <div className="sticky top-8 flex h-screen flex-col justify-center overflow-hidden">
            <CheckButton label="selected projects" href="/projects" size="lg" />
            {/* The row is transform-driven, so its own overflow stays visible —
                the sticky wrapper above does the clipping. */}
            <div className="relative mt-0 lg:mt-0 w-full overflow-visible">
              <motion.div
                ref={projectsStripRef}
                style={trackScroll ? { x: stripX } : undefined}
                className="flex items-start gap-0 pl-3 pr-6 lg:pl-0 lg:pr-0 pb-6 mr-3"
              >
                {featuredProjects.map((project) => (
                  <FeaturedCard
                    key={project.key}
                    project={project}
                    captionBelow
                    className="shrink-0 w-[90vw] sm:w-[46vw] lg:w-[calc((100vw-15rem)/2)]"
                  />
                ))}

                {/* The fifth slot — same footprint as a card: square + caption. */}
                <Link
                  href="/projects"
                  className="group shrink-0 w-[90vw] sm:w-[46vw] lg:w-[calc((100vw-16rem)/2)] flex flex-col gap-0 lg:gap-0 mb-3 lg:mb-6 pl-3"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center transition-opacity pixelCorners bg-primary text-primary-foreground group-hover:opacity-90">
                    <span className="text-9xl lg:text-6xl font-thin font-visual leading-none">
                      ↗
                    </span>
                  </div>
                  <CheckButton
                    size="lg"
                    label="see all projects"
                    active
                    className="h4BtnText "
                  />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        <ConnectSection className="mt-3" contact={contact} />

        <Reveal className="w-full mb-6">
          <BottomNav />
        </Reveal>

        <Reveal>
          <Footer />
        </Reveal>
      </div>
    </div>
  );
}

export default function HomeClient({
  reelUrl,
  contact,
}: {
  reelUrl?: string;
  contact?: ContactData;
}) {
  return <HomeClientInner reelUrl={reelUrl} contact={contact} />;
}
