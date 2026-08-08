# @wm-storefront/commerce-core

The backend-neutral data seam behind a family of Medusa storefronts. Types, an api factory,
pricing, filters, catalog helpers and money formatting — **no JSX, no React, no brand data**.

Part of [commerce-packages](https://github.com/matevosyanmko/commerce-packages).

## Install

```bash
bun add @wm-storefront/commerce-core
```

ESM only. Requires Node 20+. Targets Medusa v2 (`@medusajs/js-sdk` / `@medusajs/types` ^2.17).

## The idea

Anything that differs per store — catalog data, currency, region defaults — is **injected**,
never imported. You hand `createCommerceApi` a config and get the api surface back:

```ts
import { createCommerceApi } from "@wm-storefront/commerce-core";

const api = createCommerceApi({
  /* store config: catalog source, region defaults, currency */
});

const products = await api.listProducts();
```

Swapping the mock backend for a Medusa-backed one is a **body** change, never a signature
change — no call site in a store moves. `createMedusaCommerceApi` is the second
implementation of that same contract.

## What's in it

| Module | Contains |
| --- | --- |
| `types` | the only shapes the UI ever sees — all camelCase, no Medusa types leak through |
| `api` | `createCommerceApi(config)`, `createMedusaCommerceApi(config)` |
| `catalog` | `sortProducts`, `applyFilters`, `filtersActive`, `getFacets` — pure, config-free |
| `pricing` | `variantPrice`, `minVariantPrice`, `productPrice`, `inStock`, `stockQuantity` |
| `filters` | the zod search-param schema shared by product listing pages |
| `medusa-map` | Medusa → neutral mapping, plus category tree helpers |
| `money` | `formatMoney`, `discountPercent` |
| `countries` | country/region lookup helpers |
| `analytics` | `track` — a no-op-safe event seam stores can wire to their own analytics |
| `homepage-types` | shapes for admin-composed homepage sections |

Prices are region-keyed — always read them through `pricing`, never off `variant.prices`
directly.

## Subpath imports

Every module is reachable directly, which is cheaper for tree-shaking:

```ts
import { formatMoney } from "@wm-storefront/commerce-core/money";
```

## License

MIT © Mko Matevosyan
