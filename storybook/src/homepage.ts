// Homepage CMS content for the stories.
//
// `commerce-core` ships the section SHAPES; the content is per-store, so this is
// the harness playing the part of a store's admin. Kept in the same gadgets voice
// as the catalog — the renderer must not care what any of it says.

import type {
  HeroSlide,
  HomepageGalleryImage,
  HomepageQuestion,
  HomepageSection,
  HomepageTestimonial,
  HomepageTile,
  HomepageValue,
} from "@wm-storefront/commerce-core";
import { PRODUCTS } from "./fixture";

export const SLIDES: HeroSlide[] = [
  {
    id: "hero_1",
    badge: "New season",
    title: "Sound that disappears",
    description: "Adaptive noise cancellation, forty hours of battery, nothing to fiddle with.",
    ctaLabel: "Shop audio",
    ctaHref: "/categories/audio",
    image: "shape:aurora-headphones:1",
    imageAlt: "Aurora Headphones",
  },
  {
    id: "hero_2",
    badge: "Built to last",
    title: "A watch you charge weekly",
    description: "Titanium, sapphire, and a battery measured in days rather than hours.",
    ctaLabel: "Shop wearables",
    ctaHref: "/categories/wearables",
    image: "shape:meridian-watch:2",
    imageAlt: "Meridian Watch",
  },
  {
    id: "hero_3",
    title: "Desks, tidied",
    description: "One cable in, two displays out.",
    ctaLabel: "Shop desk",
    ctaHref: "/categories/desk",
    image: "shape:vertex-dock:1",
    imageAlt: "Vertex Dock",
  },
];

export const TILES: HomepageTile[] = [
  { id: "t_audio", name: "Audio", link: "/categories/audio", image: "shape:nimbus-speaker:1" },
  { id: "t_wear", name: "Wearables", link: "/categories/wearables", image: "shape:pulse-band:1" },
  { id: "t_desk", name: "Desk", link: "/categories/desk", image: "shape:atlas-keyboard:1" },
  { id: "t_power", name: "Power", link: "/categories/power", image: "shape:cobalt-charger:1" },
  { id: "t_new", name: "New in", link: "/store", image: "shape:tether-cable:2" },
];

const VALUES: HomepageValue[] = [
  { title: "Two-year warranty", description: "On every product, no registration needed." },
  { title: "Thirty-day returns", description: "Unopened, in the original packaging." },
  { title: "Carbon-neutral delivery", description: "Offset on every order, at our cost." },
];

const TESTIMONIALS: HomepageTestimonial[] = [
  {
    id: "q1",
    quote: "The dock replaced four cables with one. My desk finally looks like a desk.",
    author: "Rowan",
    role: "Illustrator",
  },
  {
    id: "q2",
    quote: "I charge the watch on Sundays and forget about it until the next Sunday.",
    author: "Devi",
    role: "Trail runner",
  },
];

const QUESTIONS: HomepageQuestion[] = [
  {
    id: "f1",
    question: "How long does delivery take?",
    answer: "Two to three working days across the EU, next day with Express.",
  },
  {
    id: "f2",
    question: "Can I return an opened product?",
    answer: "Within thirty days, provided everything is in the box.",
  },
  {
    id: "f3",
    question: "Do you ship outside the EU?",
    answer: "Not yet — we'd rather do one region properly first.",
  },
];

const GALLERY: HomepageGalleryImage[] = PRODUCTS.slice(0, 6).map((p, i) => ({
  id: `g_${p.handle}`,
  image: `shape:${p.handle}:${(i % 3) + 1}`,
  caption: p.title,
  link: `/products/${p.handle}`,
}));

/** Every section type the contract defines, in a plausible admin order. */
export const SECTIONS: HomepageSection[] = [
  { id: "s_hero", type: "hero", slides: SLIDES },
  { id: "s_rooms", type: "shop_by_room", heading: "Shop by category", tiles: TILES },
  {
    id: "s_new",
    type: "recently_arrived",
    heading: "Recently arrived",
    products: PRODUCTS.slice(0, 4),
  },
  { id: "s_why", type: "why_choose_us", heading: "Why shop with us", items: VALUES },
  {
    id: "s_promo",
    type: "promo_banner",
    image: "shape:atlas-keyboard:3",
    title: "Desk week",
    description: "Fifteen percent off keyboards, mice and lighting until Sunday.",
    cta: "Shop the sale",
    ctaLink: "/categories/desk",
  },
  { id: "s_quotes", type: "testimonials", heading: "What people say", items: TESTIMONIALS },
  { id: "s_faq", type: "faq", heading: "Questions", items: QUESTIONS },
  {
    id: "s_news",
    type: "newsletter",
    heading: "Get the drop",
    description: "One email a month, new arrivals only.",
    placeholder: "you@example.com",
    buttonLabel: "Subscribe",
  },
  { id: "s_gallery", type: "image_gallery", heading: "In the wild", images: GALLERY },
  {
    id: "s_text",
    type: "rich_text",
    heading: "About the shop",
    body: "We stock a small number of things and stand behind all of them.",
  },
];
