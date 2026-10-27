"use client";

import React, { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import Link from "next/link";
import AboutSectionText from "./components/AboutSectionText";
import BottomNav from "./components/BottomNav";
import CheckButton from "./components/CheckButton";
import ConnectSection from "./components/ConnectSection";
import FeaturedCard from "./components/FeaturedCard";
import { Reveal } from "./components/Reveal";
import ShowReel from "./components/ShowReel";
import HeroWordmark from "./components/HeroWordmark";
import { useSiteSettings } from "@/context/SiteSettingsContext";

import Footer from "./components/Footer";

function HomeClientInner({ reelUrl }: { reelUrl?: string }) {
  const { items } = useWork();
  const { notifyContentDone, notifyHeroOpen } = useUI();
  const reduceMotion = useReducedMotion();
  // The "multisquared" wordmark over the reel — a Site Settings switch.
  const { showHeroWordmark } = useSiteSettings();

  // The reel is static and on screen from the first paint, so the nav has
  // nothing to wait on — let it bring its links in straight away.
  useEffect(() => {
    notifyHeroOpen();
  }, [notifyHeroOpen]);

  // Everything on the page is server-rendered, so it's ready once mounted.
  useEffect(() => {
    notifyContentDone();
  }, [notifyContentDone]);

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
    // One vertical rhythm for the whole page: every section is a direct child
    // here, spaced by this gap alone — no margins of their own.
    <div className="w-full flex flex-col gap-y-12">
      <div className="relative w-screen">
        <div className="sticky top-0 z-[80] h-screen w-screen bg-secondary">
          <div className=" relative overflow-hidden w-full h-full">
            <ShowReel
              className="absolute inset-0 h-full w-full"
              src={reelUrl}
            />
            {/* The wordmark sits inside the reel box at every width, so it's
                always above the full-screen video (which is z-[80]) and
                rides along with it. Mobile turns it on its side. */}
            {showHeroWordmark && (
              <>
                <HeroWordmark className="lg:hidden absolute inset-0 z-10 flex items-center justify-center px-3 text-center text-6xl font-visual font-thin tracking-normal lowercase rotate-90 text-primary" />
                <HeroWordmark className="hidden lg:flex pointer-events-none absolute inset-0 z-10 items-center justify-center px-12 whitespace-nowrap text-[10rem] font-visual font-thin lowercase tracking-tight text-primary" />
              </>
            )}
          </div>
        </div>
      </div>
      <Reveal className="col-span-3 lg:col-span-12 px-0 lg:px-3">
        <AboutSectionText columns label="our concept" className="px-0 w-full" />
      </Reveal>

      {/* Selected projects: one card per row, full width, stacked
            vertically and scrolling with the rest of the page — with its
            "see all projects" link closing the same section. */}
      <div className="flex flex-col gap-y-6">
        <Reveal className="relative grid grid-cols-3 lg:grid-cols-12 gap-y-3 px-0 lg:px-3 w-full">
          <CheckButton
            label="selected projects"
            href="/projects"
            size="lg"
            color="text-primary"
            active
            className="hidden col-span-3 lg:col-span-12 whitespace-nowrap"
          />
          <div className="col-span-3 lg:col-span-12 flex flex-col gap-y-12 lg:mt-24 lg:mb-12 lg:gap-y-30 px-6 lg:px-0">
            {/* In each card the text pins below the nav and the card's media
              scrolls up over it — see FeaturedCard. */}
            {featuredProjects.map((project) => (
              <FeaturedCard key={project.key} project={project} />
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-3 lg:grid-cols-12 lg:px-3">
          <div className="col-span-3 lg:col-start-4 lg:col-span-4 lg:-ml-3">
            <CheckButton
              size="xl"
              label="see all projects"
              active
              color="text-primary"
            />
          </div>
        </div>
      </div>
      <div className="w-full px-3 lg:px-6">
        <Reveal
          sticky
          className="min-h-dvh  relative w-full gap-3 p-3  grid-cols-3 lg:grid-cols-12 grid bg-secondary pixel-corners-2"
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
          <div className=" flex flex-col items-start justify-start text-secondary col-start-1 col-span-3 px-6 lg:px-0 pb-6 lg:pb-0 lg:col-start-4 lg:col-span-8 gap-y-2 lg:gap-y-2 pt-6 lg:pt-12">
            {clients.map((client) => (
              <motion.div
                key={client.key}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <Link
                  href={`/projects/${client.slug}`}
                  className=" transition-all text-3xl lg:text-4xl font-visual font-thin  text-primary text-right lg:text-left lowercase w-full hover:text-secondary  hover:bg-transparent"
                >
                  {client.label}
                </Link>
              </motion.div>
            ))}
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
        {/* Non-sticky anchor for M2Nav's "connect" button — the zone below
            is sticky, so its own position can't be measured once it's stuck.
            Inside this wrapper so it doesn't count as a section in the gap. */}
        <div id="connect" aria-hidden />
        <div id="connect-zone" className="sticky top-16 pixel-corners-2">
          <ConnectSection className=" p-3">
            <BottomNav />
          </ConnectSection>
        </div>
      </div>
      <Reveal id="footer-section" sticky>
        <Footer />
      </Reveal>
    </div>
  );
}

export default function HomeClient({ reelUrl }: { reelUrl?: string }) {
  return <HomeClientInner reelUrl={reelUrl} />;
}
