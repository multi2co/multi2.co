"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePixelCorners } from "@/app/hooks/usePixelCorners";
import { useUI } from "@/context/UIContext";
import type { GridItem } from "@/context/WorkContext";
import CheckButton from "./CheckButton";
import VideoPlayer from "./VideoPlayer";

export default function ProjectCard({
  item,
  sizes,
  className = "",
  captionBelow = false,
  onClientClick,
  clientExpanded,
}: {
  item: GridItem;
  sizes: string;
  className?: string;
  /** Client bottom-left, title bottom-right, both shown — the caption a
   *  revealed sibling project gets, instead of the default client-only one. */
  captionBelow?: boolean;
  /** When given, this card's client belongs to more than one project: its
   *  client name toggles revealing the others instead of the card itself
   *  navigating, so the image gets its own link instead of the whole card. */
  onClientClick?: () => void;
  /** Whether `onClientClick` is currently in the "revealed" state — fills the
   *  client mark instead of leaving it empty. */
  clientExpanded?: boolean;
}) {
  // Notches the box's corners like the buttons and landing blocks — on the
  // media box so the image is clipped to the shape, with the caption below it.
  const pixelRef = usePixelCorners<HTMLDivElement>();
  const captionRef = usePixelCorners<HTMLDivElement>();
  const { setOpenedCard, numCols } = useUI();

  // The caption only earns its space when the thumbnails are large enough to
  // sit beside it. Past 4 columns the grid is a dense contact sheet and the
  // label would crowd it.
  const showCaption = numCols <= 4;

  const media = (
    <div
      ref={pixelRef}
      className="pixelCorners relative flex flex-col w-full aspect-square justify-center items-center overflow-hidden"
    >
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

  const caption = captionBelow ? (
    /* Revealed sibling project: client bottom-left, title bottom-right. */
    <div
      ref={captionRef}
      className="flex flex-row items-baseline justify-between gap-0 w-full py-0 px-0 text-primary"
    >
      <CheckButton label={item.client} active size="label" />
      <span className="h4BtnText text-primary lowercase">{item.title}</span>
    </div>
  ) : (
    <div
      ref={captionRef}
      className="flex flex-col gap-1 lg:gap-0 w-full  py-3 px-0  text-primary   "
    >
      <CheckButton
        label={item.client}
        active={onClientClick ? clientExpanded : true}
        size="label"
        onClick={onClientClick}
      />
      <span className="h4BtnText text-primary lowercase hidden ">
        {item.title}
      </span>
    </div>
  );

  // A client with other projects: the card itself isn't a link — its client
  // name (above) toggles the reveal, and just the image opens this project.
  if (onClientClick) {
    return (
      <div
        className={cn(
          "group flex flex-col gap-0 w-full mb-6 lg:mb-3",
          className,
        )}
      >
        <Link
          href={`/projects/${item.slug}`}
          onClick={() => setOpenedCard(item.slug)}
        >
          {media}
        </Link>
        {showCaption && item.client && caption}
      </div>
    );
  }

  return (
    <Link
      href={`/projects/${item.slug}`}
      onClick={() => setOpenedCard(item.slug)}
      className={cn("group flex flex-col gap-0 w-full mb-6 lg:mb-3", className)}
    >
      {media}
      {/* Client + title below the image — client in pText, title in h4BtnText.
          The frame's border follows the notched corners, not a plain rectangle. */}
      {showCaption && item.client && caption}
    </Link>
  );
}
