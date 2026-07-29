# @gucco/commerce-core

The backend-neutral data seam. **No JSX, no React, no brand data.** If you're adding
something that renders, it belongs in `commerce-ui` instead.

## Shape

```
types.ts        the ONLY shapes the UI ever sees — all camelCase
api.ts          createCommerceApi(config) — the factory
catalog.ts      sortProducts / applyFilters / filtersActive / getFacets (pure, no config)
pricing.ts      variantPrice / minVariantPrice / productPrice / inStock / stockQuantity
filters.ts      the zod search-param seam shared by both PLPs
medusa-map.ts   Medusa -> neutral mapping + category tree helpers
money.ts        formatMoney / discountPercent
homepage-types.ts  CMS section SHAPES (content is per-store)
```

## Adding data access

Add it **inside the factory** in `api.ts` and to its returned object, so it can reach the
injected `config`. Then export it from `index.ts`.

If the function needs no config — it takes everything as arguments — put it in
`catalog.ts` as a plain export instead. Plain exports are cheaper for stores to use and
easier to test; prefer them when there's a choice.

## Rules

- **Prices are region-keyed.** Never read `variant.prices[…]` directly — always go through
  `pricing.ts`. Stock lives on `variant.stock`.
- **Never import `@medusajs/*` outside `medusa-map.ts`.** Medusa types must not leak into
  `types.ts` or any consumer.
- **`types.ts` stays neutral.** No flower, furniture or gadget vocabulary — it's `Product`,
  not `Bouquet`.
- Mock-vs-Medusa is a **body** change, never a **signature** change. The factory's returned
  function signatures are the contract; swapping the mock bodies for SDK-backed ones must
  not touch a single call site in any store.
- Facets are **derived** (`getFacets`), never stored — Medusa's store API can't aggregate.
  Within an option group values are OR-ed; separate groups are AND-ed.

## Verifying

```bash
bun run --cwd ../.. smoke
```

`playground/smoke.ts` drives the factory against a **gadgets** fixture — deliberately not
flowers, to keep the core honest. Add assertions there when you add behaviour; it's the
only test this package has.
