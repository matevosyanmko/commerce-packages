// Region context — currency, locale and country list for the UI. The region id
// scopes all pricing, so components read it from here instead of each
// re-resolving it. `region` is never null: a fallback built from the injected
// StorefrontConfig defaults keeps money formatting correct on the very first
// render, before the real regions arrive.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localeForCurrency, type Region } from "@gucco/commerce-core";
import { useStorefront } from "./StorefrontProvider";

interface RegionContextValue {
  region: Region;
  regions: Region[];
  setRegionId: (id: string) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const { api, config } = useStorefront();
  const storageKey = `${config.storagePrefix}regionId`;

  const fallbackRegion = useMemo<Region>(
    () => ({
      id: config.defaultRegionId,
      name: config.defaultCurrency,
      currency: config.defaultCurrency,
      locale: localeForCurrency(config.defaultCurrency),
      countries: [],
    }),
    [config.defaultRegionId, config.defaultCurrency],
  );

  const [regions, setRegions] = useState<Region[]>([fallbackRegion]);
  const [regionId, setRegionIdState] = useState<string>(config.defaultRegionId);

  // Load the real regions from the backend on mount.
  useEffect(() => {
    let cancelled = false;
    void api
      .listRegions()
      .then((fetched) => {
        if (cancelled || !fetched.length) return;
        setRegions(fetched);
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        const pick =
          (stored && fetched.find((r) => r.id === stored)?.id) ||
          fetched.find((r) => r.id === config.defaultRegionId)?.id ||
          fetched[0].id;
        setRegionIdState(pick);
      })
      .catch(() => {
        // Keep the config-derived fallback — the store still renders and formats
        // money correctly; only region switching is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [api, storageKey, config.defaultRegionId]);

  const value = useMemo<RegionContextValue>(() => {
    const region = regions.find((r) => r.id === regionId) ?? regions[0] ?? fallbackRegion;
    return {
      region,
      regions,
      setRegionId: (id: string) => {
        setRegionIdState(id);
        if (typeof window !== "undefined") window.localStorage.setItem(storageKey, id);
      },
    };
  }, [regions, regionId, fallbackRegion, storageKey]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}
