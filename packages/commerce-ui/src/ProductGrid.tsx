import type { Product } from "@storefront/commerce-core";
import { ProductCard } from "./ProductCard";

// The first row is above the fold on every viewport we target, so those cards
// load their image eagerly — one of them is the LCP element.
const PRIORITY_COUNT = 4;

export function ProductGrid({
  products,
  emptyLabel = "Nothing matches those filters just yet — try widening your palette.",
}: {
  products: Product[];
  emptyLabel?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 py-24 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} priority={i < PRIORITY_COUNT} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-[1.6rem] bg-surface" />
          <div className="mt-4 h-3 w-1/3 rounded bg-surface" />
          <div className="mt-2 h-4 w-2/3 rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}
