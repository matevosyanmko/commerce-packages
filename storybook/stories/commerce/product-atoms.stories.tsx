// The small product-page pieces: Price, StoreImage, VariantPicker.

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Price, StoreImage, VariantPicker, withSize } from "@storefront/commerce-ui";
import { PRODUCTS } from "../../src/fixture";

const meta: Meta = {
  title: "commerce/Product atoms",
  component: Price,
  subcomponents: { StoreImage, VariantPicker },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Prices: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-1 text-xs uppercase">Plain</p>
        <Price amount={279} />
      </div>
      <div>
        <p className="text-muted-foreground mb-1 text-xs uppercase">Discounted</p>
        <Price amount={279} compareAt={329} />
      </div>
      <div>
        <p className="text-muted-foreground mb-1 text-xs uppercase">Compact (card)</p>
        <Price amount={59} compareAt={69} compact />
      </div>
      <div>
        <p className="text-muted-foreground mb-1 text-xs uppercase">Stacked (PDP)</p>
        <Price amount={449} compareAt={520} stacked />
      </div>
    </div>
  ),
};

/**
 * The `inlineImage` seam: the harness config resolves the fixture's `shape:`
 * scheme to an SVG data URI, so these render with no network request and no
 * `-sm`/`-lg` rewrite. A plain URL would take the progressive path instead.
 */
export const Images: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {(["sm", "base", "lg"] as const).map((size) => (
        <figure key={size} className="w-40">
          <StoreImage
            src={PRODUCTS[0].images[0]}
            size={size}
            alt={PRODUCTS[0].title}
            className="bg-surface aspect-square w-full rounded-xl object-cover"
          />
          <figcaption className="text-muted-foreground mt-2 text-xs">size={size}</figcaption>
        </figure>
      ))}
      <figure className="w-40">
        <StoreImage
          src={PRODUCTS[1].images[0]}
          priority
          alt={PRODUCTS[1].title}
          className="bg-surface aspect-square w-full rounded-xl object-cover"
        />
        <figcaption className="text-muted-foreground mt-2 text-xs">priority (LCP)</figcaption>
      </figure>
    </div>
  ),
};

/** `withSize` is a pure helper — worth showing what it does to a real URL. */
export const SizeRewrite: Story = {
  render: () => (
    <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
      {[
        `withSize("/img/aurora.jpg", "sm")   → ${withSize("/img/aurora.jpg", "sm")}`,
        `withSize("/img/aurora.jpg", "lg")   → ${withSize("/img/aurora.jpg", "lg")}`,
        `withSize("/img/aurora.jpg", "base") → ${withSize("/img/aurora.jpg", "base")}`,
        `withSize("/img/aurora.jpg?v=2","lg")→ ${withSize("/img/aurora.jpg?v=2", "lg")}`,
      ].join("\n")}
    </pre>
  ),
};

export const Variants: Story = {
  render: function Render() {
    const product = PRODUCTS.find((p) => p.handle === "meridian-watch")!;
    const [selected, setSelected] = useState<Record<string, string>>(
      Object.fromEntries(product.options.map((o) => [o.name, o.values[0]])),
    );
    return (
      <div className="max-w-sm space-y-6">
        {product.options.map((option) => (
          <VariantPicker
            key={option.id}
            option={option}
            value={selected[option.name]}
            onChange={(v) => setSelected((s) => ({ ...s, [option.name]: v }))}
          />
        ))}
        <pre className="bg-muted rounded-lg p-3 text-xs">{JSON.stringify(selected, null, 2)}</pre>
      </div>
    );
  },
};
