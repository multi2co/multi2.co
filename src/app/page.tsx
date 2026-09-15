import HomeClient from "./HomeClient";
import { sanityFetch } from "../../sanity/lib/client";
import { showreelQuery, contactQuery } from "../../sanity/lib/queries";
import type { ContactData } from "./components/ConnectSection";

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

  let contact: ContactData | null = null;
  try {
    contact = await sanityFetch<ContactData | null>(
      contactQuery,
      {},
      { tags: ["contact"] },
    );
  } catch (error) {
    // Sanity unreachable — ConnectSection falls back to the house email.
    console.error("Page: contact fetch failed", error);
  }

  // Same reel on every width: prefer the desktop upload, fall back to mobile.
  const reelUrl = reel?.desktopUrl ?? reel?.mobileUrl;

  return <HomeClient reelUrl={reelUrl} contact={contact ?? undefined} />;
}
