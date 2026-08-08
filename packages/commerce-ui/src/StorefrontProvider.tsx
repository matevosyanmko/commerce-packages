// The per-brand configuration seam for the shared commerce UI.
//
// Everything a shared component needs that differs per storefront is injected
// here — never hardcoded in the components. The app mounts one StorefrontProvider
// at the root with its own config and its `createCommerceApi` instance; package
// components read them via `useStorefront()`.
//
// This is what keeps @wm-storefront/commerce-ui brand-agnostic: no storage prefix, no
// image scheme, no site name lives in the components — they come through this context.

import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from "react";
import type { CommerceApi } from "@wm-storefront/commerce-core";
import type { StorefrontQueries } from "./queries";

/** One colour swatch for the tag facet. `swatch` is any CSS background value —
 *  a hex for a plain pigment, or a gradient for a "mixed" entry. */
export interface ColourSwatch {
  value: string;
  label: string;
  swatch: string;
}

/** Brand-voiced UI strings used by shared components. All optional — components
 *  fall back to neutral wording when a string isn't provided. */
export interface StorefrontCopy {
  /** Cart drawer empty state: heading, hint line, and browse-CTA label. */
  cartEmptyTitle?: string;
  cartEmptyHint?: string;
  cartEmptyCta?: string;
  /** Navbar announcement strip. Absent = no strip. */
  announcement?: ReactNode;
  /** Label for the saved/favorites entry points (navbar aria, mobile nav row). */
  savedItemsLabel?: string;
  /** Noun for cart items in the screen-reader count ("stem"/"stems"). */
  cartNoun?: { singular: string; plural: string };
  /** Heading over the collections list in the mobile nav. */
  collectionsLabel?: string;
  /** PDP stock line, in-stock and out-of-stock voice. */
  stockInNote?: string;
  stockOutNote?: string;
  /** Homepage section eyebrows (why-choose-us, newsletter, image gallery). */
  whyChooseUsEyebrow?: string;
  newsletterEyebrow?: string;
  galleryEyebrow?: string;
  /** Secondary browse link under the hero headline. */
  heroBrowseCta?: string;
}

export interface WordmarkProps {
  className?: string;
  iconClassName?: string;
}

export interface StorefrontConfig {
  /** localStorage key prefix, brand-scoped so two stores on one origin don't collide. */
  storagePrefix: string;
  /** Brand name, for aria labels / fallbacks in shared chrome. */
  siteName: string;
  /** Fallback region id + currency for the very first render, before regions load. */
  defaultRegionId: string;
  defaultCurrency: string;
  /**
   * Resolve a brand-specific image scheme to an inline data URI, or null to fall
   * through to the normal progressive-image path. This is the seam that lets a
   * store keep its signature imagery (a florist's procedural `bloom:` SVGs, a
   * furniture store's own scheme, …) without forking `StoreImage`.
   */
  inlineImage?: (src?: string) => string | null;
  /** Brand-voiced UI strings; unset entries render each component's neutral default. */
  copy?: StorefrontCopy;
  /**
   * The brand's logo lockup, rendered by the navbar and mobile nav. Absent, the
   * shared chrome falls back to `siteName` as styled text.
   */
  Wordmark?: ComponentType<WordmarkProps>;
  /**
   * Colour swatches for the tag facet in the filter sidebar. Present, the tag
   * facet renders as a swatch grid (colour-first shopping); absent, it degrades
   * to the same checkbox list every other facet uses.
   */
  colourSwatches?: ColourSwatch[];
}

interface StorefrontContextValue {
  config: StorefrontConfig;
  api: CommerceApi;
  queries: StorefrontQueries;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({
  config,
  api,
  queries,
  children,
}: {
  config: StorefrontConfig;
  api: CommerceApi;
  /**
   * The app's `createStorefrontQueries(api, defaultRegionId)` result — the SAME
   * object the app's route loaders use, so package components and loaders share
   * cache keys and an SSR prefetch is never refetched on hydration.
   */
  queries: StorefrontQueries;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ config, api, queries }), [config, api, queries]);
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

/** Required accessor — throws if a StorefrontProvider isn't mounted above. */
export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error("useStorefront must be used within a StorefrontProvider");
  return ctx;
}

/** Non-throwing accessor for components that can degrade without config. */
export function useOptionalStorefront(): StorefrontContextValue | null {
  return useContext(StorefrontContext);
}
