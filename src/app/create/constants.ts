import type { AspectId } from "./types";

/** Stage resolutions the artboard exports at — the actual pixel size layers
 *  are composited to, independent of how big the stage renders on screen. */
export const STAGE_SIZES: Record<AspectId, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "square — feed" },
  portrait: { w: 1080, h: 1350, label: "portrait — feed" },
  story: { w: 1080, h: 1920, label: "story / reel" },
  landscape: { w: 1920, h: 1080, label: "landscape" },
};

export const ARTWORKS_STORAGE_KEY = "multi2-create-artworks";
export const MAX_SAVED_ARTWORKS = 24;
