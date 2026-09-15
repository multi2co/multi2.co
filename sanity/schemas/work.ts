import { defineField, defineType } from "sanity";

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "coverSquare",
      title: "Cover — Square (1:1)",
      description: "Used as the cover on the projects archive.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverLandscape",
      title: "Cover — Landscape (16:9)",
      description:
        "Used as the project page hero on desktop, unless Hero Cover Style below is set to Square only.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverPortrait",
      title: "Cover — Portrait (9:16)",
      description:
        "Used as the project page hero on mobile, unless Hero Cover Style below is set to Square only.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroCoverStyle",
      title: "Hero Cover Style",
      description:
        "How this project's hero picks a cover. Responsive uses the landscape/portrait covers per device; Square only uses the 1:1 cover on both.",
      type: "string",
      options: {
        list: [
          { title: "Responsive (16:9 desktop / 9:16 mobile)", value: "responsive" },
          { title: "Square only (1:1)", value: "square" },
        ],
        layout: "radio",
      },
      initialValue: "responsive",
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "array",
      options: { sortable: true },
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "aspectRatioType",
              title: "Aspect Ratio",
              type: "string",
              options: {
                list: [
                  { title: "Portrait (2:3)", value: "portrait" },
                  { title: "Cube (1:1)", value: "cube" },
                  { title: "Landscape (3:2)", value: "landscape" },
                ],
                layout: "radio",
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
            }),
            defineField({
              name: "caption",
              type: "string",
              title: "Caption",
            }),
            defineField({
              name: "description",
              type: "text",
              rows: 3,
              title: "Description",
            }),
          ],
        },
        {
          type: "object",
          name: "videoUpload",
          title: "Video (upload)",
          fields: [
            defineField({
              name: "file",
              title: "Video file",
              type: "file",
              options: { accept: "video/*" },
            }),
            defineField({
              name: "caption",
              type: "string",
              title: "Caption",
            }),
            defineField({
              name: "description",
              type: "text",
              rows: 3,
              title: "Description",
            }),
          ],
          preview: {
            select: { caption: "caption" },
            prepare({ caption }: { caption?: string }) {
              return { title: caption ?? "Video upload" };
            },
          },
        },
        {
          type: "object",
          name: "videoUrl",
          title: "Video (URL / embed)",
          fields: [
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              description: "YouTube, Vimeo, or direct video link",
            }),
            defineField({
              name: "caption",
              type: "string",
              title: "Caption",
            }),
            defineField({
              name: "description",
              type: "text",
              rows: 3,
              title: "Description",
            }),
          ],
          preview: {
            select: { url: "url", caption: "caption" },
            prepare({ url, caption }: { url?: string; caption?: string }) {
              return { title: caption ?? url ?? "Video URL" };
            },
          },
        },
      ],
    }),
    defineField({
      name: "credits",
      title: "Credits",
      type: "text",
      rows: 6,
      description: "Use line breaks to separate roles.",
    }),
    defineField({
      name: "imagesPerPage",
      title: "Images per page",
      type: "number",
      description: "Limit how many media items appear in the gallery (leave blank to show all)",
    }),
    defineField({
      name: "featured",
      title: "Featured on homepage",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Year, newest first",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      client: "client",
      year: "year",
      media: "coverSquare",
    },
    prepare({ title, client, year, media }) {
      return {
        title,
        subtitle: [client, year].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
