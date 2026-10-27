"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import CheckButton from "./CheckButton";
import SearchCheck from "./SearchCheck";
import { cycleCols } from "@/lib/gridZoom";
import { getFilterChipLabel, getVisibleFilterCats } from "@/lib/categories";
import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";

const DRAWER_EASE = [0.22, 1, 0.36, 1] as const;

export default function CategoryFilters({
  className = "",
  showFilters,
  setShowFilters,
}: {
  className?: string;
  /** The master switch for the whole control area — owned by
   *  AllProjectsPageClient so the mobile toggle button can sit in the
   *  "projects" LandningBlock row instead of down here; the desktop toggle
   *  below still flips the same state. */
  showFilters: boolean;
  setShowFilters: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const {
    activeFilter,
    setActiveFilter,
    setOpenedCard,
    showSettings,
    setShowSettings,
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
    showGrid,
    setShowGrid,
    setShowList,
    numCols,
    setNumCols,
  } = useUI();
  const { categories } = useWork();


  // Below lg the open panel is its own scroll area; Lenis has to let go of it
  // (`data-lenis-prevent`) or wheel/touch would scroll the page behind. The
  // desktop sidebar doesn't scroll, so it stays under Lenis.
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(!window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  /** One button flips between the thumbnail grid and the client list. */
  function cycleView() {
    setShowGrid(!showGrid);
    setShowList(showGrid);
  }

  const allCats = getVisibleFilterCats(categories);

  function handleFilterChange(cat: string) {
    setActiveFilter(cat);
    setOpenedCard(null);
    setSearch("");
    // Settings stays open — it should be there whenever the filter panel is.
    // Mobile: the panel is a pull-out drawer over the results — collapse it on
    // pick so the filtered list is visible. Desktop keeps its static sidebar.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setShowFilters(false);
    }
  }

  return (
    <div
      data-lenis-prevent={mobile && showFilters ? "" : undefined}
      className={cn(
        // Mobile: a bottom-left drawer — a narrow tab holding just the "show
        // filters" button until opened, growing upward into the full panel
        // when it is. Transparent while closed (it's just a floating label,
        // paired with the sound toggle at the opposite corner); once open it
        // fills in with bg-primary and the text flips to primary-foreground
        // to stay legible over it — same treatment the topbar gives its own
        // drawer. Desktop drops all of that and becomes a full-width panel
        // above the grid/list, on M2Nav's 12 columns (4 / 7 / 10 sit under
        // the nav's projects / about / connect): search at col 1, the
        // category chips in two columns across cols 4–9, and settings at
        // col 10.
        // left-3 always insets the tab from the screen edge; open, right-3
        // pairs with it so the panel spans between the two insets rather than
        // a full 100vw that would overflow past them.
        // Open, it sits above M2Nav's square field (z-90) but starts below
        // its control row (top-16), so the bar stays visible and tappable.
        "fixed top-12 right-3 z-30 pixelCorners",
        "transition-[width] duration-300 ease-out",
        showFilters
          ? "right-0 left-0 top-16 bottom-0 z-[95] bg-background p-3 overflow-y-auto overscroll-contain"
          : "w-1/3 bg-transparent ",
        "lg:static lg:inset-auto lg:z-auto lg:overscroll-auto lg:w-auto lg:bg-transparent lg:p-0 lg:max-h-none lg:overflow-visible lg:[mask-border:none] lg:[-webkit-mask-box-image:none]",
        className,
      )}
    >
      {/* Reveal wraps the content, not this sticky root — a transform on the
          sticky element's own ancestor would break its stickiness (though a
          transform on the sticky element itself, or on its descendants like
          this, is fine). The panel reveals as a single block. */}
      <Reveal>
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: DRAWER_EASE }}
              className="overflow-hidden pt-6"
            >
              <motion.div
                initial={{ y: 32 }}
                animate={{ y: 0 }}
                exit={{ y: 32 }}
                transition={{ duration: 0.4, ease: DRAWER_EASE }}
                className="grid grid-cols-3 lg:grid-cols-12 gap-x-0 gap-y-12 lg:gap-y-6 items-baseline w-full px-3 pt-32 pb-24 lg:p-3"
              >
                <CheckButton
                  checkbox
                  label="close"
                  size="label"
                  active
                  color="text-primary"
                  className="hidden lg:col-start-1 lg:col-span-1 lg:row-start-1"
                  onClick={() => setShowFilters(false)}
                />
                {/* Desktop: search at col 1, with the wordmark's 12px inset.
                    Mobile: its own spot in the drawer grid. */}
                <div className="col-start-2 col-span-2 row-start-4 lg:col-start-1 lg:col-span-3 lg:row-start-1 lg:pl-3">
                  <SearchCheck
                    open={searchOpen}
                    onToggle={() => setSearchOpen((v) => !v)}
                    value={search}
                    onChange={setSearch}
                  />
                </div>
                {/* The category chips. Desktop: cols 4–9 as two columns,
                    starting under the nav's "projects" (4) and "about" (7).
                    No per-chip stagger: the whole panel reveals as one (the
                    Reveal around it). */}
                <div className="col-start-1 col-span-2 row-start-1 flex flex-col lg:grid lg:grid-cols-2 lg:col-start-4 lg:col-span-6 lg:row-start-1 px-0 gap-y-6 w-full">
                  {allCats.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-baseline whitespace-nowrap col-span-1 "
                    >
                      <CheckButton
                        checkbox
                        label={getFilterChipLabel(cat)}
                        size="label"
                        color="text-primary"
                        onClick={() => handleFilterChange(cat)}
                        active={activeFilter === cat}
                      />
                    </span>
                  ))}
                </div>
                {/* Desktop: settings (with its options while open) stacked
                    at col 10, under the nav's "connect".
                    Mobile: `contents` dissolves this
                    wrapper, so each control keeps its own place in the 3-col
                    drawer grid. */}
                <div className="contents lg:flex lg:flex-col lg:gap-y-6 lg:col-start-10 lg:col-span-3 lg:row-start-1">
                  <div className="relative col-start-1 row-start-2">
                    <CheckButton
                      checkbox
                      label="settings"
                      size="label"
                      active={showSettings}
                      color="text-primary"
                      onClick={() => setShowSettings(!showSettings)}
                    />
                  </div>
                  {showSettings && (
                    <div className="col-start-1 col-span-2 row-start-3 flex flex-col px-0 gap-y-6 w-full">
                      {/* Cycle buttons: each names the current setting and
                          steps to the next on click. */}
                      <CheckButton
                        checkbox
                        label={showGrid ? "view: thumbnails" : "view: list"}
                        size="label"
                        active
                        color="text-primary"
                        onClick={cycleView}
                      />
                      {/* Zoom only steps the desktop grid, so it hides with
                          the list view and on mobile. */}
                      {showGrid && (
                        <span className="hidden lg:block">
                          <CheckButton
                            checkbox
                            label={`zoom: ${numCols} per row`}
                            size="label"
                            active
                            color="text-primary"
                            onClick={() => setNumCols(cycleCols(numCols))}
                          />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop only, and only while collapsed — the sole "open filters"
          entry point when the panel isn't rendered at all. Once open, the
          "close" trigger above takes over from inside the panel's own grid,
          sharing categories/settings/search's row and baseline instead of
          this standalone block. Mobile has its own toggle sharing the
          "projects" LandningBlock label's row instead. */}
        {!showFilters && (
          <div className="hidden lg:block lg:px-3 lg:py-0">
            <CheckButton
              checkbox
              label="filters"
              size="lg"
              active
              color="text-primary"
              className="whitespace-nowrap"
              onClick={() => setShowFilters(true)}
            />
          </div>
        )}
      </Reveal>
    </div>
  );
}
