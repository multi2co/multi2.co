export const CELL = 8;

/** Standard 8×8 Bayer matrix, normalized to 0..1 thresholds. A cell only
 *  paints once its accumulated ink value clears its own threshold here — the
 *  halftone trick that lets a flat fill colour read as a gradient of
 *  density. Shared between the live canvas paint (Artboard) and the vector
 *  SVG regeneration (render.ts) so the two can never disagree on which
 *  cells are actually "on". */
export const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));

/** Whether a cell's accumulated ink density clears its Bayer threshold. */
export function isCellActive(
  grid: Float32Array,
  cols: number,
  gx: number,
  gy: number,
): boolean {
  const v = grid[gy * cols + gx];
  return v > 0 && v > BAYER8[gy % 8][gx % 8];
}
