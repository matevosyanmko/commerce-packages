// The shared chrome, and the second with/without pair. `Wordmark` and
// `copy.announcement` are both optional config entries with neutral fallbacks —
// the navbar must read sensibly for a store that supplies neither.
//
// It also runs two live queries (category tree, collections) off the injected
// api, so this is where a broken QueryClient in the decorator would show.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar, type WordmarkProps } from "@wm-storefront/commerce-ui";
import { baseConfig } from "../../src/decorator";

/** Stand-in for a store's logo lockup — geometric, not any real brand's mark. */
function DemoWordmark({ className, iconClassName }: WordmarkProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg viewBox="0 0 24 24" width="22" height="22" className={iconClassName} aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--bloom)" />
        <circle cx="12" cy="12" r="5" fill="var(--bloom-foreground)" />
      </svg>
      <span className="font-display text-lg font-medium tracking-tight">Gadget Works</span>
    </span>
  );
}

const meta = {
  title: "commerce/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No `Wordmark`, no `announcement` — falls back to `siteName` as text. */
export const NeutralFallback: Story = {};

/** A store that injects its lockup and its standing promise. */
export const BrandedWordmark: Story = {
  parameters: {
    storefrontConfig: {
      ...baseConfig,
      Wordmark: DemoWordmark,
      copy: {
        announcement: "Free delivery on orders over €50",
        savedItemsLabel: "Saved gadgets",
        cartNoun: { singular: "gadget", plural: "gadgets" },
      },
    },
  },
};
