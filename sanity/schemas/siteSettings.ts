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
      name: "showHeroWordmark",
      title: "Hero wordmark",
      description:
        'Shows the typed "multisquared" wordmark over the showreel on the home page.',
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "underConstruction",
      title: "Under construction",
      description:
        'Covers the whole site with the "under construction" screen. Visitors can still close it.',
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
