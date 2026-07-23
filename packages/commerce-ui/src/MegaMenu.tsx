import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Category, Collection, Product } from "@storefront/commerce-core";
import { useStorefront } from "./StorefrontProvider";
import { useRegion } from "./RegionProvider";
import { minVariantPrice } from "@storefront/commerce-core";
import { useOverflowCount } from "./use-overflow-count";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@storefront/ui/navigation-menu";
import { cn } from "@storefront/ui";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

const MORE_KEY = "__more__";

/**
 * Desktop category megamenu, built on Radix `NavigationMenu`.
 *
 * The panel is assembled from whatever the catalog actually has, so it stays
 * useful at any depth:
 *
 *   - subcategories, when a category has `children` in Medusa;
 *   - collections, as a cross-cutting way in;
 *   - real products from the category, as a visual preview.
 *
 * Today's catalog is flat, so the first zone is empty and the panel leads with
 * collections + products. The moment categories with parents exist in the
 * backend, the subcategory columns appear on their own — no code change.
 *
 * Radix owns the behaviour: roving tabindex across the triggers (one tab stop
 * for the whole row, arrows to move), hover intent, Tab into the open panel,
 * Escape-to-close with focus restored to its trigger, and dismissal when a link
 * inside a panel is chosen. Only two things are ours: which categories fit on
 * the row (`useOverflowCount`) and where the panel sits.
 *
 * Positioning (the classic megamenu bug): the panels are full-bleed, pinned to
 * both edges of the HEADER rather than to a trigger. That takes two overrides —
 * `viewport={false}`, because Radix's shared viewport is a popup box sized to
 * its content, and forcing Radix's inline-styled indicator track back to
 * `static`, because otherwise it becomes the panels' containing block and they
 * shrink to the width of the nav row. The header owns `relative`.
 */
export function MegaMenu({
  categories,
  collections,
}: {
  categories: Category[];
  collections: Collection[];
}) {
  // Radix models "nothing open" as the empty string, not null.
  const [value, setValue] = useState("");
  const { region } = useRegion();
  const { queries } = useStorefront();

  // Product previews are worth a request only once someone opens a panel —
  // the navbar shouldn't pull the catalog on first paint. No region argument:
  // the PLPs share this cache entry, so on a category or store page the panel
  // reads what SSR already fetched instead of pulling the catalog again.
  const { data: catalog } = useQuery({
    ...queries.allProductsQO(),
    enabled: value !== "",
  });

  // Category names come from the backend and vary wildly in length, so how
  // many fit is measured, not guessed. The rest fold into a "More" panel.
  const { containerRef, visibleCount, measured } = useOverflowCount(
    categories.length,
  );

  if (categories.length === 0) return null;

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);

  return (
    <NavigationMenu
      aria-label="Categories"
      value={value}
      onValueChange={setValue}
      viewport={false}
      className={cn(
        "hidden min-w-0 max-w-none flex-1 justify-start lg:flex",
        // Radix wraps the list in an indicator track it owns and gives no
        // className to, so both fixes for it land here:
        //   `static!` — it is inline-styled `position: relative`, which would
        //   make it the panels' containing block and shrink them to the width
        //   of the nav row; the panels must span the header instead.
        //   `w-full` — as a bare flex item it sizes to its content, so the row
        //   would measure its own overflowing width and never trim to "More".
        "static [&>div]:static! [&>div]:w-full",
      )}
    >
      <NavigationMenuList
        ref={containerRef as React.Ref<HTMLUListElement>}
        className={cn(
          "flex-1 justify-start space-x-0.5 overflow-hidden",
          // Hidden for the one frame between mount and measurement so the
          // full, overflowing list never flashes.
          !measured && "invisible",
        )}
      >
        {visible.map((category) => (
          <NavigationMenuItem
            key={category.id}
            value={category.id}
            className="shrink-0"
          >
            <NavigationMenuTrigger className={TRIGGER_CLASS}>
              {category.name}
            </NavigationMenuTrigger>
            <MegaMenuPanel
              category={category}
              collections={collections}
              products={catalog ?? []}
            />
          </NavigationMenuItem>
        ))}
        {overflow.length > 0 && (
          <NavigationMenuItem value={MORE_KEY} className="shrink-0">
            <NavigationMenuTrigger className={TRIGGER_CLASS}>
              More
            </NavigationMenuTrigger>
            <OverflowPanel categories={overflow} collections={collections} />
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// The `ui/` trigger is styled as a shadcn dropdown button; this restyles it as
// the header's pill without touching its behaviour or its chevron.
const TRIGGER_CLASS = cn(
  "h-auto whitespace-nowrap rounded-full bg-transparent px-3 py-2 text-sm font-normal",
  "text-muted-foreground hover:bg-transparent hover:text-foreground",
  "focus:bg-transparent focus:text-foreground",
  "data-[state=open]:bg-accent data-[state=open]:text-foreground",
);

// Full bleed: pinned to both edges of the header, not the trigger.
const PANEL_CLASS = "absolute left-0 right-0 top-full z-50 w-auto border-b backdrop-blur-xl fade-up";

/** The remaining categories that didn't fit on the row. */
function OverflowPanel({
  categories,
  collections,
}: {
  categories: Category[];
  collections: Collection[];
}) {
  return (
    <NavigationMenuContent
      className={cn(PANEL_CLASS, "border-border/60 bg-background/95")}
    >
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <PanelColumn title="More categories">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 xl:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <NavigationMenuLink asChild>
                  <Link
                    to="/categories/$handle"
                    params={{ handle: category.handle }}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {category.name}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </PanelColumn>
        {collections.length > 0 && <CollectionsColumn collections={collections} />}
      </div>
    </NavigationMenuContent>
  );
}

function MegaMenuPanel({
  category,
  collections,
  products,
}: {
  category: Category;
  collections: Collection[];
  products: Product[];
}) {
  const { region } = useRegion();
  const children = category.children ?? [];

  // Newest first — the panel used to rank these by a metadata `rating`, which
  // was demo data, not a popularity signal.
  const preview = products
    .filter((p) => p.categoryHandles.includes(category.handle))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <NavigationMenuContent
      className={cn(PANEL_CLASS, "border-border/100 bg-background/100")}
    >
      <div className="container-page py-10">
        <div className="flex items-baseline justify-between gap-4">
          <div className="eyebrow">{category.name}</div>
          <NavigationMenuLink asChild>
            <Link
              to="/categories/$handle"
              params={{ handle: category.handle }}
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Shop all {category.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </NavigationMenuLink>
        </div>

        <div
          className={cn(
            "mt-6 grid gap-10",
            children.length > 0
              ? "lg:grid-cols-[1.4fr_200px_minmax(0,1fr)]"
              : "lg:grid-cols-[240px_minmax(0,1fr)]",
          )}
        >
          {children.length > 0 && (
            <PanelColumn title="Shop by type">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {children.map((child) => (
                  <li key={child.id}>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/categories/$handle"
                        params={{ handle: child.handle }}
                        className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
                      >
                        <span className="text-sm font-medium">{child.name}</span>
                        {/* Third level stays a hint rather than a nested flyout —
                            one hover target is enough. */}
                        {!!child.children?.length && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {child.children.map((c) => c.name).join(" · ")}
                          </span>
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </PanelColumn>
          )}

          {collections.length > 0 && <CollectionsColumn collections={collections} />}

          {preview.length > 0 && (
            <PanelColumn title="Fresh cuts">
              <ul className="grid grid-cols-3 gap-4">
                {preview.map((product) => (
                  <li key={product.id}>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products/$handle"
                        params={{ handle: product.handle }}
                        className="group block"
                      >
                        <div className="surface-card aspect-square overflow-hidden rounded-xl">
                          <StoreImage
                            src={product.images[0]}
                            size="sm"
                            alt=""
                            width={200}
                            height={200}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="mt-2 truncate text-xs font-medium">
                          {product.title}
                        </div>
                        <Price
                          amount={minVariantPrice(product, region.id).amount}
                          compact
                          className="text-muted-foreground"
                        />
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </PanelColumn>
          )}
        </div>
      </div>
    </NavigationMenuContent>
  );
}

function CollectionsColumn({ collections }: { collections: Collection[] }) {
  return (
    <PanelColumn title="Occasions">
      <ul className="space-y-0.5">
        {collections.slice(0, 6).map((collection) => (
          <li key={collection.id}>
            <NavigationMenuLink asChild>
              <Link
                to="/store"
                search={{ collection: collection.handle }}
                className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {collection.title}
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </PanelColumn>
  );
}

function PanelColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
