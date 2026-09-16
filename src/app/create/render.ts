import { THEMES, type ThemeId } from "@/context/ThemeContext";
import { BAYER8, CELL } from "./dither";
import type { InkGrid, TextLayer } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** The generated local-font family name, so canvas text matches the site's
 *  visual typeface instead of falling back to a generic sans. */
function visualFontFamily(): string {
  if (typeof document === "undefined") return "sans-serif";
  const fromVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-visual")
    .trim();
  return fromVar ? `${fromVar}, sans-serif` : "sans-serif";
}

/** Composites the drawing and every text layer onto a fresh canvas at (w, h)
 *  — the stage's actual export resolution, independent of how large it
 *  renders on screen. */
export async function renderArtboard(
  layers: TextLayer[],
  drawing: string | undefined,
  bg: string,
  w: number,
  h: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (drawing) {
    const img = await loadImage(drawing);
    ctx.drawImage(img, 0, 0, w, h);
  }

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }
  const fontFamily = visualFontFamily();

  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    ctx.font = `${layer.fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.text, layer.x * w, layer.y * h);
  }

  return canvas;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A true vector SVG — ink as `<rect>`/`<circle>` marks straight off the
 *  saved grid, text as `<text>`. Falls back to embedding `drawing` as a
 *  raster `<image>` only for artworks saved before ink grids were kept (no
 *  `ink` to work from). */
export function renderArtworkSVG({
  themeId,
  layers,
  ink,
  drawing,
  w,
  h,
}: {
  themeId: ThemeId;
  layers: TextLayer[];
  ink?: InkGrid;
  drawing?: string;
  w: number;
  h: number;
}): string {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  let inkMarks = "";
  if (ink) {
    const { cols, rows, iconStyle, cells } = ink;
    const grid = new Float32Array(cols * rows);
    for (const [i, v] of cells) grid[i] = v;
    for (let gy = 0; gy < rows; gy++) {
      const bRow = BAYER8[gy % 8];
      const rowOffset = gy * cols;
      for (let gx = 0; gx < cols; gx++) {
        const v = grid[rowOffset + gx];
        if (v > 0 && v > bRow[gx % 8]) {
          inkMarks +=
            iconStyle === "dot"
              ? `<circle cx="${gx * CELL + CELL / 2}" cy="${gy * CELL + CELL / 2}" r="${CELL / 2}" fill="${theme.ink}"/>`
              : `<rect x="${gx * CELL}" y="${gy * CELL}" width="${CELL}" height="${CELL}" fill="${theme.ink}"/>`;
        }
      }
    }
  }

  const backdropImage =
    !ink && drawing
      ? `<image href="${drawing}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
      : "";

  const textMarks = layers
    .map(
      (l) =>
        `<text x="${l.x * w}" y="${l.y * h}" fill="${l.color}" font-size="${l.fontSize}" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-visual), sans-serif">${escapeXml(l.text)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${theme.bg}"/>${backdropImage}${inkMarks}${textMarks}</svg>`;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadText(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

/** Copies text (markup, in practice) to the clipboard. Returns whether it
 *  worked — the Clipboard API needs a secure context and can be denied. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** A small preview for the saved-artworks strip — full-resolution PNGs are
 *  kept in the layer data itself, so the gallery thumbnail can stay cheap. */
export async function makeThumbnail(canvas: HTMLCanvasElement, maxSize = 320) {
  const scale = Math.min(1, maxSize / Math.max(canvas.width, canvas.height));
  if (scale >= 1) return canvas.toDataURL("image/png");

  const thumb = document.createElement("canvas");
  thumb.width = Math.round(canvas.width * scale);
  thumb.height = Math.round(canvas.height * scale);
  const ctx = thumb.getContext("2d");
  ctx?.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return thumb.toDataURL("image/png");
}
