import { urlFor } from "./image";

/** A Sanity image field as the queries return it (asset + hotspot/crop). */
type CoverImage = { asset?: unknown; hotspot?: unknown; crop?: unknown } | null;

export type WorkCovers = {
  coverSquare?: CoverImage;
  coverLandscape?: CoverImage;
  coverPortrait?: CoverImage;
};

/** The three cover formats the site shows, each from its own upload when the
 *  editor set one, else cropped (around the hotspot) from whichever other
 *  cover exists. `undefined` only when a work has no cover at all.
 *
 *  - `square` (1:1): the projects archive
 *  - `wide` (16:9): desktop — home featured card, project hero
 *  - `tall` (9:16): mobile — home featured card, project hero */
export function coverUrls(work: WorkCovers, width = 1600) {
  const square = work.coverSquare?.asset ? work.coverSquare : undefined;
  const wide = work.coverLandscape?.asset ? work.coverLandscape : undefined;
  const tall = work.coverPortrait?.asset ? work.coverPortrait : undefined;
  const crop = (source: CoverImage | undefined, ratio: number) =>
    source
      ? urlFor(source)
          .width(width)
          .height(Math.round(width / ratio))
          .quality(85)
          .url()
      : undefined;
  return {
    square: crop(square ?? wide ?? tall, 1),
    wide: crop(wide ?? square ?? tall, 16 / 9),
    tall: crop(tall ?? square ?? wide, 9 / 16),
  };
}
