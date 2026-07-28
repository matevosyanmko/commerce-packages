import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@storefront/commerce-core";
import { cn } from "@storefront/ui/utils";
import { useStorefront } from "./StorefrontProvider";
import { StoreImage } from "./StoreImage";

const ROTATE_MS = 7000;

// The headline styling, shared so the active <h1> and the inactive <p> render at
// exactly the same metrics — the panel height must not depend on which slide is
// the heading. Mirrors the h1 base layer (Fraunces / weight 500).
const HEADING_CLASS =
  "font-display font-medium text-[2.6rem] leading-[1.02] tracking-[-0.015em] sm:text-6xl md:text-[4rem]";

/**
 * CMS-driven hero.
 *
 * Slides come from the homepage CMS; the treatment — a soft sage panel with an
 * arched "atelier window" holding the bloom, and an editorial serif headline —
 * is the storefront's, not the CMS's. The admin controls copy and imagery, never
 * layout. `image` can be empty on a fresh store, so callers pass a `fallbackImage`.
 *
 * All slides are stacked in a single grid cell, so the panel is always as tall as
 * the *tallest* slide and its height never changes as slides rotate — only the
 * active slide is visible (the rest are faded out and `inert`). Slides differ in
 * copy length, so rendering one at a time made the panel jump on every change.
 */
export function HeroCarousel({
  slides,
  fallbackImage,
}: {
  slides: HeroSlide[];
  fallbackImage?: string;
}) {
  const [index, setIndex] = useState(0);
  const multiple = slides.length > 1;
  const copy = useStorefront().config.copy;

  useEffect(() => {
    if (!multiple) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [multiple, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="container-page pt-5 md:pt-8">
      {multiple && (
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          Slide {index + 1} of {slides.length}: {active.title || "Untitled"}
        </span>
      )}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-secondary to-petal ring-1 ring-border/50">
        {/* Every slide occupies the same grid cell: the cell — and therefore the
            panel — grows to the tallest slide and stays put as slides change. */}
        <div className="grid">
          {slides.map((slide, i) => {
            const isActive = i === index;
            const image = slide.image || fallbackImage;
            return (
              <div
                key={slide.id}
                inert={!isActive}
                aria-hidden={!isActive}
                className={cn(
                  "col-start-1 row-start-1 grid items-stretch gap-0 transition-opacity duration-700 md:grid-cols-[1.05fr_0.95fr]",
                  isActive ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {/* Image column — the arched window. First on mobile for impact. */}
                <div className="relative order-1 flex items-end justify-center px-6 pt-8 sm:px-10 md:order-2 md:px-10 md:pt-12">
                  {image && (
                    <div className="arch relative aspect-[4/5] w-full max-w-[22rem] bg-card shadow-[0_24px_60px_-30px_rgba(40,60,45,0.5)] ring-1 ring-border/60 md:max-w-sm">
                      <StoreImage
                        src={image}
                        size="lg"
                        alt={slide.imageAlt}
                        width={1000}
                        height={1250}
                        priority={i === 0}
                        decoding="sync"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Copy column */}
                <div
                  className={cn(
                    "order-2 flex flex-col p-8 sm:p-12 md:order-1 md:p-16",
                    multiple && "md:min-h-[30rem]",
                  )}
                >
                  {/* The copy is centred in the space above the dots. Every copy
                      column is stretched to the tallest slide's height (shared
                      grid cell + items-stretch), so the flex-1 wrapper is the
                      same height on every slide — which keeps the dot row that
                      follows it pinned to the same Y and stops it jumping as the
                      copy length changes between slides. */}
                  <div className="flex flex-1 flex-col justify-center gap-5">
                    {slide.badge && <span className="eyebrow w-fit">{slide.badge}</span>}
                    {/* Exactly one <h1> on the page: the active slide. The rest use a
                        visually identical <p> so the reserved height is unchanged. */}
                    {isActive ? (
                      <h1 className={HEADING_CLASS}>{slide.title}</h1>
                    ) : (
                      <p className={HEADING_CLASS}>{slide.title}</p>
                    )}
                    {slide.description && (
                      <p className="max-w-md text-base text-muted-foreground md:text-[1.05rem]">
                        {slide.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-4">
                      {slide.ctaLabel && slide.ctaHref && (
                        <Link
                          to={slide.ctaHref}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          {slide.ctaLabel} <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      <Link
                        to="/store"
                        className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:text-bloom hover:underline"
                      >
                        {copy?.heroBrowseCta ?? "Browse the store"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>

                  {multiple && (
                    <div
                      className="flex items-center gap-2 pt-8"
                      role="group"
                      aria-label="Choose a slide"
                    >
                      {slides.map((s, j) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-current={j === index ? "true" : undefined}
                          aria-label={`Slide ${j + 1} of ${slides.length}: ${s.title || "Untitled"}`}
                          onClick={() => setIndex(j)}
                          className="grid h-11 place-items-center px-1"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "block h-1.5 rounded-full transition-all",
                              j === index
                                ? "w-8 bg-bloom"
                                : "w-3 bg-foreground/25 hover:bg-foreground/40",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
