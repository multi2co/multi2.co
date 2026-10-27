/**
 * Discrete zoom stops for the desktop project grid. Fewer columns = larger
 * thumbnails.
 */
export const COL_STEPS = [1, 3, 4, 6, 9, 12] as const;

/** Column count the grid opens on. */
export const DEFAULT_COLS = 4;

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

/** The next stop up, wrapping from the most columns back to the fewest — one
 *  "zoom" button cycles through every size. */
export function cycleCols(cols: number): number {
  return COL_STEPS[(nearestStepIndex(cols) + 1) % COL_STEPS.length];
}
