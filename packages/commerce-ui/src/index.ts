// @storefront/commerce-ui — shared commerce components + providers.
//
// Brand-agnostic: every per-store value (storage prefix, brand imagery, site
// name, the api instance) is injected via StorefrontProvider, never hardcoded.

export {
  StorefrontProvider,
  useStorefront,
  useOptionalStorefront,
} from "./StorefrontProvider";
export type { StorefrontConfig, StorefrontCopy } from "./StorefrontProvider";

// Query options built from the injected api — the app creates ONE instance,
// uses it in its route loaders, and passes it to StorefrontProvider.
export { createStorefrontQueries } from "./queries";
export type { StorefrontQueries } from "./queries";

export { StoreImage, withSize } from "./StoreImage";
export type { StoreImageProps, ImageSize } from "./StoreImage";

// Providers — mounted by the app in this order (Region → Auth → Favorites → Cart),
// inside a StorefrontProvider. Auth wraps Cart so login can claim the guest cart.
export { RegionProvider, useRegion } from "./RegionProvider";
export { AuthProvider, useAuth } from "./AuthProvider";
export type { RegisterInput } from "./AuthProvider";
export { CartProvider, useCart } from "./CartProvider";
export { FavoritesProvider, useFavorites } from "./FavoritesProvider";

// Shared commerce components.
export { Price } from "./Price";
export { Breadcrumbs } from "./Breadcrumbs";
export type { Crumb } from "./Breadcrumbs";
export { VariantPicker } from "./VariantPicker";
export { ProductGrid, ProductGridSkeleton } from "./ProductGrid";
export { ProductCard } from "./ProductCard";
export { ProductGallery } from "./ProductGallery";
export { ProductPagination, ResultRange, PAGE_SIZE } from "./ProductPagination";
export { FavoriteButton } from "./FavoriteButton";
export { CartItem } from "./CartItem";
export { CartSummary } from "./CartSummary";
export { CartDrawer } from "./CartDrawer";
export { AuthShell, AuthField } from "./AuthShell";
export { MegaMenu } from "./MegaMenu";
export { SearchDialog, SearchTrigger } from "./SearchDialog";

// Shared hooks.
export { useDebouncedValue } from "./use-debounced-value";
export { useOverflowCount } from "./use-overflow-count";
