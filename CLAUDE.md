# CLAUDE.md

Guidance for Claude Code in **commerce-packages** — the shared packages behind our
Medusa + TanStack Start storefronts (flowers, furniture, electronics, …).

One repo, four packages, developed together and published independently under the
`@storefront/*` scope. Each **store** is its own repo and installs them.

---

## The one rule

> **A package never reads a brand literal or an env var.**

Anything that differs per store — catalog data, the `localStorage` prefix, currency,
site name, imagery schemes, colour swatches, user-facing copy, the wordmark — is
**injected**, never imported. Two mechanisms:

- **`createCommerceApi(config)`** in `commerce-core` — data + store config in, the
  api surface out.
- **`StorefrontProvider`** in `commerce-ui` — config + api + queries in context,
  read via `useStorefront()`.

**Check before you commit:**

```bash
grep -rniE "fleurette|import\.meta\.env|process\.env" packages/*/src
```

Hits in `medusa-map.ts` (`"eur"` normalisation) and `money.ts` (`FALLBACK_CURRENCY`)
are known and fine — they're neutral defaults, not brand values. Anything else is a leak.

## Adding to a package: which one?

Ask **"would another store use this unchanged?"**

- Pure UI primitive, no commerce concepts → **`@storefront/ui`**
- Knows about products/cart/orders → **`@storefront/commerce-ui`**
- No JSX at all → **`@storefront/commerce-core`**
- Brand-specific → **it doesn't belong here.** It goes in the store's own repo.

When unsure, leave it in the store. Promoting later is easy; extracting a leaked
brand assumption after three stores depend on it is not.

**Mostly shared with a brand-specific bit?** Compose, don't fork: shared skeleton in
the package, brand part injected as a prop, `ReactNode` slot, or a config entry.
`StoreImage` + `inlineImage`, `ProductInfo` + `highlights`/`purchaseNote`/`perks`,
and `FilterSidebar` + `colourSwatches` are the worked examples — copy their shape.

Every optional config entry needs a **neutral fallback** so a store that doesn't set
it still renders sensibly (`Wordmark` → `siteName` text; `colourSwatches` absent →
checkbox list; every `copy.*` → plain wording).

## Packages

| Package | Contains | Depends on |
| --- | --- | --- |
| `commerce-core` | types, api factory, pricing, filters, catalog helpers, medusa-map, money, countries, analytics, homepage types | zod, @medusajs/types |
| `ui` | 46 Radix wrappers, `cn()`, `use-mobile` | radix, cva, react (peer) |
| `commerce-ui` | StorefrontProvider, 4 providers, ~22 commerce components, queries factory, hooks | core + ui |
| `config` | Tailwind theme contract, tsconfig base, prettier | nothing (files only) |

Arrows point one way: `core → ui → commerce-ui → apps`. **Never** import an app from
a package, and never create a cycle.

## Commands

```bash
bun install
bun run build       # every package to dist (tsc, with .d.ts)
bun run typecheck
bun run smoke       # commerce-core harness in playground/
```

`playground/` is a throwaway harness, not a store. `smoke.ts` drives `commerce-core`
against a **gadgets** fixture on purpose — if a change makes the gadgets fixture
awkward, the seam has gone flower-shaped. Keep it non-floral.

**After changing a package, rebuild `dist` before testing a store against it** — stores
resolve `dist`, not `src`, so an unbuilt change looks like "nothing happened".

## Traps that cost real debugging time

- **Dual React via `bun link`.** Symlinked packages resolve their *own* `react` from
  `commerce-packages/node_modules`, so SSR gets two Reacts and every Radix component
  throws *"Invalid hook call"*. The client build hides it (it dedupes); dev SSR does
  not. Fix lives in the **store's** `vite.config.ts`: `ssr.noExternal` for
  `/^@storefront\//`, `/^@radix-ui\//` and the React-using UI libs, plus
  `resolve.dedupe` for react, router, query, sonner, lucide. Goes away once installed
  from a registry.
- **Tailwind silently drops package-only classes.** Stores use
  `@import "tailwindcss" source(none)`, so a class that appears *only* inside a package
  component is never generated. Every store must
  `@source "../node_modules/@storefront/{ui,commerce-ui}/dist"`.
- **Context/singleton libraries must be peer deps**, never regular deps:
  `react`, `react-dom`, `@tanstack/react-query`, `@tanstack/react-router`, `sonner`.
  Two copies of the router = no route context; two copies of sonner = toasts vanish.
- **Query cache keys must be shared.** `createStorefrontQueries(api, defaultRegionId)`
  is built **once** by the store, used in its route loaders **and** passed to
  `StorefrontProvider`. Two instances = SSR prefetches that the components refetch on
  hydration.
- **`export *` from a barrel is checked at build time, not edit time.** Verify the real
  export names (`PAGE_SIZE`, not `PAGE`) before adding a line to `index.ts`.

## Conventions

- Match surrounding style by hand. Prettier config is in `packages/config/prettier.json`
  (printWidth 100, double quotes, semicolons, trailing commas); the working tree is CRLF,
  so avoid repo-wide format runs.
- `ui/` wrappers keep the older `React.forwardRef` + `displayName` convention. Do **not**
  run `bunx shadcn add` — it emits today's upstream style and won't match.
- Components moved from a store should arrive **verbatim**, with only imports rewritten
  and brand values lifted into config. Resist "improving" them in the same pass — it makes
  the diff unreviewable and hides regressions.
- Prefer subpath imports (`@storefront/ui/button`) in package-internal code; stores may use
  either.

## Known debt

Shared components reference brand-named tokens as Tailwind classes (`text-bloom`,
`bg-petal`, `text-sale`, `bg-sage`), so **every** consuming store must define
`--bloom`, `--petal`, `--pollen`, `--sage`. A furniture store just points them at its own
accent colours, but the names read wrong. Renaming to neutral tokens
(`--accent-strong`, `--surface-alt`, …) is a planned pass — do it while wiring the second
store, when it's clear which names actually hurt.
