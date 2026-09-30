import type { ImageLoaderProps } from "next/image";

/** next/image loader that lets Sanity's CDN do the resizing: each srcset entry
 *  asks for exactly the width it needs, in the best format the browser takes
 *  (`auto=format` → AVIF/WebP). A URL built with a fixed crop (w + h, e.g. the
 *  square covers) keeps its aspect ratio. Anything not on the Sanity CDN is
 *  passed through untouched. */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  if (!src.startsWith("https://cdn.sanity.io/images/")) return src;

  const url = new URL(src);
  const w = Number(url.searchParams.get("w"));
  const h = Number(url.searchParams.get("h"));

  url.searchParams.set("w", String(width));
  if (w && h) url.searchParams.set("h", String(Math.round((width * h) / w)));
  if (quality) url.searchParams.set("q", String(quality));
  url.searchParams.set("auto", "format");

  return url.toString();
}
