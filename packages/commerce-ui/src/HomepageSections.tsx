import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Scissors, Bike, BadgeCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@gucco/ui/accordion";
import { Button } from "@gucco/ui/button";
import { HeroCarousel } from "./HeroCarousel";
import { ProductCard } from "./ProductCard";
import { ShopByRoom } from "./ShopByRoom";
import { StoreImage } from "./StoreImage";
import { cn } from "@gucco/ui/utils";
import type { HomepageSection } from "@gucco/commerce-core";
import { useStorefront } from "./StorefrontProvider";

/**
 * Renders the homepage the admin composed in the Medusa homepage CMS.
 *
 * The list arrives **already ordered** — the order *is* the page layout, so it
 * is rendered as-is, never sorted and never looked up by type. Each section is
 * dispatched on `type`; a type this storefront doesn't know yet renders nothing
 * rather than crashing the page.
 *
 * The admin owns copy, imagery and order. The *treatment* is the storefront's.
 */
export function HomepageSections({
  sections,
  /** A catalog shot for a hero slide whose image the admin hasn't uploaded. */
  fallbackHeroImage,
}: {
  sections: HomepageSection[];
  fallbackHeroImage?: string;
}) {
  return (
    <>
      {sections.map((section) => (
        // `id` is the backend row id — stable across reorders, unlike the index.
        <SectionView key={section.id} section={section} fallbackHeroImage={fallbackHeroImage} />
      ))}
    </>
  );
}

function SectionView({
  section,
  fallbackHeroImage,
}: {
  section: HomepageSection;
  fallbackHeroImage?: string;
}) {
  switch (section.type) {
    case "hero":
      return <HeroCarousel slides={section.slides} fallbackImage={fallbackHeroImage} />;
    case "shop_by_room":
      return <ShopByRoom heading={section.heading} tiles={section.tiles} />;
    case "recently_arrived":
      return <RecentlyArrived section={section} />;
    case "why_choose_us":
      return <WhyChooseUs section={section} />;
    case "promo_banner":
      return <PromoBanner section={section} />;
    case "testimonials":
      return <Testimonials section={section} />;
    case "faq":
      return <Faq section={section} />;
    case "newsletter":
      return <Newsletter section={section} />;
    case "image_gallery":
      return <ImageGallery section={section} />;
    case "rich_text":
      return <RichText section={section} />;
    default:
      return null;
  }
}

/** Narrow the union to one member, so each component takes exactly its shape. */
type SectionOf<T extends HomepageSection["type"]> = Extract<HomepageSection, { type: T }>;

/* ── Shared chrome ─────────────────────────────────────────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  cta,
  center = false,
}: {
  eyebrow: string;
  title: string;
  cta?: { label: string; to: string };
  /** Centre the eyebrow + title as a stacked column instead of the default
      left-aligned row with a trailing CTA. */
  center?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-6",
        center ? "flex-col items-center text-center" : "items-end justify-between",
      )}
    >
      <div>
        <div className="eyebrow">{eyebrow}</div>
        {title && <h2 className="mt-2.5 text-[1.9rem] md:text-4xl">{title}</h2>}
      </div>
      {cta && (
        <Link
          to={cta.to}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:text-bloom hover:underline"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────── */

function RecentlyArrived({ section }: { section: SectionOf<"recently_arrived"> }) {
  if (!section.products.length) return null;

  return (
    <section className="container-page mt-20 md:mt-28">
      <SectionHeading
        eyebrow="Fresh cuts"
        title={section.heading}
        cta={{ label: "See everything", to: "/store" }}
      />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {section.products.slice(0, 4).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

// CMS supplies title + description only; the icons are the storefront's, mapped
// by position to the promises the copy makes (grown / tied / delivered / kept).
const VALUE_PROP_ICONS = [Sprout, Scissors, Bike, BadgeCheck];

function WhyChooseUs({ section }: { section: SectionOf<"why_choose_us"> }) {
  const copy = useStorefront().config.copy;
  if (!section.items.length) return null;

  return (
    <section className="container-page mt-24 md:mt-32">
      {/* A deep garden-green feature panel — botanical and premium, and a
          deliberate step away from a neutral-dark block. */}
      <div className="rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12 md:p-16">
        <div className="max-w-2xl">
          <div className="eyebrow !text-primary-foreground/70">
            {copy?.whyChooseUsEyebrow ?? "Why shop with us"}
          </div>
          {section.heading && (
            <h2 className="mt-3 text-[2rem] text-primary-foreground md:text-5xl">
              {section.heading}
            </h2>
          )}
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {section.items.map((item, i) => {
            const Icon = VALUE_PROP_ICONS[i % VALUE_PROP_ICONS.length];
            return (
              <div key={`${item.title}-${i}`} className="flex flex-col gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-foreground/12 text-primary-foreground ring-1 ring-primary-foreground/20">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                {item.title && <div className="text-lg font-semibold">{item.title}</div>}
                {item.description && (
                  <p className="text-sm leading-relaxed text-primary-foreground/75">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// A split banner — copy against a blush panel, bloom in a rounded frame beside
// it. The bloom art is portrait, so it's contained rather than cover-cropped.
function PromoBanner({ section }: { section: SectionOf<"promo_banner"> }) {
  return (
    <section className="container-page mt-20 md:mt-28">
      <div className="grid overflow-hidden rounded-[2rem] bg-petal ring-1 ring-border/50 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-4 p-8 sm:p-12 md:p-16">
          <div className="eyebrow">In season</div>
          {section.title && <h2 className="text-[2rem] md:text-5xl">{section.title}</h2>}
          {section.description && (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {section.description}
            </p>
          )}
          {section.cta && section.ctaLink && (
            <Link
              to={section.ctaLink}
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {section.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {section.image && (
          <div className="relative flex items-center justify-center p-8 md:p-10">
            <div className="relative aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-[1.5rem] bg-card shadow-sm ring-1 ring-border/60">
              <StoreImage
                src={section.image}
                size="lg"
                alt=""
                width={900}
                height={1125}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Testimonials({ section }: { section: SectionOf<"testimonials"> }) {
  if (!section.items.length) return null;

  return (
    <section className="container-page mt-24 md:mt-32">
      <SectionHeading eyebrow="Kind words" title={section.heading} />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {section.items.map((t) => (
          <figure key={t.id} className="surface-card flex flex-col gap-6 rounded-[1.5rem] p-8">
            <span aria-hidden="true" className="font-display text-5xl leading-none text-bloom">
              &ldquo;
            </span>
            <blockquote className="-mt-4 font-display text-[1.35rem] italic leading-snug tracking-[-0.01em]">
              {t.quote}
            </blockquote>
            {(t.author || t.role) && (
              <figcaption className="mt-auto text-sm">
                {t.author && <div className="font-semibold">{t.author}</div>}
                {t.role && <div className="text-muted-foreground">{t.role}</div>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

function Faq({ section }: { section: SectionOf<"faq"> }) {
  if (!section.items.length) return null;

  return (
    <section className="container-page mt-24 md:mt-32">
      <SectionHeading eyebrow="Good to know" title={section.heading} center />
      {/* Centred column; rows keep their text left-aligned — centred question /
          answer text reads poorly. */}
      <Accordion type="single" collapsible className="mx-auto mt-6 max-w-3xl">
        {section.items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="py-5 text-left text-base font-semibold">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/**
 * No subscriber endpoint on the backend yet, so the form acknowledges locally
 * rather than pretending to have stored anything. Wire it to a real list here
 * when one exists — the CMS already supplies the copy.
 */
function Newsletter({ section }: { section: SectionOf<"newsletter"> }) {
  const [submitted, setSubmitted] = useState(false);
  const copy = useStorefront().config.copy;

  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="surface-card grid gap-8 rounded-[2rem] p-8 sm:p-12 md:grid-cols-2 md:items-center md:p-16">
        <div>
          <div className="eyebrow">{copy?.newsletterEyebrow ?? "Newsletter"}</div>
          {section.heading && <h2 className="mt-3 text-[2rem] md:text-4xl">{section.heading}</h2>}
          {section.description && (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor={`newsletter-${section.id}`}>
            Email address
          </label>
          <input
            id={`newsletter-${section.id}`}
            type="email"
            required
            placeholder={section.placeholder}
            className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary"
          />
          <Button type="submit" size="lg" className="h-12 rounded-full px-7">
            {section.buttonLabel}
          </Button>
          <p aria-live="polite" className="sr-only">
            {submitted ? "Thanks — you're on the list." : ""}
          </p>
        </form>
        {submitted && (
          <p className="text-sm text-muted-foreground md:col-start-2">
            Thank you — see you in your inbox on Friday.
          </p>
        )}
      </div>
    </section>
  );
}

function ImageGallery({ section }: { section: SectionOf<"image_gallery"> }) {
  const copy = useStorefront().config.copy;
  if (!section.images.length) return null;

  return (
    <section className="container-page mt-24 md:mt-32">
      <SectionHeading eyebrow={copy?.galleryEyebrow ?? "Gallery"} title={section.heading} />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {section.images.map((item) => {
          const figure = (
            <figure className="group">
              <div className="overflow-hidden rounded-[1.4rem] bg-surface">
                <StoreImage
                  src={item.image}
                  size="sm"
                  alt={item.caption}
                  width={800}
                  height={800}
                  loading="lazy"
                  className="aspect-square h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {item.caption && (
                <figcaption className="pt-3 text-sm text-muted-foreground">{item.caption}</figcaption>
              )}
            </figure>
          );
          return item.link ? (
            <Link key={item.id} to={item.link} className="block">
              {figure}
            </Link>
          ) : (
            <div key={item.id}>{figure}</div>
          );
        })}
      </div>
    </section>
  );
}

function RichText({ section }: { section: SectionOf<"rich_text"> }) {
  return (
    <section className="container-page mt-24 md:mt-32">
      <div className="max-w-2xl">
        {section.heading && <h2 className="text-[2rem] md:text-4xl">{section.heading}</h2>}
        {section.body
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((paragraph, i) => (
            <p key={i} className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {paragraph}
            </p>
          ))}
      </div>
    </section>
  );
}
