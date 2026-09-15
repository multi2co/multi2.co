import { createClient, type QueryParams } from "next-sanity";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true, // faster reads; set false when editing live preview
});

/** `client.fetch` with a few retries. Sanity's edge occasionally drops a
 *  connection mid-request, which surfaces as an opaque `TypeError: fetch failed`
 *  and — since every caller `await`s it directly in a Server Component — takes
 *  the whole route down. A transient blip is almost always gone on the next try. */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  {
    retries = 2,
    delayMs = 300,
    tags,
  }: { retries?: number; delayMs?: number; tags?: string[] } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await client.fetch<T>(
        query,
        params,
        tags ? { next: { tags } } : undefined,
      );
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
