// Chrome and navigation: breadcrumbs, the mega menu, the mobile drawer, search,
// pagination and the mobile filter drawer.

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { getFacets, type FilterValue } from "@wm-storefront/commerce-core";
import {
  Breadcrumbs,
  FilterDrawer,
  MegaMenu,
  MobileNav,
  ProductPagination,
  ResultRange,
  SearchDialog,
  SearchTrigger,
} from "@wm-storefront/commerce-ui";
import { baseConfig, colourSwatches } from "../../src/decorator";
import { CATEGORIES, COLLECTIONS, PRODUCTS, REGION } from "../../src/fixture";

const facets = getFacets(
  PRODUCTS,
  new Map(CATEGORIES.map((c) => [c.handle, c.name])),
  new Map(COLLECTIONS.map((c) => [c.handle, c.title])),
  REGION.id,
);

const EMPTY: FilterValue = { inStock: false, options: {}, tags: [] };

const meta: Meta = {
  title: "commerce/Navigation",
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  component: MegaMenu,
  subcomponents: {
    MobileNav,
    Breadcrumbs,
    SearchTrigger,
    SearchDialog,
    ProductPagination,
    ResultRange,
    FilterDrawer,
  },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

// MobileNav and FilterDrawer only expose their trigger below `lg`, so at desktop
// width those stories render an empty box. Storybook 9 sets the viewport through
// `globals`, not the old `parameters.viewport.defaultViewport`.
const MOBILE = { viewport: { value: "mobile1", isRotated: false } };

export const Crumbs: Story = {
  render: () => (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Audio", to: "/categories/audio" },
          { label: "Aurora Headphones" },
        ]}
      />
      {/* A single trailing crumb — no separators to render. */}
      <Breadcrumbs items={[{ label: "Basket" }]} />
    </div>
  ),
};

/**
 * Opens a panel per category and fetches product previews lazily. The panels
 * measure available width to decide how many categories fit, so this story is
 * worth resizing the viewport against.
 */
export const Mega: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="border-border border-b">
      <MegaMenu categories={CATEGORIES} collections={COLLECTIONS} />
    </div>
  ),
};

/** The trigger only appears below `lg` — switch to the mobile viewport. */
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  globals: MOBILE,
  render: () => <MobileNav categories={CATEGORIES} collections={COLLECTIONS} />,
};

export const MobileWithWordmark: Story = {
  globals: MOBILE,
  parameters: {
    layout: "fullscreen",
    storefrontConfig: {
      ...baseConfig,
      Wordmark: ({ className }: { className?: string }) => (
        <span className={className}>◆ Gadget Works</span>
      ),
      copy: { collectionsLabel: "Collections", savedItemsLabel: "Saved gadgets" },
    },
  },
  render: () => <MobileNav categories={CATEGORIES} collections={COLLECTIONS} />,
};

export const Search: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="space-y-4">
        <SearchTrigger onClick={() => setOpen(true)} />
        <SearchDialog open={open} onOpenChange={setOpen} />
        <p className="text-muted-foreground text-sm">
          Try “aurora”, “watch” or “cable” — results come from the injected api.
        </p>
      </div>
    );
  },
};

/** Open on mount, so the empty state is visible without a click. */
export const SearchOpen: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return <SearchDialog open={open} onOpenChange={setOpen} />;
  },
};

export const Pagination: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <ResultRange page={1} total={PRODUCTS.length} />
        <ProductPagination page={1} pageCount={5} />
      </div>
      <div>
        <ResultRange page={3} total={120} />
        <ProductPagination page={3} pageCount={12} />
      </div>
      {/* pageCount <= 1 renders nothing — the single-page case. */}
      <div>
        <ResultRange page={1} total={4} />
        <ProductPagination page={1} pageCount={1} />
        <p className="text-muted-foreground text-xs">↑ one page, so no control renders</p>
      </div>
    </div>
  ),
};

/** The `lg:hidden` counterpart to FilterSidebar — use the mobile viewport. */
export const Filters: Story = {
  globals: MOBILE,
  render: function Render() {
    const [value, setValue] = useState<FilterValue>(EMPTY);
    return (
      <FilterDrawer
        facets={facets}
        value={value}
        onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        onClear={() => setValue(EMPTY)}
        activeCount={value.tags.length + Object.keys(value.options).length}
        resultCount={PRODUCTS.length}
      />
    );
  },
};

export const FiltersWithSwatches: Story = {
  globals: MOBILE,
  parameters: { storefrontConfig: { ...baseConfig, colourSwatches } },
  render: function Render() {
    const [value, setValue] = useState<FilterValue>(EMPTY);
    return (
      <FilterDrawer
        facets={facets}
        value={value}
        onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        onClear={() => setValue(EMPTY)}
        activeCount={value.tags.length}
        resultCount={PRODUCTS.length}
      />
    );
  },
};
