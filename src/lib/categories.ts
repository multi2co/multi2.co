/**
 * Display labels for the free-form category strings the CMS stores.
 * Kept in one place: renames used to have to be repeated in every component
 * that showed a category.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  photo: "Photo",
  video: "Video",
  production: "Production",
  "art-direction": "Art Direction",
  concept: "Concept",
  "sound-design": "Sound Design",
  vax: "Vax",
  dop: "DOP",
  "post-processing": "Post-prod",
  "post-production": "Post-prod",
  music: "Music Prod",
  "music-production": "Music Prod",
};

export const getCategoryLabel = (cat: string) => CATEGORY_LABELS[cat] ?? cat;

/** Deduped, comma-joined labels — two slugs can render the same label. */
export function formatCategories(cats: string[]) {
  const seen = new Set<string>();
  return cats
    .map(getCategoryLabel)
    .filter((label) => {
      const key = label.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

/** Heading for the projects list — the active filter, or "All Projects". */
export const getActiveFilterLabel = (activeFilter: string) =>
  activeFilter === "all" ? "All Projects" : getCategoryLabel(activeFilter);

/**
 * The /projects category picker's own labels — longer, spelled-out forms,
 * distinct from CATEGORY_LABELS above (which favour short tags elsewhere).
 * Kept in one place so the picker's stagger-reveal timing (navTiming's
 * getFilterDoneMs) can't drift from what it's actually timing on screen —
 * it used to keep a separate copy of this map and disagree on a few labels,
 * which let the project grid reveal itself before the picker had finished.
 */
const FILTER_CHIP_LABELS: Record<string, string> = {
  photo: "Photo",
  video: "Video",
  production: "Production",
  "art-direction": "Art Direction",
  concept: "Concept",
  "sound-design": "Sound Design",
  vax: "Vax",
  dop: "DOP",
  "post-processing": "Post-Processing",
  "post-production": "Post Production",
  music: "Music Production",
  "music-production": "Music Production",
};

export const getFilterChipLabel = (cat: string) =>
  cat === "all" ? "All Projects" : (FILTER_CHIP_LABELS[cat] ?? cat);

/** The picker's visible chips, in order — "all" first, then the CMS's
 *  categories with any that render the same label (e.g. music /
 *  music-production) collapsed to their first occurrence. */
export function getVisibleFilterCats(categories: string[]): string[] {
  const seen = new Set<string>();
  return ["all", ...categories].filter((cat) => {
    const key = getFilterChipLabel(cat).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const FILTER_CHIP_TYPING_MS_PER_CHAR = 22;

/** Cumulative reveal delay (ms), one per visible chip in order — the picker
 *  staggers them in at this cadence, each waiting for the previous label to
 *  finish "typing" at 22ms/char before it starts. */
export function getFilterChipDelays(categories: string[]): number[] {
  const cats = getVisibleFilterCats(categories);
  return cats.reduce<number[]>((acc, _cat, i) => {
    if (i === 0) return [0];
    const prevLabel = getFilterChipLabel(cats[i - 1]);
    return [
      ...acc,
      acc[i - 1] + (prevLabel.length + 2) * FILTER_CHIP_TYPING_MS_PER_CHAR,
    ];
  }, []);
}
