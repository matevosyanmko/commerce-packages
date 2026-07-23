// The per-brand configuration seam for the shared commerce UI.
//
// Everything a shared component needs that differs per storefront is injected
// here — never hardcoded in the components. The app mounts one StorefrontProvider
// at the root with its own config and its `createCommerceApi` instance; package
// components read them via `useStorefront()`.
//
// This is what keeps @storefront/commerce-ui brand-agnostic: no `fleurette.`, no
// `bloom:`, no site name lives in the components — they come through this context.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CommerceApi } from "@storefront/commerce-core";
import type { StorefrontQueries } from "./queries";

/** Brand-voiced UI strings used by shared components. All optional — components
 *  fall back to neutral wording when a string isn't provided. */
export interface StorefrontCopy {
  /** Cart drawer empty state: heading, hint line, and browse-CTA label. */
  cartEmptyTitle?: string;
  cartEmptyHint?: string;
  cartEmptyCta?: string;
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
   * store keep its signature imagery (Fleurette's procedural `bloom:` SVGs, a
   * furniture store's own scheme, …) without forking `StoreImage`.
   */
  inlineImage?: (src?: string) => string | null;
  /** Brand-voiced UI strings; unset entries render each component's neutral default. */
  copy?: StorefrontCopy;
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
