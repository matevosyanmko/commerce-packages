import type { HomepageTile } from "@gucco/commerce-core";
import { StoreImage } from "./StoreImage";

/**
 * The CMS `shop_by_room` section — a row of curated entry points (the type name
 * is the backend's, shared with other stores). Here it's a scrollable "shelf" of
 * blooms: we use it for both the flower types ("Shop the garden") and the
 * occasions ("Find the right words").
 *
 * Tiles link with plain anchors rather than <Link>: some destinations carry a
 * query string (`/store?collection=…`), which the typed router's `to` doesn't
 * parse — a normal navigation reads the search param correctly on load.
 */
export function ShopByRoom({ heading, tiles }: { heading: string; tiles: HomepageTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section className="mt-20 md:mt-28">
      <div className="container-page">
        {heading && <h2 className="text-center text-[1.9rem] md:text-4xl">{heading}</h2>}
      </div>
      {/* A horizontal shelf. `marquee-fade` softens the scroll edges; the hidden
          scrollbar + mandatory snap make it read as a deliberate slider rather
          than a scroll box. Padded via container on both ends. `safe center`
          centres the tiles when they don't fill the row (e.g. the shorter
          occasions shelf) and falls back to `start` when they overflow, so a
          full shelf stays fully scrollable from its first tile. */}
      <div className="marquee-fade no-scrollbar mt-7 flex snap-x snap-mandatory scroll-smooth gap-4 overflow-x-auto px-5 pb-3 [justify-content:safe_center] md:gap-6 md:px-8 xl:px-11">
        {tiles.map((tile) => (
          <a
            key={tile.id}
            href={tile.link}
            className="group w-36 shrink-0 snap-start sm:w-44"
          >
            <div className="surface-card relative aspect-[4/5] overflow-hidden rounded-[1.4rem] ring-1 ring-border/50 transition-transform duration-[550ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-[5px]">
              {tile.image && (
                <StoreImage
                  src={tile.image}
                  size="sm"
                  alt=""
                  width={352}
                  height={440}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              )}
            </div>
            <div className="mt-2.5 px-1 text-center text-sm font-medium leading-tight">
              {tile.name}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
