"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import { useWork } from "@/context/WorkContext";
import { getCategoryLabel } from "@/lib/categories";
import CheckButton from "./CheckButton";
import SettingsOverlay from "./SettingsOverlay";

const getFilterLabel = (cat: string) =>
  cat === "all" ? "All" : getCategoryLabel(cat);

/**
 * Mobile-only category picker. On desktop the filters live in the sticky left
 * column (CategoryFilters); below lg there is no room for it, so the same list
 * takes over the screen while `filtersOpen` is set.
 *
 * Sits below ViewToggles in the stack so its "Hide Filters" button stays
 * tappable over the overlay.
 */
export default function FilterOverlay() {
  const {
    filtersOpen,
    setFiltersOpen,
    activeFilter,
    setActiveFilter,
    setOpenedCard,
    setShowSettings,
    setSearch,
  } = useUI();
  const { categories } = useWork();

  // the CMS can hold two slugs that render the same label (art-direction /
  // Art Direction), so dedupe on what the visitor actually sees
  const seenLabels = new Set<string>();
  const allCats = ["all", ...categories].filter((cat) => {
    const key = getFilterLabel(cat).trim().toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
  function handleFilterChange(cat: string) {
    setActiveFilter(cat);
    setOpenedCard(null);
    setSearch("");
    setShowSettings(false);
    setFiltersOpen(false);
  }

  return (
    <AnimatePresence>
      {filtersOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex lg:hidden fixed inset-0 z-40 w-full h-dvh overflow-y-scroll   "
        >
          <div
            data-cursor-invert
            className="flex flex-col h-dvh mt-16 pt-12 bg-secondary px-0 w-full"
          >
            {/* The settings sheet the "filter settings" button opens into,
                stacked above the category list in the same overlay. */}

            <div className="grid grid-cols-3 gap-x-0 items-baseline justify-center overflow-y-auto pointer-events-auto px-0  mb-12 pt-0 gap-y-0 w-full ">
              {allCats.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-baseline whitespace-nowrap w-full"
                >
                  <CheckButton
                    size="lg"
                    label={getFilterLabel(cat)}
                    active={activeFilter === cat}
                    color="text-secondary"
                    onClick={() => handleFilterChange(cat)}
                    className={cn(" transition-colors duration-150   ")}
                  />
                </span>
              ))}
            </div>
            <SettingsOverlay className=" px-0" />
            <span className="fixed bottom-0 left-0 grid grid-cols-3 w-full z-90">
              <CheckButton
                label="Hide Filters"
                size="lg"
                color="text-secondary"
                onClick={() => setFiltersOpen(false)}
                className="col-start-2 w-full"
              />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
