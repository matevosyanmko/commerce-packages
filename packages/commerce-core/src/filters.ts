// Shared filter state for listing pages (store / category). The filter
// selection lives in the URL search params so it is shareable, bookmarkable and
// survives a reload — mirroring how `sort` and `page` are already handled.

import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";
import type { ProductFilters, SortKey } from "./types";

export const SORT_KEYS: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

// Search-param fields the filter sidebar owns. Spread into a route's search
// schema alongside `sort` / `page`.
export const filterSearchFields = {
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: fallback(z.boolean(), false).default(false),
  // Selected option values keyed by option name, e.g. { Storage: ["256GB"] }.
  // A record rather than the flat "Option:Value" strings the panel used to
  // encode — the grouping is what the AND/OR filter logic needs anyway.
  opts: z.record(z.string(), z.array(z.string())).optional(),
  collection: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
};

export interface FilterSearch {
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  opts?: Record<string, string[]>;
  collection?: string;
  subcategory?: string;
  tags?: string[];
}

// The panel's working shape — array selections are always concrete.
export interface FilterValue {
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  options: Record<string, string[]>;
  collection?: string;
  subcategory?: string;
  tags: string[];
}

export function searchToValue(search: FilterSearch): FilterValue {
  return {
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    inStock: search.inStock,
    options: search.opts ?? {},
    collection: search.collection,
    subcategory: search.subcategory,
    tags: search.tags ?? [],
  };
}

// Collapse the panel state back into clean search params: drop empty selections
// and false/undefined values so the URL stays tidy.
export function valueToSearch(value: FilterValue): FilterSearch {
  const opts = Object.fromEntries(
    Object.entries(value.options).filter(([, vals]) => vals.length > 0),
  );
  return {
    minPrice: value.minPrice,
    maxPrice: value.maxPrice,
    inStock: value.inStock,
    opts: Object.keys(opts).length ? opts : undefined,
    collection: value.collection,
    subcategory: value.subcategory,
    tags: value.tags.length ? value.tags : undefined,
  };
}

export function searchToProductFilters(search: FilterSearch): ProductFilters {
  const opts = search.opts
    ? Object.fromEntries(Object.entries(search.opts).filter(([, vals]) => vals.length > 0))
    : undefined;
  return {
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    inStockOnly: search.inStock || undefined,
    optionValues: opts && Object.keys(opts).length ? opts : undefined,
    collection: search.collection,
    subcategory: search.subcategory,
    tags: search.tags?.length ? search.tags : undefined,
  };
}

// True when the current search actually narrows the result set. Used to decide
// whether the pre-loaded initial data still applies.
export function hasActiveFilters(search: FilterSearch): boolean {
  return (
    search.minPrice != null ||
    search.maxPrice != null ||
    search.inStock === true ||
    search.collection != null ||
    search.subcategory != null ||
    (search.tags != null && search.tags.length > 0) ||
    (search.opts != null && Object.values(search.opts).some((v) => v.length > 0))
  );
}

// Count of distinct active facets, for the mobile "Filters (n)" badge.
export function activeFilterCount(value: FilterValue): number {
  let n = 0;
  if (value.minPrice != null || value.maxPrice != null) n += 1;
  if (value.inStock) n += 1;
  if (value.collection) n += 1;
  if (value.subcategory) n += 1;
  n += value.tags.length;
  n += Object.values(value.options).filter((vals) => vals.length > 0).length;
  return n;
}

/** Toggle `item` in/out of a list, returning undefined when the list empties. */
export function toggleInList(list: string[] | undefined, item: string): string[] | undefined {
  const next = new Set(list ?? []);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next.size > 0 ? [...next] : undefined;
}
