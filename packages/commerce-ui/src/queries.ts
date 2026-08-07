// Shared query options for data the app shell needs on every route.
//
// The navbar megamenu, the footer and the search dialog all read the same
// datasets; defining the options once keeps each dataset on a single cache key,
// so the shell costs one request per session instead of one per component — and
// the app's root loader can prefetch them for SSR.
//
// Built from the injected api instance: the app calls
// `createStorefrontQueries(api, defaultRegionId)` once, uses the result in its
// route loaders, and passes the SAME object to StorefrontProvider so package
// components (MegaMenu, SearchDialog, Footer) share the cache keys with the
// loaders.

import { queryOptions } from "@tanstack/react-query";
import type { CommerceApi } from "@wm-storefront/commerce-core";

export function createStorefrontQueries(api: CommerceApi, defaultRegionId: string) {
  /**
   * The region segment of a cache key for any region-scoped query.
   *
   * Route loaders run before RegionProvider exists, so they pass `""` and let
   * the api layer resolve it; components hold a real `region.id`. Those are the
   * SAME region, but they'd be different cache keys — so an SSR prefetch would
   * never match what the component asks for, and the browser would refetch on
   * hydration. Every region-scoped key goes through this instead.
   *
   * **Callers should pass nothing** while the store runs in one region. If a
   * region switcher is ever added, pass `region.id` at *every* call site —
   * loaders included — and the keys will split per region correctly again.
   */
  const regionKey = (regionId?: string) => regionId || defaultRegionId || "default";

  return {
    regionKey,

    categoryTreeQO: queryOptions({
      queryKey: ["categories", "tree"],
      queryFn: api.getCategoryTree,
    }),

    categoriesQO: queryOptions({
      queryKey: ["categories"],
      queryFn: api.listCategories,
    }),

    collectionsQO: queryOptions({
      queryKey: ["collections"],
      queryFn: api.listCollections,
    }),

    /**
     * The whole catalog on one cache key.
     *
     * Filtering happens in memory anyway, so every consumer — the store PLP,
     * the category pages, the megamenu's product previews — reads this single
     * fetch instead of issuing its own. Callers that only need it on
     * interaction should pass `enabled` so the navbar doesn't pull the catalog
     * on first paint.
     */
    allProductsQO: (regionId?: string) =>
      queryOptions({
        queryKey: ["all-products", regionKey(regionId)],
        queryFn: () => api.listAllProducts(regionId ?? defaultRegionId),
      }),

    /**
     * Results for one search term, shared by the navbar's search dialog and the
     * /search page. They ask the backend the same question, so they share a
     * cache entry too. Callers override `enabled` — the dialog waits for a
     * minimum term length, the page runs on anything non-empty.
     */
    searchQO: (q: string, regionId?: string) =>
      queryOptions({
        queryKey: ["search", q, regionKey(regionId)],
        queryFn: () => api.searchProducts(q, regionId ?? defaultRegionId),
        enabled: q.length > 0,
        // Results for a term don't change between keystrokes; keeping them
        // fresh for a minute makes backspacing through a query feel instant.
        staleTime: 60_000,
      }),
  };
}

export type StorefrontQueries = ReturnType<typeof createStorefrontQueries>;
