// The worked example of "compose, don't fork": the sidebar is shared, and the
// colour swatches are injected. Both stories render the SAME component — the
// only difference is whether the store supplied `colourSwatches`.
//
// The pair exists because the neutral-fallback rule is the thing nothing else
// checks. A change that assumes swatches are present passes typecheck, passes
// the store that defines them, and breaks the store that doesn't.

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { getFacets, type FilterValue } from "@wm-storefront/commerce-core";
import { FilterSidebar } from "@wm-storefront/commerce-ui";
import { baseConfig, colourSwatches } from "../../src/decorator";
import { CATEGORIES, COLLECTIONS, PRODUCTS, REGION } from "../../src/fixture";

const facets = getFacets(
  PRODUCTS,
  new Map(CATEGORIES.map((c) => [c.handle, c.name])),
  new Map(COLLECTIONS.map((c) => [c.handle, c.title])),
  REGION.id,
);

const EMPTY: FilterValue = { inStock: false, options: {}, tags: [] };

function Harness() {
  const [value, setValue] = useState<FilterValue>(EMPTY);
  return (
    <div className="max-w-xs">
      <FilterSidebar
        facets={facets}
        value={value}
        onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        onClear={() => setValue(EMPTY)}
      />
    </div>
  );
}

const meta = {
  title: "commerce/FilterSidebar",
  component: FilterSidebar,
} satisfies Meta<typeof FilterSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No `colourSwatches` in config — the tag facet degrades to a checkbox list. */
export const NeutralFallback: Story = {
  args: { facets, value: EMPTY, onChange: () => {}, onClear: () => {} },
  render: () => <Harness />,
};

/** A store that supplies swatches gets the colour-first grid instead. */
export const WithColourSwatches: Story = {
  args: { facets, value: EMPTY, onChange: () => {}, onClear: () => {} },
  parameters: { storefrontConfig: { ...baseConfig, colourSwatches } },
  render: () => <Harness />,
};
