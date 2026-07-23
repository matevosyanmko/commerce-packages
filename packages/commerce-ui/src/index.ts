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
