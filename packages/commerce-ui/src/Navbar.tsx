import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { cn } from "@gucco/ui/utils";
import { useStorefront } from "./StorefrontProvider";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { SearchDialog, SearchTrigger } from "./SearchDialog";

const COUNT_BADGE =
  "absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bloom px-1 text-[10px] font-bold text-bloom-foreground";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { config, queries } = useStorefront();
  const { Wordmark } = config;
  const copy = config.copy;
  const cartNoun = copy?.cartNoun ?? { singular: "item", plural: "items" };

  // Prefetched by the root loader, so this resolves from the dehydrated cache
  // on first paint rather than firing a second request after hydration.
  const { data: categories = [] } = useQuery(queries.categoryTreeQO);
  const { data: collections = [] } = useQuery(queries.collectionsQO);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
      {/* Announcement strip — the brand's standing promise; absent = no strip */}
      {copy?.announcement != null && (
        <div className="bg-primary text-primary-foreground">
          <div className="container-page flex h-9 items-center justify-center gap-2 text-center text-[0.72rem] font-medium tracking-wide">
            {copy.announcement}
          </div>
        </div>
      )}

      {/* `relative` positions the megamenu panel against the full header width.
          `overflow-x-clip` contains the panels' motion: the ui/navigation-menu
          Content carries shadcn's `slide-*-52` (a 208px horizontal translate)
          for switching between menus, which on a viewport-wide panel pushes it
          past the edge and flashes a horizontal scrollbar. Clipping X (Y stays
          visible, so the panel still drops below the header) drops the scrollbar
          without touching the animation or the sticky header. */}
      <div className="relative border-b border-border/60 overflow-x-clip">
        <div className="container-page flex h-16 items-center gap-4 md:gap-7">
          <MobileNav categories={categories} collections={collections} />

          <Link to="/" className="shrink-0" aria-label={`${config.siteName} — home`}>
            {Wordmark ? (
              <Wordmark className="text-[1.4rem] md:text-2xl" />
            ) : (
              <span className="font-display text-[1.4rem] font-medium md:text-2xl">
                {config.siteName}
              </span>
            )}
          </Link>

          <MegaMenu categories={categories} collections={collections} />

          {/* shrink-0: the nav can overflow into "More", but cart and account
              must never be squeezed off-screen. */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
            <Link
              to="/favorites"
              aria-label={
                favoriteCount > 0
                  ? `Saved, ${favoriteCount} saved`
                  : copy?.savedItemsLabel ?? "Saved items"
              }
              className="relative rounded-full p-2.5 hover:bg-accent"
            >
              <Heart className={cn("h-[1.15rem] w-[1.15rem]", favoriteCount > 0 && "fill-bloom text-bloom")} />
              {favoriteCount > 0 && (
                <span aria-hidden="true" className={COUNT_BADGE}>
                  {favoriteCount}
                </span>
              )}
            </Link>
            <Link to="/account" aria-label="Account" className="rounded-full p-2.5 hover:bg-accent">
              <User className="h-[1.15rem] w-[1.15rem]" />
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Basket"
              className="relative rounded-full p-2.5 hover:bg-accent"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" />
              {/* aria-live so screen readers announce the count changing after
                  an add — it updates without any navigation. */}
              <span aria-live="polite" aria-atomic="true" className="sr-only">
                {itemCount} {itemCount === 1 ? cartNoun.singular : cartNoun.plural} in your basket
              </span>
              {itemCount > 0 && (
                <span aria-hidden="true" className={COUNT_BADGE}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
