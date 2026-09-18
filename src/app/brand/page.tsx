import fs from "node:fs";
import path from "node:path";
import { cn } from "@/lib/utils";

const ART_DIR = path.join(process.cwd(), "public", "art");
const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
]);
/** Aspect ratios at or above this read as "wide" (16:9 ≈ 1.78) — those get
 *  two grid columns instead of one. */
const WIDE_RATIO = 1.6;

function getPngSize(buf: Buffer) {
  const isPng =
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  if (!isPng) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function getJpegSize(buf: Buffer) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    // SOFn markers (frame start) carry the dimensions; C4/C8/CC are DHT/JPG/DAC,
    // not frame headers, so they're excluded from the C0–CF range.
    const isFrameStart =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrameStart) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

/** Dependency-free size probe — just enough to tell a wide (16:9-ish) image
 *  from a square/portrait one, so it can span two grid columns instead of
 *  one on desktop. Supports JPEG and PNG (what actually lands in this
 *  folder); anything else falls back to a single column. */
function getImageSpan(filePath: string): 1 | 2 {
  try {
    const buf = fs.readFileSync(filePath);
    const size = getPngSize(buf) ?? getJpegSize(buf);
    if (!size || !size.height) return 1;
    return size.width / size.height >= WIDE_RATIO ? 2 : 1;
  } catch {
    return 1;
  }
}

function getArtImages() {
  return fs
    .readdirSync(ART_DIR)
    .filter((file) => IMAGE_EXT.has(path.extname(file).toLowerCase()))
    .sort()
    .map((file) => ({ file, span: getImageSpan(path.join(ART_DIR, file)) }));
}

export default function BrandPage() {
  const images = getArtImages();

  return (
    <div className="w-full px-6 lg:px-3 py-24">
      {/* Plain <img>, not PixelFrame/next-Image's `fill` mode — that needs a
          pre-sized box (cropping to it), and each piece here should keep its
          own natural aspect ratio instead. */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-3 lg:gap-6">
        {images.map(({ file, span }) => (
          <div
            key={file}
            className={cn(
              "pixelCorners overflow-hidden w-full",
              // `order` (not DOM reordering) so the wide piece still moves
              // last only on the grid — flex-col-reverse's mobile ordering,
              // which reads DOM order backwards, is untouched by it.
              span === 2 && "lg:col-span-2 lg:order-last",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/art/${encodeURIComponent(file)}`}
              alt={file}
              loading="lazy"
              className="block w-full h-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
