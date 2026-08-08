import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@wm-storefront/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@wm-storefront/ui/dialog";
import { useDebouncedValue } from "./use-debounced-value";
import { useStorefront } from "./StorefrontProvider";
import { useRegion } from "./RegionProvider";
import { minVariantPrice } from "@wm-storefront/commerce-core";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

const MIN_QUERY_LENGTH = 2;

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <>
      {/* Compact on mobile where header space is scarce, a hinted search box on
          desktop — the affordance shoppers actually look for. */}
      <button
        onClick={onClick}
        aria-label="Search products"
        className="rounded-full p-2 hover:bg-accent md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>
      <button
        onClick={onClick}
        className="hidden items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground md:inline-flex"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="ml-2 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground">
          /
        </kbd>
      </button>
    </>
  );
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { region } = useRegion();
  const { queries } = useStorefront();
  const debounced = useDebouncedValue(query, 250);
  const term = debounced.trim();
  const enabled = term.length >= MIN_QUERY_LENGTH;

  const { data: categories = [] } = useQuery(queries.categoryTreeQO);
  // Shares its cache entry with the /search page, so pressing Enter renders
  // the results already on screen instead of asking the backend again.
  const { data, isFetching } = useQuery({ ...queries.searchQO(term), enabled });

  // "/" focuses search the way it does on most catalogs — but not while the
  // shopper is typing into a form field somewhere else on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // The dialog previews the top few; the full set lives on /search.
  const products = (data ?? []).slice(0, 6);

  const goToResults = () => {
    if (!term) return;
    onOpenChange(false);
    navigate({ to: "/search", search: { q: term } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">Search products</DialogTitle>
        {/* cmdk filters its items client-side by default, which would re-filter
            (and hide) results the backend already matched on description or
            handle. The server owns matching here. */}
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search for products, brands and categories…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && products.length === 0) goToResults();
            }}
          />
          <CommandList className="max-h-[60vh]">
            {!enabled && (
              <div className="p-4">
                <div className="eyebrow px-2">Browse categories</div>
                <div className="mt-3 flex flex-wrap gap-2 px-2 pb-2">
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.id}
                      to="/categories/$handle"
                      params={{ handle: category.handle }}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {enabled && isFetching && products.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {enabled && !isFetching && products.length === 0 && (
              <CommandEmpty className="py-12 text-center text-sm">
                <div className="font-medium text-foreground">
                  No matches for “{term}”
                </div>
                <div className="mt-1 text-muted-foreground">
                  Try a broader term, or browse the full store.
                </div>
                <Link
                  to="/store"
                  onClick={() => onOpenChange(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  Browse all products <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CommandEmpty>
            )}

            {products.length > 0 && (
              <CommandGroup heading="Products">
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => {
                      onOpenChange(false);
                      navigate({
                        to: "/products/$handle",
                        params: { handle: product.handle },
                      });
                    }}
                    className="gap-3 rounded-xl"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      <StoreImage
                        src={product.images[0]}
                        size="sm"
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {product.title}
                      </div>
                      {product.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                          {product.subtitle}
                        </div>
                      )}
                    </div>
                    <Price
                      amount={minVariantPrice(product, region.id).amount}
                      compact
                      className="shrink-0"
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>

          {enabled && products.length > 0 && (
            <button
              onClick={goToResults}
              className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span>
                See all results for “{term}”
                {data?.length ? ` (${data.length})` : ""}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  );
}
