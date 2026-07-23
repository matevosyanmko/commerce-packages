// Helpers for reading a variant's price out of the region-keyed price map.
// With a Medusa backend each product is fetched for a single region, so a
// variant carries exactly one price entry. These helpers look it up by region
// id when available and otherwise fall back to whatever price is present, so
// callers never need to hard-code a region key.

import type { Product, ProductVariant } from "./types";

export interface VariantPrice {
  amount: number;
  compareAt?: number;
}

export function variantPrice(variant: ProductVariant, regionId?: string): VariantPrice {
  const byRegion = regionId ? variant.prices[regionId] : undefined;
  return byRegion ?? Object.values(variant.prices)[0] ?? { amount: 0 };
}

export function minVariantPrice(product: Product, regionId?: string): VariantPrice {
  return (
    product.variants
      .map((v) => variantPrice(v, regionId))
      .sort((a, b) => a.amount - b.amount)[0] ?? { amount: 0 }
  );
}

/** Cheapest variant amount — the "from" price on cards, and the sort/filter key. */
export function productPrice(product: Product, regionId?: string): number {
  return minVariantPrice(product, regionId).amount;
}

/** True when any variant can be bought right now. */
export function inStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

/** Total sellable units across variants — the in-stock facet counts on this. */
export function stockQuantity(product: Product): number {
  return product.variants.reduce((total, v) => total + v.stock, 0);
}
