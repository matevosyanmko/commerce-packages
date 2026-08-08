# commerce-packages

Shared, publishable packages behind our Medusa + TanStack Start storefronts
(flowers, furniture, electronics, …). One repo, developed together; each package
publishes independently under the `@wm-storefront/*` scope and is installed by each
store's own repo.

> **Why:** the storefronts are deliberately identical except content, branding and
> styling. Anything that moves between them unchanged lives here, so a fix lands
> once instead of being copied N times.

## Packages

| Package | What it is | Status |
| ------- | ---------- | ------ |
| `@wm-storefront/commerce-core` | Backend-neutral data seam — catalog, cart, orders, customer, pricing, filters, facets, Medusa↔neutral mapping. **Zero brand data, zero brand literals.** | ✅ extracted |
| `@wm-storefront/ui` | 46 Radix UI primitive wrappers + `cn()` + `use-mobile` (brand-agnostic). | ✅ extracted |
| `@wm-storefront/commerce-ui` | Shared commerce components + the four providers (StorefrontProvider, StoreImage, Navbar, MegaMenu, cart, filters, homepage sections, …). | ✅ extracted |
| `@wm-storefront/config` | Tailwind theme contract + tsconfig base + prettier config. | ✅ extracted |

## The one rule

**A package never reads a brand literal or an env var.** Anything per-store —
the catalog, the `localStorage` prefix, the currency, the store's shipping /
payment / promo config, user-facing copy — is **injected**, not imported.

`commerce-core` expresses this with a factory: the store builds an API instance
by handing in its own data and config.

```ts
import { createCommerceApi } from "@wm-storefront/commerce-core";

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

`commerce-ui` expresses the same rule as a provider: the app mounts one
`StorefrontProvider` carrying its config, its api instance and its query options.

```tsx
<StorefrontProvider config={storefrontConfig} api={api} queries={queries}>
```

`StorefrontConfig` is where a brand lives: `storagePrefix`, `siteName`, region
and currency defaults, a `Wordmark` component slot, `colourSwatches` for the tag
facet, an `inlineImage` resolver for brand image schemes, and a `copy` object of
brand-voiced strings. Every one is optional-with-a-neutral-fallback except the
first four, so a new store starts working before it starts looking like itself.

## Consuming store checklist

A store wiring these packages needs three things beyond `bun add`:

1. **`styles.css`** — import the theme contract and scan the package dists:
   ```css
   @source "../node_modules/@wm-storefront/ui/dist";
   @source "../node_modules/@wm-storefront/commerce-ui/dist";
   @import "@wm-storefront/config/theme.css";
   ```
   Tailwind's `source(none)` means classes used *only* inside a package are
   silently dropped without those `@source` lines.
2. **The CSS variables** listed at the top of `config/css/theme.css`, in `:root`
   and `.dark`. That's the whole re-skin.
3. **`vite.config.ts`** — while packages are consumed via `bun link`, add
   `ssr.noExternal` for `/^@wm-storefront\//` (plus `/^@radix-ui\//` and the other
   React-using UI libs) and extend `resolve.dedupe` with `@tanstack/react-router`,
   `sonner` and `lucide-react`. Symlinked packages otherwise resolve their own
   React and you get "Invalid hook call" in SSR. Unnecessary once installed from
   a registry.

## Known debt

The shared components reference brand-named tokens as Tailwind classes
(`text-bloom`, `bg-petal`, `text-sale`). Every consuming store must therefore
define `--bloom`, `--petal`, `--pollen`, `--sage` — a furniture store just points
them at its own accent colours. Renaming these to neutral token names
(`--accent-strong`, `--surface-alt`, …) is a clean future pass.

## Develop

```bash
bun install
bun run build       # build every @wm-storefront/* package to dist
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
bun link @wm-storefront/commerce-core   # after `bun link` inside the package
```

Once published to a registry, stores `bun add @wm-storefront/commerce-core` and
pin versions independently.
