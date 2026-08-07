// @wm-storefront/commerce-core — the backend-neutral commerce seam.
//
// Everything a storefront needs to read catalog / cart / order / customer data,
// with zero brand data and zero brand literals inside. The catalog and store
// config are injected via `createCommerceApi(config)`; the pure helpers and the
// neutral domain types are plain exports.

// Neutral domain types — the ONLY shapes the UI sees.
export * from "./types";

// Data seam: two factories, one contract. A store picks the backend it runs on
// and the UI can't tell the difference.
export { createCommerceApi } from "./api";
export type { CommerceApi, CommerceConfig, CommerceData, CommerceCopy, Promo } from "./api";
export { createMedusaCommerceApi, DEFAULT_PRODUCT_FIELDS } from "./api-medusa";
export type { MedusaCommerceConfig } from "./api-medusa";

// Pure catalog operations (no config needed).
export { sortProducts, applyFilters, filtersActive, getFacets } from "./catalog";

// Pricing helpers — read variant prices through these, never `variant.prices[…]`.
export { variantPrice, minVariantPrice, productPrice, inStock, stockQuantity } from "./pricing";
export type { VariantPrice } from "./pricing";

// Medusa → neutral mapping + category-tree utilities.
export * from "./medusa-map";

// Search-param filter seam shared by both PLPs.
export * from "./filters";

// Money formatting.
export { formatMoney, discountPercent } from "./money";

// Country list helpers for region <Select>s.
export * from "./countries";

// Analytics adapter.
export { track } from "./analytics";

// Homepage CMS section shapes (content is per-brand, in each app).
export type * from "./homepage-types";
