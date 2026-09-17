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
    showList,
    setShowGrid,
    setShowList,
    numCols,
    setNumCols,
    sortMode,
    setSortMode,
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
        // drawer. Desktop drops all of that and becomes a sticky sidebar
        // column instead — same vertical stack of controls the drawer uses,
        // just riding alongside the grid/list rather than covering it.
        // left-3 always insets the tab from the screen edge; open, right-3
        // pairs with it so the panel spans between the two insets rather than
        // a full 100vw that would overflow past them.
        "fixed top-12 right-3 z-30 pixelCorners",
        "transition-[width] duration-300 ease-out",
        showFilters
          ? "right-0 left-0 top-0 bg-background p-3 h-auto max-h-dvh overflow-y-auto"
          : "w-1/3 bg-transparent ",
        "lg:static lg:inset-auto lg:z-auto lg:w-auto lg:bg-transparent lg:pb-0 lg:max-h-none lg:overflow-visible lg:[mask-border:none] lg:[-webkit-mask-box-image:none]",
        className,
      )}
    >
      {/* Reveal wraps the content, not this sticky root — a transform on the
          sticky element's own ancestor would break its stickiness (though a
          transform on the sticky element itself, or on its descendants like
          this, is fine). Same top-to-bottom cascade the grid/list uses. */}
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
                className="grid grid-cols-3 lg:flex lg:flex-col  gap-x-0 gap-y-12 lg:gap-y-12 items-baseline w-full px-3 pt-48 pb-6 lg:p-3"
              >
                <CheckButton
                  label="close"
                  size="label"
                  active
                  className="hidden lg:col-start-1 lg:col-span-1 lg:row-start-1"
                  onClick={() => setShowFilters(false)}
                />
                <CheckButton
                  label="categories"
                  size="label"
                  active={showCat}
                  className="col-start-1 row-start-1 lg:row-start-1"
                  onClick={() => setShowCat((v) => !v)}
                />
                {showCat && (
                  <div className="col-start-1 col-span-2 row-start-2 flex flex-col lg:grid  lg:grid-cols-2 px-0 gap-y-6 w-full">
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
                        className="inline-flex items-baseline whitespace-nowrap col-span-1 "
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
                <div className="relative col-start-1 row-start-3 lg:row-start-1">
                  <CheckButton
                    label="settings"
                    size="label"
                    active={showSettings}
                    onClick={() => setShowSettings(!showSettings)}
                  />
                </div>
                {showSettings && (
                  <div className="col-start-1 col-span-2 row-start-4 grid grid-cols-2 lg:grid-cols-2 px-0 gap-y-6 w-full">
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
                      <div className="col-span-2 lg:col-span-2 grid grid-cols-2 lg:grid-cols-2 w-full ">
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
                <SearchCheck
                  className="col-start-2 col-span-2 row-start-5 lg:col-start-11 lg:col-span-2 lg:row-start-1"
                  open={searchOpen}
                  onToggle={() => setSearchOpen((v) => !v)}
                  value={search}
                  onChange={setSearch}
                />

                <CheckButton
                  label={`sort by ${sortMode}`}
                  size="label"
                  active
                  className="col-start-1 col-span-2 row-start-5"
                  onClick={() =>
                    setSortMode((m) => (m === "year" ? "title" : "year"))
                  }
                />
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
              label="filters"
              size="lg"
              active
              className="whitespace-nowrap"
              onClick={() => setShowFilters(true)}
            />
          </div>
        )}
      </Reveal>
    </div>
  );
}
