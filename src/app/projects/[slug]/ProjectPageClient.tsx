"use client";

import { useState, useEffect, Fragment } from "react";
import Image, { getImageProps } from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import LandningBlock from "@/app/components/LandningBlock";
import CheckButton from "@/app/components/CheckButton";
import HeroCarousel from "@/app/components/HeroCarousel";
import VideoPlayer from "@/app/components/VideoPlayer";
import BottomNav from "@/app/components/BottomNav";
import Footer from "@/app/components/Footer";

export type ProjectMedia =
  | {
      type: "image";
      key: string;
      url: string;
      aspectRatio: number;
      description?: string;
    }
  | { type: "video"; key: string; url: string; description?: string };

const CATEGORY_LABELS: Record<string, string> = {
  photo: "Photo",
  video: "Video",
  production: "Production",
  "art-direction": "Art Direction",
  concept: "Concept",
  "sound-design": "Sound Design",
  vax: "Vax",
  dop: "DOP",
  "post-processing": "Post-prod",
  "post-production": "Post-prod",
  music: "Music Prod",
  "music-production": "Music Prod",
};

/** One credit line — "Creative Director: David Andersson" — split into its role
 *  and its name on the first `:` / `–` / `—`. A line with no delimiter is all
 *  role. */
function parseCredit(line: string): { role: string; name: string } {
  const match = line.match(/^(.*?)\s*[:–—]\s*(.*)$/);
  return match
    ? { role: match[1].trim(), name: match[2].trim() }
    : { role: line.trim(), name: "" };
}

/** The hero cover as one art-directed <picture>: the 16:9 image on desktop,
 *  the 1:1 one on mobile, so the browser only downloads the one it shows. */
function HeroCover({ square, wide }: { square: string; wide?: string }) {
  const common = { alt: "", fill: true, priority: true };
  const { props: img } = getImageProps({
    ...common,
    src: square,
    sizes: "100vw",
  });
  const wideSrcSet =
    wide && wide !== square
      ? getImageProps({ ...common, src: wide, sizes: "100vw" }).props.srcSet
      : undefined;
  return (
    <picture>
      {wideSrcSet && (
        <source media="(min-width: 1024px)" srcSet={wideSrcSet} sizes="100vw" />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...img} className="object-cover" />
    </picture>
  );
}

/** Landscape images and videos take two columns of the gallery grid. */
function isWide(item: ProjectMedia) {
  return item.type === "video" || item.aspectRatio > 1.05;
}

function ProjectPageInner({
  client,
  title,
  year,
  description,
  credits,
  categories,
  media,
  coverUrl,
  coverUrlWide,
}: {
  client?: string;
  title: string;
  year?: number;
  description?: string;
  credits?: string;
  categories: string[];
  media: ProjectMedia[];
  coverUrl?: string;
  coverUrlWide?: string;
}) {
  // Which carousel slide is showing — drives the caption below the hero and is
  // shared with the full-screen lightbox so the two carousels stay in step.
  const [activeSlide, setActiveSlide] = useState(0);

  // Desktop only: the hero renders square, then opens out to 16:9. Read after
  // mount, so the server HTML is the square on every width.
  const reduceMotion = useReducedMotion();
  const [heroWide, setHeroWide] = useState(false);
  useEffect(() => {
    setHeroWide(window.matchMedia("(min-width: 1024px)").matches);
  }, []);
  const [lightbox, setLightbox] = useState(false);

  // Lock the page and close on Escape while the lightbox is up.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  // The hero is the first video if there is one, else the work's cover (1:1
  // on mobile, 16:9 on desktop), falling back to the first media item.
  const heroVideo = media.find((m) => m.type === "video");
  const heroStill = coverUrl ?? coverUrlWide ?? media[0]?.url;

  // The gallery carousel further down runs the whole media list; the cover is
  // the fallback when a work has no media of its own yet.
  const slides: ProjectMedia[] =
    media.length > 0
      ? media
      : coverUrl
        ? [{ type: "image", key: "cover", url: coverUrl, aspectRatio: 1 }]
        : [];

  return (
    <div className=" relative w-full px-0 mt-48 ">
      <div className="grid grid-cols-3 lg:grid-cols-12 mb-3 lg:mb-0 items-baseline px-3">
        {client && (
          <div className="hidden lg:flex col-start-1 col-span-1 lg:col-start-1 lg:col-span-3  px-0">
            <CheckButton size="lg" label={client} color="text-primary" active />
          </div>
        )}
        <h2 className="h2Text col-start-2 lg:col-start-4 col-span-3 lg:col-span-8 text-primary lowercase tracking-tight lg:px-3 ">
          {title}
        </h2>
      </div>

      {/* Hero: slides up from below on load. A square, full width on mobile.
          On desktop it takes the viewport's height, left-aligned, and then
          opens out from square to 16:9 — the width follows the ratio, capped
          at the full row. */}
      <div className="relative px-3 lg:px-6 lg:mt-3 w-full">
        <motion.div
          initial={{ aspectRatio: 1, y: reduceMotion ? 0 : "40vh" }}
          animate={{ aspectRatio: heroWide ? 16 / 9 : 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  // Slides up into place first, then opens out.
                  y: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  aspectRatio: {
                    duration: 1.2,
                    delay: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }
          }
          className="w-full lg:w-auto max-w-full lg:h-[calc(100dvh-3.5rem)]"
        >
          <LandningBlock
            className="h-full w-full pixelCorners items-start lg:px-3"
            labelClassName="col-start-1  col-span-3 px-3 lg:col-start-2 lg:col-span-3 "
            background={
              heroVideo ? (
                <div className=" relative h-full w-full">
                  <VideoPlayer src={heroVideo.url} className="h-full w-full" />
                </div>
              ) : heroStill ? (
                <div className=" relative h-full w-full">
                  <HeroCover square={heroStill} wide={coverUrlWide} />
                </div>
              ) : undefined
            }
          />
        </motion.div>
      </div>

      {/* Description + credits — reached by scrolling past the hero. */}
      <motion.div
        className=" w-full relative pb-4 mt-6 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-3 lg:grid-cols-12 gap-y-12 gap-x-6 mb-12 lg:mb-6 items-start text-primary">
          <div className="col-start-1 col-span-3 lg:col-start-4 lg:col-span-7 flex flex-col gap-y-6 px-0 lg:px-0 lowercase">
            {description ? (
              <p className="pText">{description}</p>
            ) : (
              <p className="pText">
                A bold visual concept rooted in craft and intention. Shot on
                location, refined in post. Every frame built around a singular
                idea — to make the ordinary feel inevitable. A bold visual
                concept rooted in craft and intention. Shot on location, refined
                in post. Every frame built around a singular idea — to make the
                ordinary feel inevitable.
              </p>
            )}
          </div>

          <dl className="col-start-1 col-span-3 lg:col-start-4 lg:col-span-8 grid grid-cols-[auto_1fr] lg:grid-cols-8 gap-x-6 gap-y-2 px-0 lg:px-0 h4BtnText lowercase text-primary">
            <dt className="font-normal lowercase lg:col-span-2">project</dt>
            <dd className="m-0 lg:col-span-6 uppercase font-normal">{title}</dd>
            {client && (
              <>
                <dt className="font-normal lowercase lg:col-span-2">client</dt>
                <dd className="m-0 lg:col-span-6   uppercase">{client}</dd>
              </>
            )}
            {year && (
              <>
                <dt className="font-normal lg:col-span-2">year</dt>
                <dd className="m-0 lg:col-span-6 font-normal">{year}</dd>
              </>
            )}
            {categories.length > 0 && (
              <>
                <dt className="font-normal lg:col-span-2">categories</dt>
                <dd className="m-0 lg:col-span-6 flex flex-col font-normal uppercase">
                  {categories.map((c) => (
                    <span key={c}>{CATEGORY_LABELS[c] ?? c}</span>
                  ))}
                </dd>
              </>
            )}
            {credits &&
              credits
                .split("\n")
                .filter(Boolean)
                .map((line, i) => {
                  const { role, name } = parseCredit(line);
                  return (
                    <Fragment key={i}>
                      <dt className="font-normal lowercase lg:col-span-2">
                        {role}
                      </dt>
                      <dd className="m-0 lg:col-span-6 uppercase font-normal">
                        {name}
                      </dd>
                    </Fragment>
                  );
                })}
          </dl>
        </div>
      </motion.div>

      {/* Gallery: the work's media in a 4-col grid (a single column on
          mobile) — landscape images and videos span two columns, everything
          else one. Each item is notched and shown at its own ratio, its
          figure caption below. Clicking one opens the full-screen carousel
          there. `grid-flow-dense` backfills the gaps a wide item leaves. */}
      {slides.length > 0 && (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-4 lg:grid-flow-dense lg:gap-x-6 lg:gap-y-6 lg:items-start mt-3 px-3 lg:px-6">
          {slides.map((item, i) => (
            <figure
              key={item.key}
              className={cn(
                "w-full flex flex-col gap-3",
                isWide(item) ? "lg:col-span-2" : "lg:col-span-1",
              )}
            >
              {/* Wide items come in as a square at 56.25% of the cell and open
                  out to 16:9 at full width as they scroll into view — width
                  and ratio move together, so the height never changes. */}
              <motion.div
                {...(isWide(item)
                  ? {
                      initial: reduceMotion
                        ? false
                        : { width: "56.25%", aspectRatio: 1 },
                      whileInView: { width: "100%", aspectRatio: 16 / 9 },
                      viewport: { once: true, margin: "0px 0px -15% 0px" },
                      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
                      style: { aspectRatio: 16 / 9 },
                    }
                  : {
                      style: {
                        aspectRatio:
                          item.type === "image" ? item.aspectRatio : 16 / 9,
                      },
                    })}
                role="button"
                tabIndex={0}
                aria-label={`open fig.${i + 1} full screen`}
                onClick={() => {
                  setActiveSlide(i);
                  setLightbox(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSlide(i);
                    setLightbox(true);
                  }
                }}
                className="pixelCorners relative w-full overflow-hidden cursor-zoom-in"
              >
                {item.type === "video" ? (
                  <VideoPlayer src={item.url} className="object-cover" />
                ) : (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={
                      isWide(item)
                        ? "(max-width: 1024px) 100vw, 50vw"
                        : "(max-width: 1024px) 100vw, 25vw"
                    }
                  />
                )}
              </motion.div>
              {item.description && (
                <figcaption className="h4BtnText grid grid-cols-3 gap-x-2 lowercase text-primary">
                  <span className="col-span-1">fig.{i + 1}</span>
                  <span className="col-span-2">{item.description}</span>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <div className="w-full mb-6 mt-24">
        <BottomNav />
      </div>

      <Footer />

      {/* Full-screen lightbox — the media as a carousel, opened on whichever
          grid item was clicked. */}
      <AnimatePresence>
        {lightbox && slides.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-background p-3 lg:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-end pb-3">
              <CheckButton
                onClick={() => setLightbox(false)}
                label="close"
                size="lg"
                color="text-primary"
                marks={{ active: "×", inactive: "×" }}
              />
            </div>
            <div className="relative min-h-0 w-full flex-1">
              <HeroCarousel
                media={slides}
                selected={activeSlide}
                onSelect={setActiveSlide}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectPageClient(props: {
  title: string;
  client?: string;
  slug: string;
  description?: string;
  credits?: string;
  categories: string[];
  year?: number;
  media: ProjectMedia[];
  coverUrl?: string;
  coverUrlWide?: string;
}) {
  return <ProjectPageInner {...props} />;
}
