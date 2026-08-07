// The provider stack every story renders inside.
//
// Nothing here is brand data. The config below is a deliberately neutral demo
// store — if a component only looks right with a real brand's values, that's the
// bug this harness exists to surface.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { createCommerceApi } from "@wm-storefront/commerce-core";
import {
  AuthProvider,
  CartProvider,
  createStorefrontQueries,
  FavoritesProvider,
  RegionProvider,
  StorefrontProvider,
  type StorefrontConfig,
} from "@wm-storefront/commerce-ui";
import { DATA, REGION } from "./fixture";

/* ── Imagery ────────────────────────────────────────────────────────────────── */

const PIGMENTS: Record<string, string> = {
  black: "#2a2b2e",
  ivory: "#e9e4da",
  sand: "#d8c3a5",
  slate: "#6b7280",
  moss: "#7c8a6a",
};

/**
 * Resolves the fixture's `shape:<handle>:<n>` scheme to an inline SVG.
 *
 * This is the same seam a store uses for its own signature imagery, so the
 * harness exercises `inlineImage` rather than routing around it. The output is
 * geometric and colourless-by-default on purpose — placeholder art that can't be
 * mistaken for any brand's photography.
 */
function inlineImage(src?: string): string | null {
  if (!src?.startsWith("shape:")) return null;
  const [, handle, frame] = src.split(":");
  // Deterministic per handle, so a product looks the same on every render.
  const hash = [...handle].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
  const hue = (hash + Number(frame ?? 1) * 24) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="hsl(${hue} 18% 92%)"/>
    <circle cx="200" cy="180" r="96" fill="hsl(${hue} 24% 78%)"/>
    <rect x="120" y="236" width="160" height="72" rx="14" fill="hsl(${hue} 28% 66%)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ── The demo store ─────────────────────────────────────────────────────────── */

export const api = createCommerceApi({
  data: DATA,
  storagePrefix: "storybook.",
  currency: REGION.currency,
  shippingOptions: [
    { id: "so_std", name: "Standard", price: 5, estimatedDays: "2–3 days" },
    { id: "so_exp", name: "Express", price: 12, estimatedDays: "next day" },
  ],
  paymentProviders: [{ id: "pp_card", name: "Card" }],
  promos: {
    SAVE10: { type: "percent", value: 10 },
    FREESHIP: { type: "freeship" },
  },
});

// ONE instance, module-scope. Building this per story would split the query
// cache keys — the same trap a store hits when it doesn't share its queries
// between route loaders and StorefrontProvider.
export const queries = createStorefrontQueries(api, REGION.id);

export const baseConfig: StorefrontConfig = {
  storagePrefix: "storybook.",
  siteName: "Gadget Works",
  defaultRegionId: REGION.id,
  defaultCurrency: REGION.currency,
  inlineImage,
};

/** The colour swatches some stories opt into, to prove the non-default path. */
export const colourSwatches = Object.entries(PIGMENTS).map(([value, swatch]) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
  swatch,
}));

/* ── Router ─────────────────────────────────────────────────────────────────── */

// 12 of the commerce components render a `<Link>`, which cannot resolve its `to`
// unless a matching route exists. These are the eight paths they actually link to.
//
// Every one of them renders the STORY, not a stub. A stub rendering null is what
// a real storefront would do here — hand off to its own route — but in the
// harness there is no such route, so clicking a product card just blanked the
// screen with no way back. Rendering the story at every path means a link click
// never loses the story, while `Link` keeps its real behaviour (hrefs, active
// state, params); the banner below reports where you landed.
const LINKED_PATHS = [
  "/store",
  "/cart",
  "/checkout",
  "/account",
  "/favorites",
  "/products/$handle",
  "/categories/$handle",
];

// The story and its config reach the route components through context rather
// than a closure, so the router can be built ONCE. Rebuilding it per render —
// which is what happens if the story element is a dependency, since JSX creates
// a new element every time — remounts the whole tree and throws away cart state
// on each keystroke.
const HarnessContext = createContext<{ story: ReactNode; config: StorefrontConfig }>({
  story: null,
  config: null as unknown as StorefrontConfig,
});

function RootLayout() {
  const { config } = useContext(HarnessContext);
  return (
    <StorefrontProvider config={config} api={api} queries={queries}>
      <RegionProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Outlet />
              <Toaster position="bottom-right" />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </RegionProvider>
    </StorefrontProvider>
  );
}

/**
 * Shown only after a link has taken you off `/`. Tells you which route matched
 * and gets you back, so navigation stays observable instead of silent.
 */
function RouteBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  if (pathname === "/") return null;

  return (
    <div className="border-border bg-muted text-muted-foreground flex items-center justify-between gap-4 border-b px-4 py-2 text-xs">
      <span>
        Navigated to <code className="text-foreground font-medium">{pathname}</code> — the harness
        has no page for it, so the story is still shown below.
      </span>
      <button
        onClick={() => navigate({ to: "/" })}
        className="border-border hover:bg-background shrink-0 rounded-full border px-3 py-1"
      >
        Back to story
      </button>
    </div>
  );
}

function StorySlot() {
  return (
    <>
      <RouteBanner />
      <div className="p-6">{useContext(HarnessContext).story}</div>
    </>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const router = createRouter({
  routeTree: rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: StorySlot }),
    // Same component, so a link click changes the URL without blanking the view.
    ...LINKED_PATHS.map((path) =>
      createRoute({ getParentRoute: () => rootRoute, path, component: StorySlot }),
    ),
  ]),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

/* ── The decorator ──────────────────────────────────────────────────────────── */

export function StoryHarness({
  children,
  config = baseConfig,
  dark = false,
}: {
  children: ReactNode;
  config?: StorefrontConfig;
  dark?: boolean;
}) {
  // Stories must not inherit each other's state. The api persists cart and
  // favorites to localStorage under the harness prefix, so without this the
  // navbar's basket count depends on whether you opened the cart story first.
  // A state initialiser runs once per mount, before the providers below read it —
  // and not on arg changes, so controls don't wipe a cart mid-interaction.
  useState(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(baseConfig.storagePrefix)) localStorage.removeItem(key);
    }
    // The router is module-scope, so a link followed in one story would still be
    // the current path in the next one. Same isolation rule as the storage above.
    if (router.state.location.pathname !== "/") router.history.replace("/");
  });

  // retry: false so a story surfaces a failing query immediately instead of
  // sitting in a three-attempt backoff.
  const client = useMemo(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    [],
  );
  const harness = useMemo(() => ({ story: children, config }), [children, config]);

  return (
    <QueryClientProvider client={client}>
      <HarnessContext.Provider value={harness}>
        <div className={dark ? "dark" : undefined}>
          <div className="bg-background text-foreground min-h-screen">
            <RouterProvider router={router} />
          </div>
        </div>
      </HarnessContext.Provider>
    </QueryClientProvider>
  );
}
