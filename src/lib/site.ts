/** Site-wide facts for metadata, the sitemap and structured data. Set
 *  NEXT_PUBLIC_SITE_URL per environment; it falls back to the live domain. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://multi2.co"
).replace(/\/$/, "");

export const SITE_NAME = "Multi2";

export const SITE_DESCRIPTION =
  "Multi2 is a creative agency in Stockholm working across photo, video, production, art direction and concept.";

/** A meta description from longer copy: one line, cut at a word near 160. */
export function toMetaDescription(text?: string): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 160) return flat;
  return flat.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}
