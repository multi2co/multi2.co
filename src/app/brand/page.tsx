import fs from "node:fs";
import path from "node:path";
import PixelFrame from "@/app/components/PixelFrame";

const ART_DIR = path.join(process.cwd(), "public", "art");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);

function getArtImages() {
  return fs
    .readdirSync(ART_DIR)
    .filter((file) => IMAGE_EXT.has(path.extname(file).toLowerCase()))
    .sort();
}

export default function BrandPage() {
  const images = getArtImages();

  return (
    <div className="w-full px-6 lg:px-3 py-24">
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3 lg:gap-6">
        {images.map((file) => (
          <PixelFrame
            key={file}
            src={`/art/${encodeURIComponent(file)}`}
            alt={file}
            className="w-full aspect-square"
          />
        ))}
      </div>
    </div>
  );
}
