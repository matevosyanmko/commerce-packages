# @gucco/commerce-ui

Shared commerce components and the four providers. This is where brand pressure is
highest — every component here is one careless string away from being flower-shaped.

## The injection seam

`StorefrontProvider` carries three things, read with `useStorefront()`:

```ts
const { config, api, queries } = useStorefront();
```

- **`api`** — the store's `createCommerceApi()` instance. Providers call it; presentational
  components generally shouldn't (they take data as props).
- **`queries`** — the store's `createStorefrontQueries()` object. **Always** read query
  options from here, never import them — that's what keeps cache keys shared with the
  store's route loaders so an SSR prefetch isn't refetched on hydration.
- **`config`** — everything brand:

| field | purpose |
| --- | --- |
| `storagePrefix` | build every `localStorage` key from it — never a literal |
| `siteName` | fallback wordmark, aria labels |
| `defaultRegionId` / `defaultCurrency` | first-render fallback region |
| `Wordmark` | component slot; falls back to `siteName` text |
| `colourSwatches` | tag facet renders swatches when present, checkboxes when not |
| `inlineImage` | resolves brand image schemes (`bloom:` …) to a data URI |
| `copy` | brand-voiced strings, each with a neutral default |

## Adding a component

1. Copy it in **verbatim**; rewrite imports only.
2. Find every brand string, brand image scheme, brand colour and hardcoded storage key.
3. Move each to `config` — a `copy.*` entry for a string, a `ReactNode`/`ComponentType`
   slot for markup, a data array for something structured.
4. **Give every one a neutral fallback**, so a store that sets nothing still renders.
5. Export from `index.ts` (check the real export names first).
6. Rebuild `dist`, then verify in a real store — build **and** browser.

Prefer a **slot** over a config string when the brand bit is markup (icons, links,
emphasis). `ProductInfo`'s `highlights` / `purchaseNote` / `perks` are the pattern: the
store composes them in its route with the exported `ProductChip` / `ProductPerk`.

## Rules

- **Hooks before early returns.** Several of these components `return null` on empty
  content; a `useStorefront()` added below that is a hooks-order violation.
- **Presentational components take data as props.** Only providers should reach for `api`.
- **Never hardcode a `localStorage` key** — always `` `${config.storagePrefix}thing` ``.
- Provider mount order is fixed: **Region → Auth → Favorites → Cart**, all inside
  `StorefrontProvider`. Auth wraps Cart so login can claim the guest cart; Favorites is
  inside Auth because the list lives on the customer record.
- The cart is created **lazily on first add**, never on mount — a cart per visitor fills
  the backend with empty carts.
- Router, query, sonner and lucide are **peer** dependencies. Adding one as a regular
  dependency creates a second copy and breaks context.

## What deliberately stays in the store

Footer (mostly brand content), AppShell (composition root), Wordmark, and any signature UI
(a store's colour shelf, procedural imagery, bespoke hero). Don't pull these in "for
completeness" — they're the reason a store still has an identity.
