import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Site Settings",
    }),
    defineField({
      name: "iconStyle",
      title: "Icon style",
      description:
        "Swaps the filled-square marks used by every CheckButton and the nav field for filled dots, site-wide.",
      type: "string",
      options: {
        list: [
          { title: "Filled square (■ / □)", value: "square" },
          { title: "Filled dot (● / ○)", value: "dot" },
        ],
        layout: "radio",
      },
      initialValue: "square",
    }),
  ],
  preview: {
    select: { iconStyle: "iconStyle" },
    prepare({ iconStyle }: { iconStyle?: string }) {
      return { title: "Site Settings", subtitle: iconStyle };
    },
  },
});
