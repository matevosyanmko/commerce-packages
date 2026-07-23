// Homepage CMS section shapes — the neutral contract between the backend's
// `GET /store/homepage` payload and the renderer. The SHAPES are shared across
// storefronts; the CONTENT (hero copy, testimonials, imagery) is brand-specific
// and lives in each app, which builds this ordered list from its own data.
//
// The ordered-list model implies: render in array order, key on `id`, an unknown
// `type` renders nothing, and `sections: []` is a valid (empty) homepage.

import type { Product } from "./types";

export interface HeroSlide {
  id: string;
  badge?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
}

export interface HomepageTile {
  id: string;
  name: string;
  link: string;
  image?: string;
}

export interface HomepageValue {
  title: string;
  description: string;
}

export interface HomepageTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface HomepageQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface HomepageGalleryImage {
  id: string;
  image: string;
  caption: string;
  link: string;
}

/**
 * One renderable homepage section, discriminated on `type`. `id` is stable
 * across reorders, so it is the React key (never the array index).
 */
export type HomepageSection =
  | { id: string; type: "hero"; slides: HeroSlide[] }
  | { id: string; type: "shop_by_room"; heading: string; tiles: HomepageTile[] }
  | { id: string; type: "recently_arrived"; heading: string; products: Product[] }
  | { id: string; type: "why_choose_us"; heading: string; items: HomepageValue[] }
  | {
      id: string;
      type: "promo_banner";
      image: string;
      title: string;
      description: string;
      cta: string;
      ctaLink: string;
    }
  | { id: string; type: "testimonials"; heading: string; items: HomepageTestimonial[] }
  | { id: string; type: "faq"; heading: string; items: HomepageQuestion[] }
  | {
      id: string;
      type: "newsletter";
      heading: string;
      description: string;
      placeholder: string;
      buttonLabel: string;
    }
  | { id: string; type: "image_gallery"; heading: string; images: HomepageGalleryImage[] }
  | { id: string; type: "rich_text"; heading: string; body: string };

export type HomepageSectionType = HomepageSection["type"];
