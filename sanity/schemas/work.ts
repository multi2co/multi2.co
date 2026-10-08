import { defineField, defineType } from "sanity";

/** The ratio a video is shown at — a video can't report its own size before
 *  it loads, so the editor picks it. Values map to ratios in the project
 *  page's ASPECT_RATIO_BY_TYPE; "cube" is the original key for 1:1. */
const aspectRatioField = defineField({
  name: "aspectRatioType",
  title: "Aspect Ratio",
  type: "string",
  options: {
    list: [
      { title: "Portrait (2:3)", value: "portrait" },
      { title: "Portrait (4:5)", value: "portrait45" },
      { title: "Vertical (9:16)", value: "vertical" },
      { title: "Square (1:1)", value: "cube" },
      { title: "Landscape (3:2)", value: "landscape" },
      { title: "Widescreen (16:9)", value: "widescreen" },
    ],
    layout: "radio",
  },
  validation: (r) => r.required(),
});

/** Images render at the ratio they were uploaded at, so they don't need one
 *  picked. Hidden rather than removed: items saved with a ratio keep it
 *  without the Studio flagging an unknown field. */
const imageAspectRatioField = defineField({
  ...aspectRatioField,
  hidden: true,
  validation: undefined,
});

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
      name: "heroIntro",
      title: "Hero intro",
      description:
        "A short intro shown under the image when this project is featured on the homepage.",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "coverSquare",
      title: "Cover (1:1)",
      description:
        "Square cover for the projects archive. The other covers fall back to a crop of this one when they're empty.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverLandscape",
      title: "Cover — Desktop (16:9)",
      description:
        "Desktop: the homepage card and the project page hero. Leave empty to use a 16:9 crop of the 1:1 cover.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverPortrait",
      title: "Cover — Mobile (9:16)",
      description:
        "Mobile: the homepage card and the project page hero. Leave empty to use a 9:16 crop of the 1:1 cover.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroCoverStyle",
      hidden: true,
      title: "Hero Cover Style",
      description:
        "How this project's hero picks a cover. Responsive uses the landscape/portrait covers per device; Square only uses the 1:1 cover on both.",
      type: "string",
      options: {
        list: [
          {
            title: "Responsive (16:9 desktop / 9:16 mobile)",
            value: "responsive",
          },
          { title: "Square only (1:1)", value: "square" },
        ],
        layout: "radio",
      },
      initialValue: "responsive",
    }),
    defineField({
      name: "showGallery",
      title: "Show gallery",
      description: "Show the media gallery on the project page.",
      type: "boolean",
      initialValue: true,
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
            imageAspectRatioField,
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
            aspectRatioField,
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
            aspectRatioField,
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
      description:
        "Limit how many media items appear in the gallery (leave blank to show all)",
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
