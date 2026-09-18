"use client";

import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import { getActiveFilterLabel } from "@/lib/categories";
import CheckButton from "./CheckButton";
import { zoomInCols, zoomOutCols } from "@/lib/gridZoom";

const BUTTON_CLASS = "btnText";

const viewClass = (active: boolean) =>
  cn(
    BUTTON_CLASS,
    active ? "text-primary-foreground" : "text-muted-foreground",
    "transition-colors duration-150",
  );

/**
 * Thumbnails / List pair on its own — the desktop header puts it in the
 * grid's 4th column, the mobile bar puts it next to the filter toggle.
 */
export function ViewToggleButtons({ className = "" }: { className?: string }) {
  const { showGrid, showList, setShowList, setShowGrid, numCols, setNumCols } =
    useUI();

  function showThumbnails() {
    setShowGrid(true);
    setShowList(false);
  }

  function showListView() {
    setShowList(true);
    setShowGrid(false);
  }

  return (
    <span
      className={cn(
        "grid grid-cols-3 lg:flex flex-col col-start-1 col-span-2  gap-x-0 pl-0",
        className,
      )}
    >
      {/* Zoom only steps the desktop grid, so it stays out of the mobile bar
          and hides whenever the list is the active view. */}
      <CheckButton
        label="thumbnails"
        size="lg"
        color="text-secondary"
        className=" col-span-1"
        active={showGrid}
        onClick={showThumbnails}
      />

      <CheckButton
        label="list"
        size="lg"
        color="text-secondary"
        className="col-span-1"
        active={showList}
        onClick={showListView}
      />
      {showGrid && (
        <span className="hidden  gap-x-3  lg:flex flex-col ">
          <CheckButton
            label="Zoom In"
            size="lg"
            color="text-secondary"
            onClick={() => setNumCols(zoomInCols(numCols))}
            className="c"
          />

          <CheckButton
            label="Zoom Out"
            size="lg"
            color="text-secondary"
            className=""
            onClick={() => setNumCols(zoomOutCols(numCols))}
          />
        </span>
      )}
    </span>
  );
}

/**
 * Mobile bar: the projects heading. Scrolls away with the section it heads.
 *
 * There is no room for a separate filter toggle below lg, so the heading is the
 * toggle — it names the active filter and opens the category overlay. The view
 * toggles (thumbnails / list / zoom) live in the nav's settings menu now, not
 * in this row.
 */
export default function ViewToggles({
  className = "",
}: {
  className?: string;
}) {
  const { filtersOpen, setFiltersOpen, activeFilter } = useUI();

  return (
    <div
      className={cn(
        "flex items-end justify-between",
        // Ties with FilterOverlay's z-40 and comes later in the DOM, so the
        // heading — which is the overlay's only close button — stays tappable
        // above it.
        "relative z-40",
        className,
      )}
    >
      <h2 className="flex items-baseline gap-x-3 justify-end w-full">
        <CheckButton
          size="lg"
          label={getActiveFilterLabel(activeFilter)}
          active={filtersOpen}
          color="text-secondary"
          onClick={() => setFiltersOpen((v) => !v)}
          className={viewClass(filtersOpen)}
        />
      </h2>
    </div>
  );
}
