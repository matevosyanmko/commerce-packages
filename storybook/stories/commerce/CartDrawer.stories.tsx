// Exercises a real mutation through CartProvider — the drawer reads its state
// from context, so nothing here passes props. Seeding happens through the api,
// the same path a store's add-to-cart button takes.

import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@gucco/ui/button";
import { CartDrawer, useCart } from "@gucco/commerce-ui";
import { baseConfig } from "../../src/decorator";
import { PRODUCTS } from "../../src/fixture";

/** Seeds a couple of lines, then opens the drawer. */
function Seeded({ open = true, empty = false }: { open?: boolean; empty?: boolean }) {
  const { addItem, openDrawer, itemCount } = useCart();
  // The provider persists to localStorage under the harness prefix, so without
  // this guard a remount would keep stacking quantities onto the same cart.
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    (async () => {
      if (!empty) {
        await addItem(PRODUCTS[0].variants[0].id, 1);
        await addItem(PRODUCTS[5].variants[0].id, 2);
      }
      if (open) openDrawer();
    })();
  }, [addItem, openDrawer, open, empty]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {empty ? "No items seeded." : `${itemCount} item(s) in the basket.`}
      </p>
      <Button variant="outline" onClick={openDrawer}>
        Open basket
      </Button>
      <CartDrawer />
    </div>
  );
}

const meta = {
  title: "commerce/CartDrawer",
  component: CartDrawer,
} satisfies Meta<typeof CartDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {
  render: () => <Seeded />,
};

/** The empty state, and the copy fallbacks when the store sets no `copy.cart*`. */
export const EmptyNeutralCopy: Story = {
  render: () => <Seeded empty />,
};

/** The same empty state with a store's own voice injected. */
export const EmptyBrandCopy: Story = {
  parameters: {
    storefrontConfig: {
      ...baseConfig,
      copy: {
        cartEmptyTitle: "Nothing packed yet",
        cartEmptyHint: "Add a gadget and it'll show up here.",
        cartEmptyCta: "Browse the shop",
      },
    },
  },
  render: () => <Seeded empty />,
};
