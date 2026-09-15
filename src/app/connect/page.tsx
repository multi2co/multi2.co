import BottomNav from "@/app/components/BottomNav";
import ConnectSection, {
  type ContactData,
} from "@/app/components/ConnectSection";
import { sanityFetch } from "../../../sanity/lib/client";
import { contactQuery } from "../../../sanity/lib/queries";

export default async function ConnectPage() {
  let contact: ContactData | null = null;
  try {
    contact = await sanityFetch<ContactData | null>(
      contactQuery,
      {},
      { tags: ["contact"] },
    );
  } catch (error) {
    // Sanity unreachable — ConnectSection falls back to the house email.
    console.error("ConnectPage: contact fetch failed", error);
  }

  return (
    <div className="flex min-h-screen flex-col pt-28 lg:pt-36">
      <div className="flex-1">
        <ConnectSection contact={contact ?? undefined} />
      </div>
    </div>
  );
}
