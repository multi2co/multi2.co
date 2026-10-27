import type { ImageLoaderProps } from "next/image";

/** next/image loader that lets Sanity's CDN do the resizing: each srcset entry
 *  asks for exactly the width it needs, in the best format the browser takes
 *  (`auto=format` → AVIF/WebP). A URL built with a fixed crop (w + h, e.g. the
 *  square covers) keeps its aspect ratio. Anything else (e.g. the
 *  placehold.co stand-in for works with no image) just gets the width as a
 *  `w` query param — the host ignores it, but next/image requires every
 *  loader URL to vary with width and warns otherwise. */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  if (!src.startsWith("https://cdn.sanity.io/images/")) {
    try {
      const other = new URL(src);
      other.searchParams.set("w", String(width));
      return other.toString();
    } catch {
      // A relative path (a file in /public): nothing to resize.
      return src;
    }
  }

  const url = new URL(src);
  const w = Number(url.searchParams.get("w"));
  const h = Number(url.searchParams.get("h"));

  url.searchParams.set("w", String(width));
  if (w && h) url.searchParams.set("h", String(Math.round((width * h) / w)));
  if (quality) url.searchParams.set("q", String(quality));
  url.searchParams.set("auto", "format");

  return url.toString();
}
