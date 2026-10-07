import type { Metadata } from "next";
import AllProjectsPageClient from "./AllProjectsPageClient";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected work by Multi2 — photo, video, production, art direction and concept.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <h1 className="sr-only">Projects</h1>
      <AllProjectsPageClient />
    </>
  );
}
