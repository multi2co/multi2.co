import BottomNav from "@/app/components/BottomNav";
import ConnectSection, {
  type ContactData,
} from "@/app/components/ConnectSection";
import { Button } from "@/components/ui/button";
import { sanityFetch } from "../../../sanity/lib/client";
import { contactQuery } from "../../../sanity/lib/queries";
import { Reveal } from "@/app/components/Reveal";

const LINK_BTN = "px-0 border-transparent h3Text";

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
    <div className="flex min-h-screen flex-col pt-28 px-3 lg:px-6 lg:pt-28">
      <Reveal className="flex-1 pixelCorners">
        <ConnectSection contact={contact ?? undefined} />

        {contact?.people && contact.people.length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-12 gap-y-8 px-6 lg:px-3 pb-24">
            {contact.people.map((person) => (
              <div
                key={person.name}
                className="col-span-3 lg:col-span-4 flex flex-col items-start gap-y-0"
              >
                <Button size="sm" variant="link" className={LINK_BTN}>
                  {person.name}
                </Button>
                {person.title && (
                  <span className="text-sm font-visual lowercase text-primary/60">
                    {person.title}
                  </span>
                )}
                {person.email && (
                  <Button size="sm" variant="link" className={LINK_BTN} asChild>
                    <a href={`mailto:${person.email}`}>{person.email}</a>
                  </Button>
                )}
                {person.phone && (
                  <Button size="sm" variant="link" className={LINK_BTN} asChild>
                    <a href={`tel:${person.phone.replace(/\s/g, "")}`}>
                      {person.phone}
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
