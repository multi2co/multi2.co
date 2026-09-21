"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import { useSound } from "@/context/SoundContext";
import Link from "next/link";
import AboutSectionText from "./components/AboutSectionText";
import BottomNav from "./components/BottomNav";
import CheckButton from "./components/CheckButton";
import ConnectSection from "./components/ConnectSection";
import FeaturedCard from "./components/FeaturedCard";
import { Reveal } from "./components/Reveal";
import ShowReel from "./components/ShowReel";
import Image from "next/image";

import Footer from "./components/Footer";

/** The standing mobile "sound on/off" toggle in the hero corner — off for now. */
const SHOW_MOBILE_SOUND = false;

function HomeClientInner({
  reelUrl,
}: {
  reelUrl?: string;
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

  // One row per client, alphabetised — each links to that client's first
  // project. Mirrors the dedupe in AllProjectsPageClient's list view.
  const clients = useMemo(() => {
    type ClientEntry = { key: string; label: string; slug: string };
    const seen = new Set<string>();
    const list: ClientEntry[] = [];
    for (const item of items) {
      if (!item.isPrimary) continue;
      const key = item.client ?? item.slug;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ key, label: item.client ?? item.title, slug: item.slug });
    }
    return list.sort((a, b) => a.label.localeCompare(b.label, "sv"));
  }, [items]);

  return (
    <div className="w-full bg-background    mt-16 ">
      {/* One gutter for the whole page: px-3 on mobile, px-6 from lg up. */}
      <div className=" px-3 lg:px-6 w-full">
        <Reveal
          pixelCorners
          sticky
          className="w-full aspect-[9/16] lg:aspect-video bg-secondary relative h-[calc(100vh-5rem)] lg:h-[calc(100vh-5.5rem)]"
        >
          <ShowReel
            className="absolute inset-0 h-full w-full aspect-[9/16] lg:aspect-video p-0"
            src={reelUrl}
          />
          {/* Light scrim so the thin heading stays legible over the footage. */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xl " />
          {/* The hero has no label, so its wordmark keeps the full twelve
                columns rather than starting at four. */}
          <h2 className="absolute inset-0 z-10 flex items-center  justify-center px-3 lg:px-12 text-center text-6xl lg:text-[10rem] font-visual font-thin max-w-sm lg:max-w-full lg:whitespace-nowrap tracking-normal lowercase lg:tracking-tight rotate-90 lg:rotate-0 text-primary">
            multisquared
          </h2>
        </Reveal>
      </div>
      <Reveal className="col-span-3 lg:col-span-12 bg-background px-3 pt-12  ">
        <AboutSectionText
          columns
          label="our story"
          className="pb-6   w-full
              "
        />
      </Reveal>

      {/* Selected projects: one card per row, full width, stacked
            vertically and scrolling with the rest of the page. */}
      <Reveal className="relative grid grid-cols-3 lg:grid-cols-12 bg-background p-0  w-full px-3 pt-12 ">
        <CheckButton
          label="selected projects"
          href="/projects"
          size="lg"
          color="text-primary"
          active
          className="col-span-3 lg:col-span-12 whitespace-nowrap"
        />
        <div className="col-span-3 lg:col-span-12  flex flex-col gap-3 lg:gap-6 mt-3 px-3">
          {featuredProjects.map((project) => (
            <FeaturedCard key={project.key} project={project} className="" />
          ))}
        </div>
      </Reveal>
      <CheckButton
        size="xl"
        label="see all projects"
        active
        color="text-primary"
        className="col-start-4 col-span-4 my-12 lg:my-12 lg:ml-3"
      />
      <div className="w-full px-3 lg:px-6">
        <Reveal
          sticky
          className="min-h-dvh  relative w-full gap-3 p-3  grid-cols-3 lg:grid-cols-12 grid bg-secondary pixelCorners mb-6 "
        >
          <span className="col-span-3">
            <CheckButton
              label="our clients"
              href="/projects"
              size="lg"
              color="text-primary"
              active
            />
          </span>
          <div className=" flex flex-col items-start justify-start text-secondary col-start-1 col-span-3 px-6 lg:px-0 pb-6 lg:pb-0 lg:col-start-4 lg:col-span-8 gap-y-2 lg:gap-y-4 pt-6 lg:pt-12">
            <AnimatePresence mode="popLayout">
              {clients.map((client, idx) => (
                <motion.div
                  key={client.key}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.07 }}
                  className="w-full"
                >
                  <Link
                    href={`/projects/${client.slug}`}
                    className=" transition-all text-3xl lg:text-5xl font-visual font-thin  text-primary text-right lg:text-left lowercase w-full hover:text-secondary  hover:bg-transparent"
                  >
                    {client.label}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
      {/* One dark zone (bg-primary) spanning Connect through BottomNav —
            `#connect-zone` is the anchor M2Nav watches to swap its own text
            from primary to secondary while it's scrolled over this stretch,
            back to primary once Footer (bg-secondary) covers it — see the
            two-observer note in M2Nav. Sticky like everything above it, so
            it stacks in turn. */}
      <div className="px-3 lg:px-6 w-full">
        <div id="connect-zone" className="sticky top-16 pixelCorners">
          <ConnectSection className=" p-3" />

          <Reveal className="w-full pb-6 bg-primary ">
            <BottomNav />
          </Reveal>
        </div>
      </div>
      <Reveal className=" mt-12  mb-0 pb-0" id="footer-section" sticky>
        <Footer />
      </Reveal>
    </div>
  );
}

export default function HomeClient({ reelUrl }: { reelUrl?: string }) {
  return <HomeClientInner reelUrl={reelUrl} />;
}
