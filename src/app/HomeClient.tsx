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

import Footer from "./components/Footer";

/** The "multisquared" wordmark over the hero reel — off for now. */
const SHOW_HERO_WORDMARK = false;

function HomeClientInner({ reelUrl }: { reelUrl?: string }) {
  const { items } = useWork();
  const { notifyContentDone, notifyHeroOpen } = useUI();
  const reduceMotion = useReducedMotion();

  // With reduced motion the reel doesn't slide in, so there's nothing for the
  // nav to wait on.
  useEffect(() => {
    if (reduceMotion) notifyHeroOpen();
  }, [reduceMotion, notifyHeroOpen]);

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
    <div className="w-full bg-background">
      {/* The showreel fills the viewport edge to edge on every width. */}
      <div className="relative w-screen">
        {/* Not Reveal: this is the first thing on screen, so it must be
            visible from the server HTML rather than waiting for JS to fade it
            in. Full screen on all widths. On load it rises a little into place — a
            transform only, never hidden — and once it's there M2Nav reveals
            its links (see `heroOpen`). `z-[80]` keeps it under the fixed nav
            (z-90) so the nav stays visible on top of the reel. */}
        <motion.div
          initial={reduceMotion ? false : { y: 48 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={notifyHeroOpen}
          className="sticky top-0 z-[80] h-screen w-screen bg-secondary"
        >
          <div className=" relative overflow-hidden w-full h-full">
            <ShowReel
              className="absolute inset-0 h-full w-full"
              src={reelUrl}
            />
            {/* Light scrim so the thin heading stays legible over the footage. */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xl " />
            {/* Mobile: the wordmark sits inside the box. */}
            {SHOW_HERO_WORDMARK && (
              <HeroWordmark className="lg:hidden absolute inset-0 z-10 flex items-center justify-center px-3 text-center text-6xl font-visual font-thin tracking-normal lowercase rotate-90 text-primary" />
            )}
          </div>
        </motion.div>
        {/* Desktop: the wordmark is centred on the whole first viewport, not
            just the box. */}
        {SHOW_HERO_WORDMARK && (
          <HeroWordmark className="hidden lg:flex pointer-events-none absolute inset-x-0 top-0 z-10 h-screen items-center justify-center px-12 whitespace-nowrap text-[10rem] font-visual font-thin lowercase tracking-tight text-primary" />
        )}
      </div>
      <Reveal className="col-span-3 lg:col-span-12 bg-background px-6 lg:px-3 pt-12  ">
        <AboutSectionText
          columns
          label="our concept"
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
        <div className="col-span-3 lg:col-span-12 flex flex-col gap-y-16 lg:gap-y-30 mt-3 px-3">
          {/* In each card the text pins below the nav and the card's media
              scrolls up over it — see FeaturedCard. */}
          {featuredProjects.map((project) => (
            <FeaturedCard key={project.key} project={project} />
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
          className="min-h-dvh  relative w-full gap-3 p-3  grid-cols-3 lg:grid-cols-12 grid bg-secondary pixelCorners mb-16 lg:mb-30"
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
            {/* Each name reveals on its own as it scrolls into view, so the
                list fills in one by one as the card rises. */}
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
                  className=" transition-all text-3xl lg:text-5xl font-visual font-thin  text-primary text-right lg:text-left lowercase w-full hover:text-secondary  hover:bg-transparent"
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
      {/* Non-sticky anchor for M2Nav's "connect" button — the zone below is
          sticky, so its own position can't be measured once it's stuck. */}
      <div id="connect" aria-hidden />
      <div className="px-3 lg:px-6 w-full">
        <div id="connect-zone" className="sticky top-16 pixelCorners">
          <ConnectSection className=" p-3">
            <BottomNav />
          </ConnectSection>
        </div>
      </div>
      <Reveal className="mt-16 lg:mt-30 mb-0 pb-0" id="footer-section" sticky>
        <Footer />
      </Reveal>
    </div>
  );
}

export default function HomeClient({ reelUrl }: { reelUrl?: string }) {
  return <HomeClientInner reelUrl={reelUrl} />;
}
