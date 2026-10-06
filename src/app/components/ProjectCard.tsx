"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import type { GridItem } from "@/context/WorkContext";
import CheckButton from "./CheckButton";
import VideoPlayer from "./VideoPlayer";

/** One project in the /projects grid: its square media, captioned with the
 *  project's title. The whole card links to the project. */
export default function ProjectCard({
  item,
  sizes,
  className = "",
}: {
  item: GridItem;
  sizes: string;
  className?: string;
}) {
  // Notches the box's corners like the buttons and landing blocks — on the
  // media box so the image is clipped to the shape, with the caption below it.
  const { setOpenedCard, numCols } = useUI();

  // The caption only earns its space when the thumbnails are large enough to
  // sit beside it. Past 4 columns the grid is a dense contact sheet and the
  // label would crowd it.
  const showCaption = numCols <= 4;

  const media = (
    <div className="pixelCorners relative flex flex-col w-full aspect-square justify-center items-center overflow-hidden">
      <div className="relative h-full aspect-square overflow-hidden ">
        {/* group-hover, not hover: the scale should follow the whole card.
            overflow-hidden on the parent crops the growth instead of letting
            it push into the neighbouring masonry column. */}
        {item.mediaType === "video" ? (
          <VideoPlayer src={item.url} className="object-cover" />
        ) : (
          <Image
            src={item.url}
            alt={item.alt}
            fill
            className="object-cover "
            sizes={sizes}
          />
        )}
      </div>
    </div>
  );

  return (
    <Link
      href={`/projects/${item.slug}`}
      onClick={() => setOpenedCard(item.slug)}
      className={cn("group flex flex-col gap-0 w-full mb-6 lg:mb-3", className)}
    >
      {media}
      {showCaption && (
        <CheckButton
          label={item.title}
          active
          size="lg"
          color="text-secondary"
        />
      )}
    </Link>
  );
}
