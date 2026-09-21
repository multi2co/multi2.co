import HomeClient from "./HomeClient";
import { sanityFetch } from "../../sanity/lib/client";
import { showreelQuery } from "../../sanity/lib/queries";

type ShowreelData = { mobileUrl?: string; desktopUrl?: string };

export default async function Page() {
  let reel: ShowreelData | null = null;
  try {
    reel = await sanityFetch<ShowreelData | null>(
      showreelQuery,
      {},
      { tags: ["showreel"] },
    );
  } catch (error) {
    // Sanity unreachable — the reel just doesn't render; the page still does.
    console.error("Page: showreel fetch failed", error);
  }

  // Same reel on every width: prefer the desktop upload, fall back to mobile.
  const reelUrl = reel?.desktopUrl ?? reel?.mobileUrl;

  // contact comes from ContactContextServer in the root layout now — Footer
  // and ConnectSection read it via useContact() instead of a page-level fetch.
  return <HomeClient reelUrl={reelUrl} />;
}
