# CLAUDE.md

Guidance for Claude Code in **commerce-packages** — the shared packages behind our
Medusa + TanStack Start storefronts (flowers, furniture, electronics, …).

One repo, four packages, developed together and published independently under the
`@gucco/*` scope. Each **store** is its own repo and installs them.

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

- Pure UI primitive, no commerce concepts → **`@gucco/ui`**
- Knows about products/cart/orders → **`@gucco/commerce-ui`**
- No JSX at all → **`@gucco/commerce-core`**
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

## How stores consume this

**Directly** — `import { ProductCard } from "@gucco/commerce-ui"`. Stores do **not** wrap
our components in local re-export files; that layer existed during the migration and was
removed, because a local-looking path that isn't local is exactly how someone ends up editing
a file that does nothing.

Two consequences for package work:

- **The barrel is the API.** An export missing from `index.ts` is invisible to every store.
- **Declare runtime dependencies here, not in the store.** A store declares only what its own
  `src/` imports, what its CSS and vite config need, and our peer dependencies. Everything else
  (Radix, cva, clsx, tailwind-merge, cmdk, vaul, embla, recharts, …) arrives transitively from
  us. A dependency added to a store instead of here works in that store and breaks the next one.

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
bun run storybook   # visual harness for ui + commerce-ui, on :6006
bun run changeset   # describe a change for the next release
```

`playground/` and `storybook/` are throwaway harnesses, not stores. Both drive a
**gadgets** fixture on purpose — if a change makes the gadgets fixture awkward, the seam
has gone flower-shaped. Keep them non-floral.

`storybook/` renders both UI packages in a deliberately neutral skin (`src/preview.css`
fills in the theme contract with greys and one non-brand accent). That's the point: a
component that only looks right against a real store's palette has a leak. Stories live
in `storybook/stories/`, **not** beside the components — same reason `smoke.ts` lives in
`playground/`, and it keeps `*.stories.tsx` out of every published `dist`. The
with/without pairs (`FilterSidebar`, `Navbar`, `CartDrawer`) are the only coverage the
neutral-fallback rule has; when you add a config entry with a fallback, add its pair.

**After changing a package, rebuild `dist` before testing a store against it** — stores
resolve `dist`, not `src`, so an unbuilt change looks like "nothing happened". Storybook
is the exception: it aliases the packages to `src` and needs no rebuild.

## Releasing

Published to public npm as `@gucco/*`. **Nobody runs `npm publish` by hand** — releases go
out from CI, and the trigger is merging a PR.

1. With your change, run `bun run changeset`, pick the bump, describe it in one line. Commit
   the generated `.changeset/*.md` alongside the code. **Forget this and nothing ships** —
   Release finds no changesets, tries to publish, sees every version already on npm and exits
   green. CI's **Changeset gate** fails the PR for exactly this reason; if the PR genuinely
   ships no release (docs, CI, tooling, `playground/`, `storybook/`), say so on the record
   with `bunx changeset add --empty` rather than working around the gate.
2. Merging to `main` makes the release workflow open (or update) a **Version Packages** PR
   containing the version bumps, the rewritten internal ranges, and the changelogs.
3. Merging *that* PR publishes **whichever packages the changeset touched**. The diff you
   approved is exactly what shipped.

**The packages version independently** — `fixed` is empty in `.changeset/config.json`, so a
change to `ui` publishes `ui` and leaves the other three where they are. Name only the
packages you actually changed in the changeset; adding the others to be safe republishes
byte-identical tarballs and buries the real change in empty changelog headings.

The one cascade, and it's narrower than it sounds: a **minor or major** on `commerce-core`
or `ui` also releases `commerce-ui` as a patch, because the new version falls outside its
`^` range and that range has to be rewritten. A **patch** on a sibling cascades to nothing —
`^0.2.1` already covers `0.2.2`, so `commerce-ui` isn't touched and isn't republished. Those
range rewrites are generated: **never hand-edit them**, and never name `commerce-ui` in the
changeset for a sibling's change — changesets works the dependency arrow out itself.

Consequence of independence: the four versions drift, so "we're on 0.3.1" no longer
describes the repo. A store's four `^` ranges each move on their own schedule, and
`@gucco/config` — which nothing depends on — only moves when it genuinely changes.

CI publishes over OIDC (**npm trusted publishing**), so there is no `NPM_TOKEN` secret and
nothing to rotate. If you ever find yourself pasting a token or a 2FA code to ship a
release, something has gone wrong — fix the pipeline instead.

Bump guide, in terms of the rules above: a new barrel export or a new **optional** config
entry (which by the neutral-fallback rule is non-breaking by construction) is a **minor**;
removing an export, renaming a prop, or making a config entry required is a **major** — as
is the planned `--bloom`/`--petal` token rename, since it breaks every store's CSS.

Releases are permanent. A bad one is fixed with `npm deprecate` plus a patch, never
`npm unpublish`.

## Traps that cost real debugging time

- **Dual React via `bun link`.** Symlinked packages resolve their *own* `react` from
  `commerce-packages/node_modules`, so SSR gets two Reacts and every Radix component
  throws *"Invalid hook call"*. The client build hides it (it dedupes); dev SSR does
  not. Fix lives in the **store's** `vite.config.ts`: `ssr.noExternal` for
  `/^@gucco\//`, `/^@radix-ui\//` and the React-using UI libs, plus
  `resolve.dedupe` for react, router, query, sonner, lucide. Goes away once installed
  from a registry.
- **Vite doesn't watch outside its own root.** `storybook/.storybook/main.ts` aliases the
  packages to `src`, and the modules load fine — but without the
  `storefront:watch-package-sources` plugin adding `packages/` to the watcher, editing a
  component never triggers HMR. Tailwind *does* rescan (it watches its own `@source`
  globs), so classes update while the markup doesn't: it looks exactly like the
  dist-staleness problem the aliases exist to prevent. Don't remove that plugin.
- **Tailwind silently drops package-only classes.** Stores use
  `@import "tailwindcss" source(none)`, so a class that appears *only* inside a package
  component is never generated. Every store must
  `@source "../node_modules/@gucco/{ui,commerce-ui}/dist"`.
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
- Prefer subpath imports (`@gucco/ui/button`) in package-internal code; stores may use
  either.

## Known debt

Shared components reference brand-named tokens as Tailwind classes (`text-bloom`,
`bg-petal`, `text-sale`, `bg-sage`), so **every** consuming store must define
`--bloom`, `--petal`, `--pollen`, `--sage`. A furniture store just points them at its own
accent colours, but the names read wrong. Renaming to neutral tokens
(`--accent-strong`, `--surface-alt`, …) is a planned pass — do it while wiring the second
store, when it's clear which names actually hurt.
