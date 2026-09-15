"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import ProjectCard from "@/app/components/ProjectCard";
import CategoryFilters from "@/app/components/CategoryFilters";
import CheckButton from "@/app/components/CheckButton";
import FilterOverlay from "@/app/components/FilterOverlay";
import { getFilterDoneMs, getPostLoadFilterDoneMs } from "@/lib/navTiming";
import { getCategoryLabel } from "@/lib/categories";
import LandningBlock from "@/app/components/LandningBlock";
import TypedHeading from "@/app/components/TypedHeading";
import BottomNav from "@/app/components/BottomNav";
import Footer from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";

export default function AllProjectsPageClient() {
  const { items, categories } = useWork();
  const {
    showGrid,
    showList,
    activeFilter,
    search,
    notifyContentDone,
    setOpenedCard,
    numCols,
    navLoading,
  } = useUI();

  // Coming back from a project: drop the opened card so its tile isn't still
  // showing the centred hand-off label.
  useEffect(() => {
    setOpenedCard(null);
  }, [setOpenedCard]);

  // The filters master switch — owned here (rather than inside
  // CategoryFilters) so its mobile toggle can sit in this row, alongside the
  // "projects" label, instead of down in CategoryFilters' own drawer. Starts
  // closed — matching the mobile drawer's collapsed state — then opens itself
  // once on desktop, where CategoryFilters is a static sidebar rather than a
  // drawer someone has to pull out. The breakpoint can't be known at render
  // time (SSR has no viewport), so this only runs after mount and only sets
  // the initial default; it doesn't fight a later manual close.
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setShowFilters(true);
    }
  }, []);

  // Mobile filters toggle — pinned to the viewport once mounted, so it stays
  // reachable while the page scrolls, but at the exact spot it already
  // renders at in the "projects" label row. Measured once on mount (its
  // natural in-flow position) rather than hard-coded, since that position
  // depends on the surrounding layout.
  const filtersButtonRef = useRef<HTMLDivElement>(null);
  const [filtersButtonPos, setFiltersButtonPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const rect = filtersButtonRef.current?.getBoundingClientRect();
    if (rect) setFiltersButtonPos({ top: rect.top, left: rect.left });
  }, []);

  // The list waits for the category column to finish typing itself in, so the
  // two don't animate over each other.
  const [listVisible, setListVisible] = useState(false);
  const listRevealedRef = useRef(false);
  useEffect(() => {
    const delay = listRevealedRef.current
      ? getFilterDoneMs(categories)
      : getPostLoadFilterDoneMs(categories);
    const t = setTimeout(() => {
      listRevealedRef.current = true;
      setListVisible(true);
      notifyContentDone();
    }, delay);
    return () => clearTimeout(t);
  }, [categories, notifyContentDone]);

  const query = search.toLowerCase().trim();
  const slugsSeen = new Set<string>();
  const displayed = (
    activeFilter === "all"
      ? items.filter((i) => i.isPrimary)
      : items.filter((i) => i.categories.includes(activeFilter))
  )
    .filter((i) => {
      if (slugsSeen.has(i.slug)) return false;
      slugsSeen.add(i.slug);
      return true;
    })
    .filter((i) => {
      if (!query) return true;
      return (
        i.title.toLowerCase().includes(query) ||
        (i.client ?? "").toLowerCase().includes(query) ||
        i.categories.some((c) =>
          getCategoryLabel(c).toLowerCase().includes(query),
        )
      );
    })
    .sort((a, b) => {
      const labelA = (a.client ?? a.title).toLowerCase();
      const labelB = (b.client ?? b.title).toLowerCase();
      return labelA.localeCompare(labelB, "sv");
    });

  // List view is client names only, so one row per client — the row links to
  // that client's first project.
  type ClientRow = {
    key: string;
    label: string;
    slug: string;
    url: string;
    alt: string;
  };
  const clients: ClientRow[] = [];
  const seenClients = new Set<string>();
  for (const item of displayed) {
    const key = item.client ?? item.slug;
    if (seenClients.has(key)) continue;
    seenClients.add(key);
    clients.push({
      key,
      label: item.client ?? item.title,
      slug: item.slug,
      url: item.url,
      alt: item.alt,
    });
  }

  return (
    <div
      id="projects"
      className="relative   w-full px-0 lg:px-0 mt-[calc(25vh-1rem)]  lg:mt-[calc(25vh-1rem)] lg:pt-0   "
    >
      <LandningBlock
        label="projects"
        // z-40 — above CategoryFilters' z-30 drawer — so this row, and the
        // mobile filters toggle riding in it, stay visible and clickable
        // once the drawer opens and covers the rest of the screen.
        className="h-auto    content-center relative z-40 "
        labelClassName="col-span-2 lg:col-start-1 lg:col-span-12 lg:row-start-2 w-full"
        contentClassName="col-start-3 col-span-1 lg:col-start-4 lg:col-span-9 lg:row-start-2 lowercase w-full"
      >
        <TypedHeading
          ready={!navLoading}
          text="welcome to the archive"
          className=" text-left hidden lg:flex  h2Text px-6 font-thin text-primary mb-3"
        />
        {/* Mobile only — shares the "projects" label's row/baseline instead
            of CategoryFilters' own bottom-right tab. Desktop keeps that
            tab as-is. Fixed to the viewport (at the same spot it renders in)
            once mounted, so it stays reachable while the page scrolls. */}
        <div
          ref={filtersButtonRef}
          style={filtersButtonPos ?? undefined}
          className={cn("lg:hidden", filtersButtonPos && "fixed z-40")}
        >
          <CheckButton
            label={showFilters ? "close" : "filters"}
            size="lg"
            active
            className="whitespace-nowrap"
            onClick={() => setShowFilters((v) => !v)}
          />
        </div>
      </LandningBlock>
      <FilterOverlay />

      {/* Desktop: category sidebar left, projects right. */}
      <div className=" mt-12 mb-6 lg:mb-3 grid grid-cols-3 lg:grid-cols-12 ">
        <CategoryFilters
          className=""
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {listVisible && showList && (
          <div className="col-start-1 col-span-8 hidden w-full lg:flex flex-col  justify-start items-start px-6  gap-3 mt-0 mb-12 ">
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
                    className=" transition-all h2Text text-primary text-center lowercase w-full hover:text-secondary  leading-[0.9] hover:bg-transparent"
                  >
                    {client.label}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {listVisible && showGrid && (
          <div
            className="col-start-1 col-span-4 lg:col-start-1 lg:col-span-12 hidden w-full mt-3  lg:grid gap-x-3 gap-y-6 px-3 lg:px-3"
            style={{
              gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {displayed.map((item, idx) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.07, 0.7),
                    ease: "easeOut",
                  }}
                  // Separators only, no outer frame: a rule above every row
                  // after the first, and left of every column after the first.
                >
                  <ProjectCard
                    item={item}
                    sizes={`${Math.round(75 / numCols)}vw`}
                    className="lg:mb-0"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile: the grid or the client list. The category button that heads
          this section lives in the grid above so it can sit in column two. */}
      <div className="flex w-full flex-col px-6 lg:hidden">
        {listVisible && showGrid && (
          <div className="flex flex-col w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {displayed.map((item) => (
                <motion.div key={item.key} layout exit={{ opacity: 0 }}>
                  <ProjectCard item={item} sizes="100vw" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {listVisible && showList && (
          <div className="grid grid-cols-3 lg:grid-cols-12 w-full">
            <AnimatePresence mode="popLayout">
              {clients.map((client, idx) => (
                <motion.div
                  key={client.key}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.07 }}
                  className="col-start-2 lg:col-start-2 col-span-2 lg:col-span-10"
                >
                  <Link
                    href={`/projects/${client.slug}`}
                    className=" text-primary hover:text-secondary transition-all h2Text duration-150"
                  >
                    {client.label}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Reveal className="w-full mb-12">
        <BottomNav />
      </Reveal>

      <Footer />
    </div>
  );
}
