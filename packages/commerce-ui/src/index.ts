// @storefront/commerce-ui — shared commerce components + providers.
//
// Brand-agnostic: every per-store value (storage prefix, brand imagery, site
// name, the api instance) is injected via StorefrontProvider, never hardcoded.

export {
  StorefrontProvider,
  useStorefront,
  useOptionalStorefront,
} from "./StorefrontProvider";
export type { StorefrontConfig } from "./StorefrontProvider";

export { StoreImage, withSize } from "./StoreImage";
export type { StoreImageProps, ImageSize } from "./StoreImage";

// Providers — mounted by the app in this order (Region → Auth → Favorites → Cart),
// inside a StorefrontProvider. Auth wraps Cart so login can claim the guest cart.
export { RegionProvider, useRegion } from "./RegionProvider";
export { AuthProvider, useAuth } from "./AuthProvider";
export type { RegisterInput } from "./AuthProvider";
export { CartProvider, useCart } from "./CartProvider";
export { FavoritesProvider, useFavorites } from "./FavoritesProvider";
