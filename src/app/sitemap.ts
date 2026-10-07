import type { MetadataRoute } from "next";
import { sanityFetch } from "../../sanity/lib/client";
import { groq } from "next-sanity";
import { SITE_URL } from "@/lib/site";

const sitemapWorkQuery = groq`
  *[_type == "work" && defined(slug.current)] {
    "slug": slug.current,
    _updatedAt
  }
`;

/** Every static page plus one entry per project, from the CMS. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    "",
    "/projects",
    "/about",
    "/connect",
  ].map((path) => ({ url: `${SITE_URL}${path}` }));

  let works: { slug: string; _updatedAt?: string }[] = [];
  try {
    works = await sanityFetch(sitemapWorkQuery, {}, { tags: ["work"] });
  } catch (error) {
    console.error("sitemap: Sanity fetch failed", error);
  }

  return [
    ...pages,
    ...works.map((w) => ({
      url: `${SITE_URL}/projects/${w.slug}`,
      lastModified: w._updatedAt,
    })),
  ];
}
