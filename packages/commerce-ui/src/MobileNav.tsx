import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import type { Category, Collection } from "@storefront/commerce-core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@storefront/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@storefront/ui/sheet";
import { useStorefront } from "./StorefrontProvider";

/**
 * Mobile category drawer, and the hamburger that opens it.
 *
 * Built on ui/sheet (Radix Dialog) so focus trapping, Escape and body scroll
 * locking come for free — the same primitive CartDrawer uses. Every row is a
 * full-width tap target well over the 44px minimum, and `SheetClose asChild`
 * means navigating anywhere closes the drawer without a single manual handler.
 *
 * The hamburger has to be the `SheetTrigger` rather than a button in the navbar
 * driving an `open` prop: Radix restores focus to `triggerRef` on close, so a
 * triggerless (fully controlled) sheet drops focus to `<body>` and leaves a
 * keyboard user stranded at the top of the document. Owning the trigger here
 * also means the open state, `aria-expanded` and `aria-controls` are Radix's.
 *
 * Hover menus don't exist on touch, so subcategories expand on tap via
 * ui/accordion (`type="single"`, so one open row at a time).
 *
 * A category with no children is a plain link, not a collapsible row — with
 * today's flat catalog that's every row, and the accordion lights up on its own
 * once categories with parents exist in the backend.
 */
export function MobileNav({
  categories,
  collections,
}: {
  categories: Category[];
  collections: Collection[];
}) {
  const { config } = useStorefront();
  const { Wordmark } = config;
  return (
    <Sheet>
      <SheetTrigger className="-ml-2 p-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        // The drawer is the whole screen on a phone, and the shell supplies its
        // own padding via `container-page`.
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm lg:hidden"
        aria-describedby={undefined}
      >
        <SheetHeader className="container-page flex h-14 shrink-0 flex-row items-center border-b border-border/60 text-left">
          <SheetTitle asChild>
            {Wordmark ? (
              <Wordmark className="text-xl" />
            ) : (
              <span className="font-display text-xl font-medium">{config.siteName}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <nav
          className="container-page flex-1 overflow-y-auto py-6"
          aria-label="Categories"
        >
          <Accordion type="single" collapsible>
            {categories.map((category) => {
              const children = category.children ?? [];

              if (children.length === 0) {
                return (
                  <div key={category.id} className="border-b border-border/60">
                    <SheetClose asChild>
                      <Link
                        to="/categories/$handle"
                        params={{ handle: category.handle }}
                        className="block py-4 text-lg font-medium tracking-tight"
                      >
                        {category.name}
                      </Link>
                    </SheetClose>
                  </div>
                );
              }

              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border-border/60"
                >
                  <AccordionTrigger className="py-4 text-lg font-medium tracking-tight hover:no-underline">
                    {category.name}
                  </AccordionTrigger>
                  <AccordionContent className="pl-4">
                    <ul>
                      {/* The row itself now expands rather than navigates, so
                          the category's own page needs a link of its own. */}
                      <li>
                        <SheetClose asChild>
                          <Link
                            to="/categories/$handle"
                            params={{ handle: category.handle }}
                            className="block py-3 text-base font-medium"
                          >
                            Shop all {category.name}
                          </Link>
                        </SheetClose>
                      </li>
                      {children.map((child) => (
                        <li key={child.id}>
                          <SheetClose asChild>
                            <Link
                              to="/categories/$handle"
                              params={{ handle: child.handle }}
                              className="block py-3 text-base text-muted-foreground"
                            >
                              {child.name}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {collections.length > 0 && (
            <div className="mt-8">
              <div className="eyebrow">{config.copy?.collectionsLabel ?? "Collections"}</div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <SheetClose asChild>
                      <Link
                        to="/store"
                        search={{ collection: collection.handle }}
                        className="inline-flex rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
                      >
                        {collection.title}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col">
            <SheetClose asChild>
              <Link to="/favorites" className="block py-3 text-base text-muted-foreground">
                {config.copy?.savedItemsLabel ?? "Saved items"}
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link to="/account" className="block py-3 text-base text-muted-foreground">
                Account
              </Link>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
