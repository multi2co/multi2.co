import { notFound } from "next/navigation";
import { sanityFetch } from "../../../../sanity/lib/client";
import {
  workBySlugQuery,
  allWorkSlugsQuery,
} from "../../../../sanity/lib/queries";
import { urlFor } from "../../../../sanity/lib/image";
import WorkPageClient, { type ProjectMedia } from "./ProjectPageClient";

/** The three fixed choices `aspectRatioType` offers editors, in case an item
 *  predates the image pipeline's own computed ratio. */
const ASPECT_RATIO_BY_TYPE: Record<string, number> = {
  portrait: 2 / 3,
  cube: 1,
  landscape: 3 / 2,
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
  aspectRatioType?: keyof typeof ASPECT_RATIO_BY_TYPE;
  description?: string;
  file?: { asset?: { url?: string } };
  url?: string;
};

/** Maps one raw Sanity media entry onto what the client actually needs to
 *  render — an image, a video upload's direct file URL, or an embed/direct
 *  video URL — or drops it when it's missing the asset it needs. */
function toProjectMedia(m: MediaItem): ProjectMedia | null {
  if (m._type === "image" && m.asset) {
    return {
      type: "image",
      key: m._key,
      url: urlFor(m).width(1600).quality(85).url(),
      aspectRatio:
        m.aspectRatio ??
        (m.aspectRatioType && ASPECT_RATIO_BY_TYPE[m.aspectRatioType]) ??
        1,
      description: m.description,
    };
  }
  if (m._type === "videoUpload" && m.file?.asset?.url) {
    return {
      type: "video",
      key: m._key,
      url: m.file.asset.url,
      description: m.description,
    };
  }
  if (m._type === "videoUrl" && m.url) {
    return { type: "video", key: m._key, url: m.url, description: m.description };
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
  coverSquare?: { asset?: unknown };
  coverLandscape?: { asset?: unknown };
  media?: MediaItem[];
};

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await sanityFetch<WorkData | null>(
    workBySlugQuery,
    { slug },
    { tags: ["work", `work:${slug}`] },
  );
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

  return (
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
    />
  );
}
