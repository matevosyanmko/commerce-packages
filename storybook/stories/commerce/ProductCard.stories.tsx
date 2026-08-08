// The busiest component in the package: a router <Link>, region-aware pricing,
// the inlineImage seam and the cart mutation all meet here. If the harness is
// wired correctly, this renders with no console noise.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProductCard } from "@wm-storefront/commerce-ui";
import { PRODUCTS } from "../../src/fixture";

const meta = {
  title: "commerce/ProductCard",
  component: ProductCard,
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { product: PRODUCTS[0], priority: true },
  render: (args) => (
    <div className="max-w-xs">
      <ProductCard {...args} />
    </div>
  ),
};

/** `Aurora` carries a compareAt price, so the sale treatment is visible. */
export const OnSale: Story = {
  args: { product: PRODUCTS.find((p) => p.handle === "cobalt-charger")! },
  render: (args) => (
    <div className="max-w-xs">
      <ProductCard {...args} />
    </div>
  ),
};

/** Every `Sand` variant is stocked at 0 — this is the sold-out treatment. */
export const OutOfStock: Story = {
  args: { product: PRODUCTS.find((p) => p.handle === "tether-cable")! },
  render: (args) => (
    <div className="max-w-xs">
      <ProductCard {...args} />
    </div>
  ),
};

export const Grid: Story = {
  args: { product: PRODUCTS[0] },
  render: () => (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {PRODUCTS.slice(0, 8).map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} priority={i < 4} />
      ))}
    </div>
  ),
};
