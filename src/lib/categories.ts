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
  "music-production": "Music Prod",
};

/** Slugs that mean the same thing as another, folded into it. */
const CATEGORY_ALIASES: Record<string, string> = {
  music: "music-production",
  edit: "editing",
};

/** The CMS stores categories as free text, so the same one arrives as
 *  "Music", "music" or "Art Direction" / "art direction" / "art-direction".
 *  Lower-cased, hyphenated and alias-folded here so filtering and labels see
 *  one slug per category. */
export function normalizeCategory(cat: string): string {
  const slug = cat.trim().toLowerCase().replace(/\s+/g, "-");
  return CATEGORY_ALIASES[slug] ?? slug;
}

/** A work's categories, normalized and deduped. */
export const normalizeCategories = (cats: string[] = []) =>
  Array.from(new Set(cats.map(normalizeCategory)));

/** "graphic-design" → "Graphic Design", for slugs with no label of their own. */
const humanize = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const getCategoryLabel = (cat: string) =>
  CATEGORY_LABELS[cat] ?? humanize(cat);

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
  "music-production": "Music Production",
};

export const getFilterChipLabel = (cat: string) =>
  cat === "all" ? "All Projects" : (FILTER_CHIP_LABELS[cat] ?? humanize(cat));

/** The picker's visible chips, in order — "all" first, then the CMS's
 *  categories with any that render the same label (e.g. post-processing /
 *  post-production) collapsed to their first occurrence. */
export function getVisibleFilterCats(categories: string[]): string[] {
  const seen = new Set<string>();
  return ["all", ...categories].filter((cat) => {
    const key = getFilterChipLabel(cat).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
