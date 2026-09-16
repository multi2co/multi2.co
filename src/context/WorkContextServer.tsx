import React from "react";
import { sanityFetch } from "../../sanity/lib/client";
import { workCardsQuery } from "../../sanity/lib/queries";
import { urlFor } from "../../sanity/lib/image";
import { WorkProvider, type GridItem } from "./WorkContext";

const PLACEHOLDER_IMG = "https://placehold.co/1200x1200/111111/111111";

const MOCK_ITEMS: import("./WorkContext").GridItem[] = [
  { key: "mock-1", url: PLACEHOLDER_IMG, alt: "Norrlands Guld", slug: "norrlands-guld-summer", title: "Summer Campaign", client: "Norrlands Guld", year: 2024, categories: ["photo", "art-direction"], featured: true, isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-1-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-2", url: PLACEHOLDER_IMG, alt: "Volvo Cars", slug: "volvo-electric", title: "Electric Future", client: "Volvo Cars", year: 2024, categories: ["video", "concept"], featured: true, isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-2-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-3", url: PLACEHOLDER_IMG, alt: "H&M", slug: "hm-spring", title: "Spring Collection", client: "H&M", year: 2024, categories: ["photo", "production"], featured: true, isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-3-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-4", url: PLACEHOLDER_IMG, alt: "Spotify", slug: "spotify-wrapped", title: "Wrapped", client: "Spotify", year: 2023, categories: ["concept", "art-direction"], isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-4-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-5", url: PLACEHOLDER_IMG, alt: "Audi", slug: "audi-the-drive", title: "The Drive", client: "Audi", year: 2023, categories: ["video", "dop"], isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-5-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-6", url: PLACEHOLDER_IMG, alt: "IKEA", slug: "ikea-home-stories", title: "Home Stories", client: "IKEA", year: 2023, categories: ["photo", "concept"], isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-6-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-7", url: PLACEHOLDER_IMG, alt: "Absolut Vodka", slug: "absolut-new-drop", title: "New Drop", client: "Absolut Vodka", year: 2024, categories: ["photo", "art-direction", "production"], isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-7-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
  { key: "mock-8", url: PLACEHOLDER_IMG, alt: "Peak Performance", slug: "peak-performance-fw24", title: "FW24", client: "Peak Performance", year: 2024, categories: ["video", "production", "concept"], isPrimary: true, aspectRatio: 1, projectImages: [{ key: "mock-8-img", url: PLACEHOLDER_IMG, aspectRatio: 1 }] },
];

const MOCK_CATEGORIES = ["art-direction", "concept", "dop", "photo", "production", "video"];

type MediaItem = {
  _type: string;
  _key: string;
  asset?: unknown;
  aspectRatio?: number;
  file?: { asset?: { url?: string } };
  url?: string;
};

type DisplayMedia = {
  key: string;
  url: string;
  aspectRatio: number;
  mediaType: "image" | "video";
};

/** Maps one raw media entry onto what a grid card can show — an image, or a
 *  video's own playable URL (upload file, or a direct/embed URL) — or drops
 *  it when it's missing the asset it needs. Grid cards force a square crop
 *  regardless, so a video gets a nominal 1:1 ratio rather than a real one. */
function toDisplayMedia(m: MediaItem): DisplayMedia | null {
  if (m._type === "image" && m.asset) {
    return {
      key: m._key,
      url: urlFor(m).width(1200).quality(80).url(),
      aspectRatio: m.aspectRatio ?? 1,
      mediaType: "image",
    };
  }
  if (m._type === "videoUpload" && m.file?.asset?.url) {
    return { key: m._key, url: m.file.asset.url, aspectRatio: 1, mediaType: "video" };
  }
  if (m._type === "videoUrl" && m.url) {
    return { key: m._key, url: m.url, aspectRatio: 1, mediaType: "video" };
  }
  return null;
}

type WorkData = {
  _id: string;
  _createdAt?: string;
  title: string;
  client?: string;
  year?: number;
  credits?: unknown;
  description?: string;
  categories?: string[];
  featured?: boolean;
  slug: string;
  coverSquare?: { asset: { _ref: string } };
  media?: MediaItem[];
};

export async function WorkContextServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let works: WorkData[] = [];
  try {
    works = await sanityFetch<WorkData[]>(
      workCardsQuery,
      {},
      { tags: ["work"] },
    );
  } catch (error) {
    // Sanity unreachable — fall through to the mock data below rather than
    // crashing every page that renders inside this provider.
    console.error("WorkContextServer: Sanity fetch failed", error);
  }

  const items: GridItem[] = [];
  const categorySet = new Set<string>();

  for (const work of works) {
    for (const cat of work.categories ?? []) {
      categorySet.add(cat);
    }

    // Hoisted: works with media still have a cover, and callers that want the
    // cover specifically can't get it from the media-derived `url`. Forced to
    // a 1:1 crop since this is the dedicated archive-cover field.
    const coverUrl = work.coverSquare?.asset
      ? urlFor(work.coverSquare).width(1200).height(1200).quality(80).url()
      : undefined;

    const allMedia = (work.media ?? [])
      .map(toDisplayMedia)
      .filter((m): m is DisplayMedia => m !== null);

    const projectImages = allMedia.map((m) => ({
      key: m.key,
      url: m.url,
      aspectRatio: m.aspectRatio,
    }));

    const displayMedia = allMedia.slice(0, 3);

    if (displayMedia.length > 0) {
      displayMedia.forEach((m, idx) => {
        items.push({
          key: `${work._id}-${m.key}`,
          url: m.url,
          mediaType: m.mediaType,
          alt: work.client || work.title,
          slug: work.slug,
          title: work.title,
          client: work.client,
          year: work.year,
          createdAt: work._createdAt,
          credits: work.credits,
          description: work.description,
          categories: work.categories ?? [],
          aspectRatio: m.aspectRatio,
          coverUrl,
          featured: work.featured ?? false,
          isPrimary: idx === 0,
          projectImages,
        });
      });
    } else if (coverUrl) {
      items.push({
        key: work._id,
        url: coverUrl,
        alt: work.client || work.title,
        slug: work.slug,
        title: work.title,
        client: work.client,
        year: work.year,
        createdAt: work._createdAt,
        credits: work.credits,
        description: work.description,
        categories: work.categories ?? [],
        aspectRatio: 1,
        coverUrl,
        featured: work.featured ?? false,
        isPrimary: true,
        projectImages: [
          {
            key: work._id,
            url: coverUrl,
            aspectRatio: 1,
          },
        ],
      });
    } else {
      // No image media and no coverSquare — e.g. a work whose only media is
      // video. Without a still to show, it would otherwise be silently
      // dropped from every listing (archive, homepage). Show it with a
      // placeholder cover instead so it's still findable; the CMS entry
      // still needs a coverSquare image for a real thumbnail.
      items.push({
        key: work._id,
        url: PLACEHOLDER_IMG,
        alt: work.client || work.title,
        slug: work.slug,
        title: work.title,
        client: work.client,
        year: work.year,
        createdAt: work._createdAt,
        credits: work.credits,
        description: work.description,
        categories: work.categories ?? [],
        aspectRatio: 1,
        featured: work.featured ?? false,
        isPrimary: true,
        projectImages: [
          {
            key: work._id,
            url: PLACEHOLDER_IMG,
            aspectRatio: 1,
          },
        ],
      });
    }
  }

  const categories = Array.from(categorySet).sort();
  const finalItems = items.length > 0 ? items : MOCK_ITEMS;
  const finalCategories =
    categories.length > 0 ? categories : MOCK_CATEGORIES;

  return (
    <WorkProvider items={finalItems} categories={finalCategories}>
      {children}
    </WorkProvider>
  );
}
