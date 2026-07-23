# commerce-packages

Shared, publishable packages behind our Medusa + TanStack Start storefronts
(flowers, furniture, electronics, …). One repo, developed together; each package
publishes independently under the `@storefront/*` scope and is installed by each
store's own repo.

> **Why:** the storefronts are deliberately identical except content, branding and
> styling. Anything that moves between them unchanged lives here, so a fix lands
> once instead of being copied N times.

## Packages

| Package | What it is | Status |
| ------- | ---------- | ------ |
| `@storefront/commerce-core` | Backend-neutral data seam — catalog, cart, orders, customer, pricing, filters, facets, Medusa↔neutral mapping. **Zero brand data, zero brand literals.** | ✅ extracted |
| `@storefront/ui` | Radix UI primitive wrappers (brand-agnostic). | ⏳ planned |
| `@storefront/commerce-ui` | Shared commerce components + providers (StoreImage, MegaMenu, cart, checkout, …). | ⏳ planned |
| `@storefront/config` | Shared tsconfig / eslint / Tailwind preset. | ⏳ planned |

## The one rule

**A package never reads a brand literal or an env var.** Anything per-store —
the catalog, the `localStorage` prefix, the currency, the store's shipping /
payment / promo config, user-facing copy — is **injected**, not imported.

`commerce-core` expresses this with a factory: the store builds an API instance
by handing in its own data and config.

```ts
import { createCommerceApi } from "@storefront/commerce-core";

export const api = createCommerceApi({
  data: {
    products, categories, collections, regions,
    defaultRegionId, featuredHandles, newArrivalHandles,
  },
  storagePrefix: "fleurette.",
  currency: "EUR",
  shippingOptions,
  paymentProviders,
  promos,
  // copy: { variantUnavailable: "That flower is no longer available.", … }
});

// Re-export the named functions the UI already imports:
export const { getProduct, listProducts, addLineItem /* … */ } = api;
```

The pure helpers (`sortProducts`, `applyFilters`, `filtersActive`, `getFacets`)
and the neutral domain types are plain exports — they need no config.

## Develop

```bash
bun install
bun run build       # build every @storefront/* package to dist
bun run typecheck   # typecheck every package
bun run smoke       # run the commerce-core smoke harness (playground/)
```

`playground/` is a throwaway harness, not a store. Its `smoke.ts` drives
`commerce-core` against a **gadgets** fixture (deliberately not flowers) to prove
the core is genuinely domain-agnostic.

## Consume from a store

Until published, link locally:

```bash
# in a store repo
bun link @storefront/commerce-core   # after `bun link` inside the package
```

Once published to a registry, stores `bun add @storefront/commerce-core` and
pin versions independently.
