import type { ArtboardLayer } from "./types";

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

/** Composites every layer onto a fresh canvas at (w, h) — the stage's actual
 *  export resolution, independent of how large it renders on screen. */
export async function renderArtboard(
  layers: ArtboardLayer[],
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

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }
  const fontFamily = visualFontFamily();

  for (const layer of layers) {
    if (layer.type === "drawing") {
      const img = await loadImage(layer.src);
      const dw = layer.width * w;
      const dh = layer.height * h;
      ctx.drawImage(img, layer.x * w - dw / 2, layer.y * h - dh / 2, dw, dh);
    } else {
      ctx.fillStyle = layer.color;
      ctx.font = `${layer.fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.text, layer.x * w, layer.y * h);
    }
  }

  return canvas;
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
