"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import CheckButton from "./CheckButton";
import SearchCheck from "./SearchCheck";
import { zoomInCols, zoomOutCols } from "@/lib/gridZoom";
import {
  getFilterChipDelays,
  getFilterChipLabel,
  getVisibleFilterCats,
} from "@/lib/categories";
import { useState } from "react";

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
    showList,
    setShowGrid,
    setShowList,
    numCols,
    setNumCols,
  } = useUI();
  const { categories } = useWork();

  // `showCat` toggles just the category list within the panel.
  const [showCat, setShowCat] = useState(true);

  function showThumbnails() {
    setShowGrid(true);
    setShowList(false);
  }

  function showListView() {
    setShowList(true);
    setShowGrid(false);
  }

  const allCats = getVisibleFilterCats(categories);
  const filterDelays = getFilterChipDelays(categories);

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
      className={cn(
        // Mobile: a bottom-left drawer — a narrow tab holding just the "show
        // filters" button until opened, growing upward into the full panel
        // when it is. Transparent while closed (it's just a floating label,
        // paired with the sound toggle at the opposite corner); once open it
        // fills in with bg-primary and the text flips to primary-foreground
        // to stay legible over it — same treatment the topbar gives its own
        // drawer. Desktop drops all of that and becomes a static sidebar
        // column of the /projects grid.
        // left-3 always insets the tab from the screen edge; open, right-3
        // pairs with it so the panel spans between the two insets rather than
        // a full 100vw that would overflow past them.
        "fixed bottom-3 right-3 z-30 ",
        "transition-[width] duration-300 ease-out",
        showFilters
          ? "left-3 right-3 top-3 bg-primary max-lg:[&_*]:!text-primary-foreground lg:grid lg:grid-cols-12 pb-3"
          : "w-1/3 bg-transparent max-lg:[&_*]:!text-primary",
        "lg:static lg:inset-auto lg:z-auto lg:w-auto lg:bg-transparent lg:pb-0 lg:[mask-border:none] lg:[-webkit-mask-box-image:none] lg:col-start-1 lg:col-span-12",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: DRAWER_EASE }}
            className="overflow-hidden lg:col-start-1 lg:col-span-12 lg:row-start-1"
          >
            <motion.div
              initial={{ y: 32 }}
              animate={{ y: 0 }}
              exit={{ y: 32 }}
              transition={{ duration: 0.4, ease: DRAWER_EASE }}
              className="grid grid-cols-3 lg:grid-cols-12 gap-x-0 gap-y-12 items-baseline w-full px-6 pt-6 pb-6 lg:p-3"
            >
              <CheckButton
                label="categories"
                size="label"
                active={showCat}
                className="col-start-1 row-start-2 lg:col-start-3 lg:row-start-1"
                onClick={() => setShowCat((v) => !v)}
              />
              <div className="relative col-start-3 row-start-2 lg:col-start-9 col-span-1 lg:row-start-1">
                <CheckButton
                  label="settings"
                  size="label"
                  active={showSettings}
                  onClick={() => setShowSettings(!showSettings)}
                />
              </div>
              <SearchCheck
                // Mobile: row 4 drops it below whichever sub-menu is open (both
                // sit on row 3); -mt-6 trims the grid's 12 row gap back to 6 so
                // it keeps the sub-menu's own 6 rhythm.
                className="col-start-3 row-start-4 max-lg:-mt-6 lg:col-start-11 lg:col-span-2 lg:row-start-1"
                open={searchOpen}
                onToggle={() => setSearchOpen((v) => !v)}
                value={search}
                onChange={setSearch}
              />
              {showCat && (
                <div className="col-start-1 row-start-3 lg:col-start-3 col-span-3 lg:col-span-6 lg:row-start-2 grid grid-cols-3 lg:grid-cols-6 px-0 gap-y-6">
                  {allCats.map((cat, i) => (
                    <motion.span
                      key={cat}
                      // Reveal the categories one by one; the project list waits
                      // for this whole sequence (getFilterDoneMs shares the
                      // filterDelays math) before it fades in.
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: DRAWER_EASE,
                        delay: filterDelays[i] / 1000,
                      }}
                      className="inline-flex items-baseline whitespace-nowrap w-min col-span-2"
                    >
                      <CheckButton
                        label={getFilterChipLabel(cat)}
                        size="label"
                        onClick={() => handleFilterChange(cat)}
                        active={activeFilter === cat}
                      />
                    </motion.span>
                  ))}
                </div>
              )}
              {showSettings && (
                <div className="col-start-3 row-start-3 lg:col-start-9 col-span-2 lg:row-start-2 flex flex-col px-0 gap-6">
                  <CheckButton
                    label="list"
                    size="label"
                    active={showList}
                    onClick={showListView}
                  />
                  <CheckButton
                    label="thumbnails"
                    size="label"
                    active={showGrid}
                    onClick={showThumbnails}
                  />
                  {showGrid && (
                    <div className="flex flex-col gap-6">
                      <CheckButton
                        label="Zoom In"
                        size="label"
                        onClick={() => setNumCols(zoomInCols(numCols))}
                      />
                      <CheckButton
                        label="Zoom Out"
                        size="label"
                        onClick={() => setNumCols(zoomOutCols(numCols))}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop only now — it drops into the panel grid's empty left columns,
          bottom-aligned (lg:self-end) with matching lg:p-3 so it sits flush
          with the last sub-menu row. Its own box is `lg` size (h-12) against
          the category chips' `label` size (h-3) — both centre their text in
          that box, so bottom-aligning the boxes alone would still leave the
          text baselines 18px apart (half the 36px height difference). The
          translate nudges just the text back down onto that shared baseline.
          Mobile has its own toggle sharing the "projects" LandningBlock
          label's row instead. */}
      <div className="hidden lg:block lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:self-end lg:translate-y-[18px] lg:z-10 lg:px-3 lg:py-0">
        <CheckButton
          label={showFilters ? "close" : "filters"}
          size="lg"
          active
          className="whitespace-nowrap"
          onClick={() => setShowFilters((v) => !v)}
        />
      </div>
    </div>
  );
}
