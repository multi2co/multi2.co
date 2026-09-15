import {
  getFilterChipDelays,
  getFilterChipLabel,
  getVisibleFilterCats,
} from "@/lib/categories";

const NAV_LOGO_CHARS = 6; // "Multi²"
const LOGO_APPEAR_MS = 80;
const TYPING_MS_PER_CHAR = 22;
const SEARCH_PLACEHOLDER = "Search...";

// Matches CategoryFilters.tsx's motion.span transition on each chip — the
// picker isn't fully revealed until its last chip's own fade-in completes,
// not just once its delay has elapsed.
const CATEGORY_FADE_MS = 300;

export function getFilterDoneMs(categories: string[]): number {
  const delays = getFilterChipDelays(categories);
  return delays[delays.length - 1] + CATEGORY_FADE_MS;
}

export function getPostLoadFilterDoneMs(categories: string[]): number {
  return (
    NAV_LOGO_CHARS * TYPING_MS_PER_CHAR +
    LOGO_APPEAR_MS +
    getFilterDoneMs(categories)
  );
}

export function getNavTypingDelayMs(categories: string[]): number {
  const cats = getVisibleFilterCats(categories);
  const lastLabel = getFilterChipLabel(cats[cats.length - 1]);
  const searchDelay =
    getFilterChipDelays(categories)[cats.length - 1] +
    (lastLabel.length + 2) * TYPING_MS_PER_CHAR;
  return searchDelay + SEARCH_PLACEHOLDER.length * TYPING_MS_PER_CHAR;
}
