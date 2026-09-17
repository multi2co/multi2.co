"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
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
    sortMode,
  } = useUI();

  // Which clients (with more than one project) currently have their other
  // projects revealed in the grid — toggled by clicking that client's name on
  // its primary card. Page-local: nothing outside /projects needs to know.
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(),
  );
  function toggleClient(client: string) {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(client)) {
        next.delete(client);
      } else {
        next.add(client);
      }
      return next;
    });
  }

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
      if (sortMode === "year") {
        const yearDiff = (b.year ?? 0) - (a.year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        // Same year — latest added first.
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
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

  // Grid view: a client with several projects shows just its first one, with
  // the rest tucked away until that card's client name is clicked. Revealed
  // siblings are spliced in right after the primary card, captioned with both
  // client and title (ProjectCard's "captionBelow") instead of client only.
  type GridEntry = {
    item: (typeof displayed)[number];
    captionBelow: boolean;
    onClientClick?: () => void;
  };
  const clientCounts = new Map<string, number>();
  for (const item of displayed) {
    if (!item.client) continue;
    clientCounts.set(item.client, (clientCounts.get(item.client) ?? 0) + 1);
  }
  const gridClientsSeen = new Set<string>();
  const gridEntries: GridEntry[] = [];
  for (const item of displayed) {
    const count = item.client ? (clientCounts.get(item.client) ?? 1) : 1;
    if (!item.client || count <= 1) {
      gridEntries.push({ item, captionBelow: false });
      continue;
    }
    if (gridClientsSeen.has(item.client)) continue;
    gridClientsSeen.add(item.client);
    const client = item.client;
    gridEntries.push({
      item,
      captionBelow: false,
      onClientClick: () => toggleClient(client),
    });
    if (expandedClients.has(client)) {
      for (const sibling of displayed) {
        if (sibling === item || sibling.client !== client) continue;
        gridEntries.push({ item: sibling, captionBelow: true });
      }
    }
  }

  return (
    <div
      id="projects"
      className="relative   w-full px-0 lg:px-0 mt-[calc(25vh-1rem)]  lg:mt-48 lg:pt-0   "
    >
      {/* Grid/list, moved above the heading. On desktop, CategoryFilters
          rides alongside as a sticky column at col 9-12 instead of its own
          full-width section, so the two are grid siblings here. */}
      <div className=" mb-6 lg:mb-3 grid grid-cols-3 lg:grid-cols-12 ">
        {/* This wrapper is the actual grid item, left to stretch (the grid
            default) to the row's full height — that's the tall "containing
            block" position:sticky needs room to travel within. CategoryFilters
            itself is what's sticky, nested one level in: if the sticky
            element and the stretched grid cell were the same node, its own
            box would already fill the whole row and there'd be nothing left
            to stick within. */}
        <div className="lg:col-start-1 lg:col-span-4">
          <CategoryFilters
            className="lg:sticky lg:top-10"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        </div>
        {listVisible && showList && (
          <Reveal className="col-start-4 col-span-8 hidden w-full lg:flex flex-col  justify-start items-start px-6  gap-3 mt-0 mb-12 ">
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
          </Reveal>
        )}

        {listVisible && showGrid && (
          <Reveal className="col-start-1 col-span-4 lg:col-start-5 lg:col-span-8 hidden w-full lg:block">
            <div
              className="mt-3 grid gap-x-3 gap-y-3 px-3 lg:px-3"
              style={{
                gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
              }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {gridEntries.map(
                  ({ item, captionBelow, onClientClick }, idx) => (
                    <motion.div
                      key={item.key}
                      layout
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
                        captionBelow={captionBelow}
                        onClientClick={onClientClick}
                        clientExpanded={
                          onClientClick && item.client
                            ? expandedClients.has(item.client)
                            : undefined
                        }
                      />
                    </motion.div>
                  ),
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        )}
      </div>

      {/* Mobile: the grid or the client list. */}
      <div className="flex w-full flex-col px-6 lg:hidden">
        {listVisible && showGrid && (
          <Reveal className="flex flex-col w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {gridEntries.map(({ item, captionBelow, onClientClick }) => (
                <motion.div key={item.key} layout exit={{ opacity: 0 }}>
                  <ProjectCard
                    item={item}
                    sizes="100vw"
                    captionBelow={captionBelow}
                    onClientClick={onClientClick}
                    clientExpanded={
                      onClientClick && item.client
                        ? expandedClients.has(item.client)
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </Reveal>
        )}

        {listVisible && showList && (
          <Reveal className="grid grid-cols-3 lg:grid-cols-12 w-full">
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
          </Reveal>
        )}
      </div>

      {/* Below the grid/list row, so it reveals slightly after it — part of
          the same top-to-bottom cascade. */}
      <Reveal delay={0.15}>
        <LandningBlock
          label="projects"
          // z-40 — above CategoryFilters' z-30 drawer — so this row stays
          // visible and clickable once the drawer opens and covers the rest
          // of the screen.
          className="hidden h-auto    content-center relative z-40 "
          labelClassName="col-span-2 lg:col-start-1 lg:col-span-12 lg:row-start-2 w-full"
          contentClassName="col-start-3 col-span-1 lg:col-start-4 lg:col-span-9 lg:row-start-2 lowercase w-full"
        >
          <TypedHeading
            ready={!navLoading}
            text="welcome to the archive"
            className=" text-left hidden lg:flex  h2Text px-6 font-thin text-primary mb-3"
          />
        </LandningBlock>
      </Reveal>
      {/* Mobile only — fixed to the bottom of the viewport, in the same
          3-column grid M2Nav's top bar uses, so this sits in col 3 directly
          below that bar's mobile sound toggle. One button does both jobs
          (open and close) via its label/state, rather than a separate close
          control. A sibling of LandningBlock rather than nested in it, so it
          stays reachable regardless of that block's own visibility. */}
      <div className="fixed bottom-3 left-0 z-40 grid w-full grid-cols-3 gap-x-0 px-0 lg:hidden">
        <div className="col-start-3 flex justify-start">
          <CheckButton
            label={showFilters ? "close" : "filters"}
            size="lg"
            active
            className="whitespace-nowrap"
            onClick={() => setShowFilters((v) => !v)}
          />
        </div>
      </div>
      <FilterOverlay />

      <Reveal className="w-full mb-12">
        <BottomNav />
      </Reveal>

      <Footer />
    </div>
  );
}
