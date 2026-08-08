# @wm-storefront/config

Shared tooling for the storefronts: a Tailwind theme contract, a TypeScript base config and a
Prettier config. **No build step, no runtime code** — three files consumed by subpath.

Part of [commerce-packages](https://github.com/matevosyanmko/commerce-packages).

## Install

```bash
bun add -d @wm-storefront/config
```

## Usage

```css
/* styles.css */
@import "@wm-storefront/config/theme.css";
```

```jsonc
// tsconfig.json
{ "extends": "@wm-storefront/config/tsconfig.base.json" }
```

```jsonc
// package.json
{ "prettier": "@wm-storefront/config/prettier" }
```

## `theme.css` is a contract, not a theme

It defines the token → utility mapping (`@theme inline`), the `dark` variant, the base layer,
and the custom utilities that shared components reference by name: `container-page`,
`eyebrow`, `surface-card`, `arch`, `leaf`, `marquee-fade`, `no-scrollbar`, `fade-up`.

It deliberately defines **no colour values and no fonts**. Every `var(--x)` in it is a
variable your store must define in its own `:root` / `.dark` — the required list is in the
file header. Miss one and the corresponding utility silently produces nothing.

Utility names are part of the contract: renaming one breaks every consuming store.

## Reminder for stores

Tailwind runs with `source(none)`, so a store must also scan the package dists or classes
used only inside `@wm-storefront/ui` / `@wm-storefront/commerce-ui` components are silently
dropped:

```css
@source "../node_modules/@wm-storefront/ui/dist";
@source "../node_modules/@wm-storefront/commerce-ui/dist";
```

## License

MIT © Mko Matevosyan
