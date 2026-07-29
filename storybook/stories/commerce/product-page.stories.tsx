// The PDP surfaces: gallery, the info panel with its three brand slots, and the
// grid + skeleton a PLP renders.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Leaf, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import {
  ProductChip,
  ProductGallery,
  ProductGrid,
  ProductGridSkeleton,
  ProductInfo,
  ProductPerk,
} from "@gucco/commerce-ui";
import { PRODUCTS } from "../../src/fixture";

const product = PRODUCTS.find((p) => p.handle === "meridian-watch")!;

const meta: Meta = {
  title: "commerce/Product page",
  component: ProductInfo,
  subcomponents: { ProductGallery, ProductGrid, ProductGridSkeleton, ProductChip, ProductPerk },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div className="max-w-xl">
      <ProductGallery images={product.images} title={product.title} />
    </div>
  ),
};

/** A single image — the thumbnail rail should not appear. */
export const GallerySingleImage: Story = {
  render: () => (
    <div className="max-w-xl">
      <ProductGallery images={[product.images[0]]} title={product.title} />
    </div>
  ),
};

/** No slots supplied — the neutral shape every store gets for free. */
export const InfoNeutral: Story = {
  render: () => (
    <div className="max-w-xl">
      <ProductInfo product={product} />
    </div>
  ),
};

/**
 * All three brand slots filled. This is the "compose, don't fork" example from
 * CLAUDE.md: the panel is shared, the voice is injected.
 */
export const InfoWithBrandSlots: Story = {
  render: () => (
    <div className="max-w-xl">
      <ProductInfo
        product={product}
        highlights={
          <>
            <ProductChip icon={<ShieldCheck className="h-3.5 w-3.5" />}>2-year warranty</ProductChip>
            <ProductChip icon={<Leaf className="h-3.5 w-3.5" />}>Recycled titanium</ProductChip>
          </>
        }
        purchaseNote={
          <p>Ordered before 3pm, this ships today. Free delivery over €50.</p>
        }
        perks={
          <>
            <ProductPerk icon={<Truck className="h-4 w-4" />} label="Free over €50" />
            <ProductPerk icon={<RotateCcw className="h-4 w-4" />} label="30-day returns" />
            <ProductPerk icon={<PackageCheck className="h-4 w-4" />} label="2-year warranty" />
          </>
        }
      />
    </div>
  ),
};

/** Every variant of this product is stocked at 0. */
export const InfoOutOfStock: Story = {
  render: () => {
    const soldOut = {
      ...product,
      variants: product.variants.map((v) => ({ ...v, stock: 0 })),
    };
    return (
      <div className="max-w-xl">
        <ProductInfo product={soldOut} />
      </div>
    );
  },
};

export const Grid: Story = {
  render: () => <ProductGrid products={PRODUCTS} />,
};

/** The empty state, with the neutral default copy. */
export const GridEmpty: Story = {
  render: () => <ProductGrid products={[]} />,
};

/** A store can override the empty copy without forking the component. */
export const GridEmptyCustomCopy: Story = {
  render: () => (
    <ProductGrid products={[]} emptyLabel="No gadgets match those filters. Try fewer." />
  ),
};

export const GridSkeleton: Story = {
  render: () => <ProductGridSkeleton count={8} />,
};
