// Cart surfaces that take their data as props: a single line and the totals
// panel. The drawer (which reads from CartProvider instead) has its own file.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@gucco/ui/button";
import { CartItem, CartSummary } from "@gucco/commerce-ui";
import { CART, CART_ITEMS } from "../../src/fixture";

const meta: Meta = {
  title: "commerce/Cart",
  component: CartItem,
  subcomponents: { CartSummary },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Line: Story = {
  render: () => (
    <div className="max-w-md divide-y">
      {CART_ITEMS.map((item) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  ),
};

/** A line whose unit price is marked down carries the compareAt treatment. */
export const LineOnSale: Story = {
  render: () => (
    <div className="max-w-md">
      <CartItem item={CART_ITEMS.find((i) => i.unitCompareAt != null) ?? CART_ITEMS[0]} />
    </div>
  ),
};

export const Summary: Story = {
  render: () => (
    <div className="max-w-sm">
      <CartSummary cart={CART} action={<Button className="w-full">Checkout</Button>} />
    </div>
  ),
};

/** No promo applied and no action slot — the plainest the panel gets. */
export const SummaryPlain: Story = {
  render: () => (
    <div className="max-w-sm">
      <CartSummary
        cart={{
          ...CART,
          promoCode: null,
          discountTotal: 0,
          total: CART.subtotal + CART.shippingTotal,
        }}
      />
    </div>
  ),
};

/** Free shipping — the row should read as free rather than €0. */
export const SummaryFreeShipping: Story = {
  render: () => (
    <div className="max-w-sm">
      <CartSummary
        cart={{
          ...CART,
          promoCode: "FREESHIP",
          discountTotal: 0,
          shippingTotal: 0,
          total: CART.subtotal,
        }}
        action={<Button className="w-full">Checkout</Button>}
      />
    </div>
  ),
};
