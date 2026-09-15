import { groq } from "next-sanity";

// All work entries, ordered manually then by year
export const allWorkQuery = groq`
  *[_type == "work"] | order(year desc) {
    _id,
    title,
    slug,
    client,
    year,
    categories,
    description,
    featured,
    coverSquare { asset->, hotspot, crop },
    coverLandscape { asset->, hotspot, crop },
    coverPortrait { asset->, hotspot, crop }
  }
`;

// Single work entry by slug
export const workBySlugQuery = groq`
  *[_type == "work" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    client,
    year,
    categories,
    description,
    imagesPerPage,
    credits,
    heroCoverStyle,
    coverSquare { asset->, hotspot, crop },
    coverLandscape { asset->, hotspot, crop },
    coverPortrait { asset->, hotspot, crop },
    media[] {
      _type,
      _key,
      // image
      asset->,
      "aspectRatio": asset->metadata.dimensions.aspectRatio,
      aspectRatioType,
      hotspot,
      crop,
      alt,
      caption,
      description,
      // videoUpload
      file { asset-> },
      // videoUrl
      url
    }
  }
`;

// All slugs (for generateStaticParams)
export const allWorkSlugsQuery = groq`
  *[_type == "work" && defined(slug.current)] { "slug": slug.current }
`;

// Work cards for homepage — cover + media slides
export const workCardsQuery = groq`
  *[_type == "work"] | order(year desc) {
    _id,
    _createdAt,
    title,
    client,
    year,
    credits,
    description,
    categories,
    featured,
    "slug": slug.current,
    coverSquare { asset },
    media[] {
      _type,
      _key,
      asset->,
      "aspectRatio": asset->metadata.dimensions.aspectRatio,
      aspectRatioType,
      file { asset-> },
      url
    }
  }
`;

// Showreel — the single hero reel. One entry; mobile/desktop uploads.
export const showreelQuery = groq`
  *[_type == "showreel"][0] {
    "mobileUrl": videoMobile.asset->url,
    "desktopUrl": videoDesktop.asset->url
  }
`;

// About copy — one entry; short block for the home page, long for /about
export const aboutQuery = groq`
  *[_type == "about"][0] {
    _id,
    aboutShort,
    aboutLong
  }
`;

// Contact info — one entry
export const contactQuery = groq`
  *[_type == "contact"][0] {
    _id,
    phone,
    email,
    people[] {
      name,
      phone,
      email
    }
  }
`;

// Site settings — one entry
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    _id,
    iconStyle
  }
`;
