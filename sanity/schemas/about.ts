import { defineField, defineType } from "sanity";

export const about = defineType({
  name: "about",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "About",
    }),
    defineField({
      name: "aboutShort",
      title: "About (short)",
      description: "Shown in the 'our story' block on the home page.",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "aboutLong",
      title: "About (long)",
      description: "Shown on the /about page.",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }: { title?: string }) {
      return { title: title ?? "About" };
    },
  },
});
