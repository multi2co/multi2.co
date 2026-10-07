import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_NAME, SITE_URL, toMetaDescription } from "@/lib/site";
import { sanityFetch } from "../../../../sanity/lib/client";
import {
  workBySlugQuery,
  allWorkSlugsQuery,
} from "../../../../sanity/lib/queries";
import { urlFor } from "../../../../sanity/lib/image";
import WorkPageClient, { type ProjectMedia } from "./ProjectPageClient";

/** The ratios editors pick per media item (`aspectRatioType` in the Work
 *  schema). The page always renders an item in exactly this box. */
const ASPECT_RATIO_BY_TYPE: Record<string, number> = {
  portrait: 2 / 3,
  portrait45: 4 / 5,
  vertical: 9 / 16,
  cube: 1,
  landscape: 3 / 2,
  widescreen: 16 / 9,
};

export async function generateStaticParams() {
  try {
    const slugs = await sanityFetch<{ slug: string }[]>(allWorkSlugsQuery);
    return slugs.map(({ slug }) => ({ slug }));
  } catch (error) {
    // Sanity unreachable at build time — let the routes render on demand.
    console.error("generateStaticParams: Sanity fetch failed", error);
    return [];
  }
}

type MediaItem = {
  _type: string;
  _key: string;
  asset?: unknown;
  aspectRatio?: number;
  aspectRatioType?: string;
  alt?: string;
  description?: string;
  file?: { asset?: { url?: string } };
  url?: string;
};

/** Maps one raw Sanity media entry onto what the client actually needs to
 *  render — an image, a video upload's direct file URL, or an embed/direct
 *  video URL — or drops it when it's missing the asset it needs. Every item
 *  carries the ratio the editor picked; an item saved before that choice was
 *  required falls back to the image's own ratio, or 16:9 for a video. Images
 *  are cropped to that ratio here, around their hotspot. */
function toProjectMedia(m: MediaItem): ProjectMedia | null {
  const picked = m.aspectRatioType
    ? ASPECT_RATIO_BY_TYPE[m.aspectRatioType]
    : undefined;
  if (m._type === "image" && m.asset) {
    const aspectRatio = picked ?? m.aspectRatio ?? 1;
    return {
      type: "image",
      key: m._key,
      // Full-width in the gallery, so wide enough for a large screen.
      url: urlFor(m)
        .width(2400)
        .height(Math.round(2400 / aspectRatio))
        .quality(85)
        .url(),
      aspectRatio,
      alt: m.alt,
      description: m.description,
    };
  }
  const videoRatio = picked ?? 16 / 9;
  if (m._type === "videoUpload" && m.file?.asset?.url) {
    return {
      type: "video",
      key: m._key,
      url: m.file.asset.url,
      aspectRatio: videoRatio,
      description: m.description,
    };
  }
  if (m._type === "videoUrl" && m.url) {
    return {
      type: "video",
      key: m._key,
      url: m.url,
      aspectRatio: videoRatio,
      description: m.description,
    };
  }
  return null;
}

type PtChild = { text?: string };
type PtBlock = { _type: string; children?: PtChild[] };

function ptToText(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (!Array.isArray(value)) return undefined;
  const text = (value as PtBlock[])
    .filter((b) => b._type === "block" && Array.isArray(b.children))
    .map((b) => b.children!.map((c) => c.text ?? "").join(""))
    .join("\n");
  return text || undefined;
}

type WorkData = {
  _id: string;
  title: string;
  client?: string;
  description?: unknown;
  credits?: unknown;
  categories?: string[];
  year?: number;
  slug: { current: string };
  showGallery?: boolean;
  heroIntro?: string;
  coverSquare?: { asset?: unknown };
  coverLandscape?: { asset?: unknown };
  media?: MediaItem[];
};

async function fetchWork(slug: string) {
  return sanityFetch<WorkData | null>(
    workBySlugQuery,
    { slug },
    { tags: ["work", `work:${slug}`] },
  );
}

/** Title, description and share image from the work itself. The share image
 *  is the 16:9 cover, else a 16:9 crop of the square one. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await fetchWork(slug).catch(() => null);
  if (!work) return {};
  const title = work.client ? `${work.title} — ${work.client}` : work.title;
  // Works with no intro or description of their own still get a sentence.
  const description =
    toMetaDescription(work.heroIntro ?? ptToText(work.description)) ??
    `${work.title}${work.client ? ` for ${work.client}` : ""} — a project by ${SITE_NAME}, creative agency in Stockholm.`;
  const shareSource = work.coverLandscape?.asset
    ? work.coverLandscape
    : work.coverSquare?.asset
      ? work.coverSquare
      : undefined;
  const image = shareSource
    ? urlFor(shareSource).width(1200).height(630).quality(80).url()
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${slug}`,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await fetchWork(slug);
  if (!work) notFound();

  const media = (work.media ?? [])
    .map(toProjectMedia)
    .filter((m): m is ProjectMedia => m !== null);

  // The hero's cover: 1:1 on mobile, 16:9 on desktop. The desktop one is its
  // own field, falling back to a 16:9 crop of the square cover (hotspot-aware).
  // The page falls back to the first media item when neither is set.
  const coverUrl = work.coverSquare?.asset
    ? urlFor(work.coverSquare).width(1600).height(1600).quality(85).url()
    : undefined;
  const wideSource = work.coverLandscape?.asset
    ? work.coverLandscape
    : work.coverSquare?.asset
      ? work.coverSquare
      : undefined;
  const coverUrlWide = wideSource
    ? urlFor(wideSource).width(2400).height(1350).quality(85).url()
    : undefined;

  // The work as a CreativeWork, for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    url: `${SITE_URL}/projects/${slug}`,
    ...(work.year ? { dateCreated: String(work.year) } : {}),
    ...(work.categories?.length ? { genre: work.categories } : {}),
    ...(coverUrl ? { image: coverUrl } : {}),
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(work.client
      ? { sourceOrganization: { "@type": "Organization", name: work.client } }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WorkPageClient
        title={work.title}
        client={work.client}
        slug={slug}
        description={ptToText(work.description)}
        credits={ptToText(work.credits)}
        categories={work.categories ?? []}
        year={work.year}
        media={media}
        coverUrl={coverUrl}
        coverUrlWide={coverUrlWide}
        // Unset on works saved before the toggle existed — those keep showing.
        showGallery={work.showGallery !== false}
      />
    </>
  );
}
