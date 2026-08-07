# @wm-storefront/commerce-ui

Shared commerce components and providers for Medusa storefronts — product grids, cart drawer,
variant picker, filter sidebar, checkout pieces — with every brand value **injected**, never
imported.

Part of [commerce-packages](https://github.com/matevosyanmko/commerce-packages).

## Install

```bash
bun add @wm-storefront/commerce-ui
```

Peer dependencies you must provide: `react`, `react-dom` (>=19), `@tanstack/react-query`,
`@tanstack/react-router`, `sonner`, `lucide-react`. These are peers rather than dependencies
on purpose — two copies of the router means no route context, and two copies of sonner means
toasts silently vanish. ESM only.

`@wm-storefront/commerce-core` and `@wm-storefront/ui` come along as regular dependencies.

## The injection seam

One provider carries everything, read with `useStorefront()`:

```tsx
import { StorefrontProvider, createStorefrontQueries } from "@wm-storefront/commerce-ui";
import { createCommerceApi } from "@wm-storefront/commerce-core";

const api = createCommerceApi({ /* … */ });
const queries = createStorefrontQueries(api, defaultRegionId);

<StorefrontProvider api={api} queries={queries} config={{
  storagePrefix: "acme",
  siteName: "Acme",
  defaultRegionId,
  defaultCurrency: "eur",
  // optional, each with a neutral fallback:
  Wordmark, colourSwatches, inlineImage, copy,
}}>
  {children}
</StorefrontProvider>
```

Two rules that will cost you real debugging time otherwise:

- **Build `queries` once.** The same object must be used in your route loaders *and* passed
  to the provider. Two instances means two cache keys, so every SSR prefetch is refetched on
  hydration.
- **Read query options from context**, never import them directly, for the same reason.

Every optional `config` entry has a neutral fallback — a store that sets nothing still
renders sensibly. `Wordmark` falls back to `siteName` text, absent `colourSwatches` renders a
checkbox list, and every `copy.*` string has plain default wording.

## Providers

Mount them in this order, inside a `StorefrontProvider`:

```
RegionProvider → AuthProvider → FavoritesProvider → CartProvider
```

Auth wraps Cart so login can claim the guest cart.

## Theming

Components use the token contract from
[`@wm-storefront/config`](https://www.npmjs.com/package/@wm-storefront/config), and Tailwind needs
to be pointed at the built package:

```css
@source "../node_modules/@wm-storefront/commerce-ui/dist";
```

## License

MIT © Mko Matevosyan
