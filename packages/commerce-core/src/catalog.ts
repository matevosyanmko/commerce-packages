// Pure catalog operations: sorting, in-memory faceted filtering and facet
// derivation. These take neutral `types.ts` data as arguments and hold no state
// and no brand data, so they are plain exports (no factory) shared by every
// storefront and identical whether the data came from mock fixtures or Medusa.

import type { Facet, Facets, Product, ProductFilters, SortKey } from "./types";
import { productPrice, stockQuantity } from "./pricing";

export function sortProducts(items: Product[], sort: SortKey, regionId?: string): Product[] {
  const list = [...items];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => productPrice(a, regionId) - productPrice(b, regionId));
    case "price-desc":
      return list.sort((a, b) => productPrice(b, regionId) - productPrice(a, regionId));
    case "newest":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return list;
  }
}

export function filtersActive(f?: ProductFilters): boolean {
  if (!f) return false;
  return (
    f.minPrice != null ||
    f.maxPrice != null ||
    f.inStockOnly === true ||
    f.collection != null ||
    f.subcategory != null ||
    (f.tags != null && f.tags.length > 0) ||
    (f.optionValues != null && Object.values(f.optionValues).some((vals) => vals.length > 0))
  );
}

function matchesOption(product: Product, name: string, value: string): boolean {
  return product.variants.some((v) => v.options[name] === value);
}

/**
 * In-memory facet filtering. Values within one option/tag group are OR-ed;
 * separate groups are AND-ed — the convention every faceted catalog uses.
 */
export function applyFilters(items: Product[], f: ProductFilters, regionId?: string): Product[] {
  return items.filter((p) => {
    const price = productPrice(p, regionId);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.inStockOnly && !p.variants.some((v) => v.stock > 0)) return false;
    if (f.subcategory && !p.categoryHandles.includes(f.subcategory)) return false;
    if (f.collection && p.collectionHandle !== f.collection) return false;
    if (f.tags?.length && !f.tags.some((t) => p.tags?.includes(t))) return false;
    if (f.optionValues) {
      for (const [name, selected] of Object.entries(f.optionValues)) {
        if (!selected.length) continue;
        if (!selected.some((value) => matchesOption(p, name, value))) return false;
      }
    }
    return true;
  });
}

// ---------- Derived facets for filters ----------
const UNIT_SCALE: Record<string, number> = {
  cm: 1,
  m: 100,
  mm: 0.1,
};

function magnitude(value: string): number | null {
  const match = /^([\d.]+)\s*([a-z"]*)$/i.exec(value.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2].toLowerCase();
  if (!unit) return amount;
  const scale = UNIT_SCALE[unit];
  return scale === undefined ? null : amount * scale;
}

function toFacet(key: string, label: string, counts: Map<string, number>): Facet {
  const values = [...counts.entries()].map(([value, count]) => ({ value, label: value, count }));
  const allNumeric = values.every((v) => magnitude(v.value) !== null);
  values.sort(
    allNumeric
      ? (a, b) => magnitude(a.value)! - magnitude(b.value)!
      : (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
  return { key, label, values };
}

function tally(items: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

export function getFacets(
  products: Product[],
  subcategoryNames: Map<string, string> = new Map(),
  collectionNames: Map<string, string> = new Map(),
  regionId?: string,
): Facets {
  const prices = products.map((p) => productPrice(p, regionId)).filter((n) => n > 0);

  const optionCounts = new Map<string, Map<string, number>>();
  for (const product of products) {
    const seen = new Map<string, Set<string>>();
    for (const variant of product.variants) {
      for (const [name, value] of Object.entries(variant.options)) {
        if (!value) continue;
        if (!seen.has(name)) seen.set(name, new Set());
        seen.get(name)!.add(value);
      }
    }
    for (const [name, values] of seen) {
      if (!optionCounts.has(name)) optionCounts.set(name, new Map());
      const bucket = optionCounts.get(name)!;
      for (const value of values) bucket.set(value, (bucket.get(value) ?? 0) + 1);
    }
  }

  const keepIfUseful = (facet: Facet, min = 2): Facet[] => (facet.values.length >= min ? [facet] : []);
  const relabel = (facet: Facet, names: Map<string, string>): Facet => ({
    ...facet,
    values: facet.values.map((v) => ({ ...v, label: names.get(v.value) ?? v.label })),
  });

  const subcategoryFacet = relabel(
    toFacet("subcategory", "Type", tally(products.flatMap((p) => p.categoryHandles.filter((h) => subcategoryNames.has(h))))),
    subcategoryNames,
  );

  const collectionFacet = relabel(
    toFacet("collection", "Occasion", tally(products.map((p) => p.collectionHandle ?? "").filter(Boolean))),
    collectionNames,
  );

  // Reduced rather than `Math.min(...prices)`: the spread passes one argument
  // per product, and an engine's argument limit (~124k in V8) is a hard ceiling
  // — past it this throws RangeError instead of returning a range. A catalog
  // that large is unusual, but the failure would land in a PLP loader with a
  // stack trace pointing at Math.min, which explains nothing.
  const priceRange = prices.reduce(
    (range, price) => ({ min: Math.min(range.min, price), max: Math.max(range.max, price) }),
    { min: Infinity, max: -Infinity },
  );

  return {
    price: {
      min: prices.length ? Math.floor(priceRange.min) : 0,
      max: prices.length ? Math.ceil(priceRange.max) : 0,
    },
    options: [...optionCounts.entries()]
      .map(([name, counts]) => toFacet(name, name, counts))
      .filter((f) => f.values.length > 1)
      .sort((a, b) => a.label.localeCompare(b.label)),
    subcategories: keepIfUseful(subcategoryFacet, 1),
    // Colours live in `tags` — the panel renders this facet as swatches.
    collections: keepIfUseful(collectionFacet),
    tags: keepIfUseful(toFacet("tag", "Colour", tally(products.flatMap((p) => p.tags ?? [])))),
    inStockCount: products.filter((p) => stockQuantity(p) > 0).length,
  };
}
