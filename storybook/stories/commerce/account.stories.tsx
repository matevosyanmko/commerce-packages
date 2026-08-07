// Account surfaces: the auth page shell and the favourite toggle.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@wm-storefront/ui/button";
import { Input } from "@wm-storefront/ui/input";
import { AuthField, AuthShell, FavoriteButton } from "@wm-storefront/commerce-ui";
import { PRODUCTS } from "../../src/fixture";

const meta: Meta = {
  title: "commerce/Account",
  component: AuthShell,
  subcomponents: { AuthField, FavoriteButton },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const SignIn: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your orders and saved gadgets."
      footer={<>New here? Create an account.</>}
    >
      <form className="space-y-5">
        <AuthField label="Email">
          <Input type="email" placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Password">
          <Input type="password" />
        </AuthField>
        <Button className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  ),
};

/**
 * `AuthField` clones its child to wire up `id`, `aria-invalid` and
 * `aria-describedby` — the error state is where that wiring actually matters.
 */
export const SignInWithErrors: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <AuthShell title="Welcome back">
      <form className="space-y-5">
        <AuthField label="Email" error="We don't recognise that address.">
          <Input type="email" defaultValue="nobody@example" />
        </AuthField>
        <AuthField label="Password" error="Passwords are at least eight characters.">
          <Input type="password" defaultValue="short" />
        </AuthField>
        <Button className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  ),
};

/** Minimal shell — no subtitle, no footer. */
export const ShellBare: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <AuthShell title="Reset your password">
      <form className="space-y-5">
        <AuthField label="Email">
          <Input type="email" />
        </AuthField>
        <Button className="w-full">Send reset link</Button>
      </form>
    </AuthShell>
  ),
};

/**
 * Toggling fires a toast through the harness Toaster and persists to the api.
 * The decorator clears the harness storage prefix per story, so these always
 * start unsaved.
 */
export const Favorites: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3">
        <FavoriteButton productId={PRODUCTS[0].id} productTitle={PRODUCTS[0].title} />
        <span className="text-muted-foreground text-sm">small</span>
      </div>
      <div className="flex items-center gap-3">
        <FavoriteButton productId={PRODUCTS[1].id} productTitle={PRODUCTS[1].title} size="lg" />
        <span className="text-muted-foreground text-sm">large</span>
      </div>
    </div>
  ),
};
