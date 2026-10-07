import type { Metadata } from "next";

// The about page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "About",
  description:
    "About Multi2 — a creative agency in Stockholm working across photo, video, production, art direction and concept.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
