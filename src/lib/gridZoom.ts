/**
 * Discrete zoom stops for the desktop project grid, smallest thumbnails first.
 * Fewer columns = larger thumbnails.
 */
export const COL_STEPS = [8, 4, 2, 1] as const;

/** Column count the grid opens on. */
export const DEFAULT_COLS = 2;

/** Index of the stop nearest `cols` — keeps stepping sane if state ever holds
 *  an off-scale value. */
function nearestStepIndex(cols: number): number {
  let best = 0;
  for (let i = 1; i < COL_STEPS.length; i++) {
    if (Math.abs(COL_STEPS[i] - cols) < Math.abs(COL_STEPS[best] - cols)) {
      best = i;
    }
  }
  return best;
}

/** The next stop: thumbnails grow 8 → 4 → 2 → 1 per row, then wrap back to
 *  8 — one "zoom" button cycles through every size. */
export function cycleCols(cols: number): number {
  return COL_STEPS[(nearestStepIndex(cols) + 1) % COL_STEPS.length];
}
