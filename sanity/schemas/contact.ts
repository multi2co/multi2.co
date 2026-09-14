import { defineField, defineType } from "sanity";

export const contact = defineType({
  name: "contact",
  title: "Contact",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Contact",
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (r) => r.email(),
    }),
    defineField({
      name: "people",
      title: "People",
      description:
        "The named contacts shown on the connect block — first at col 4, second at col 7. Only the first two show on desktop.",
      type: "array",
      of: [
        {
          type: "object",
          name: "person",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "phone",
              title: "Phone",
              type: "string",
            }),
            defineField({
              name: "email",
              title: "Email",
              type: "string",
              validation: (r) => r.email(),
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "email" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { phone: "phone", email: "email" },
    prepare({ phone, email }: { phone?: string; email?: string }) {
      return {
        title: "Contact",
        subtitle: [phone, email].filter(Boolean).join(" · "),
      };
    },
  },
});
