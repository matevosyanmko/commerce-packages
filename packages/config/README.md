# @gucco/config

Shared tooling for the storefronts: a Tailwind theme contract, a TypeScript base config and a
Prettier config. **No build step, no runtime code** — three files consumed by subpath.

Part of [commerce-packages](https://github.com/matevosyanmko/commerce-packages).

## Install

```bash
bun add -d @gucco/config
```

## Usage

```css
/* styles.css */
@import "@gucco/config/theme.css";
```

```jsonc
// tsconfig.json
{ "extends": "@gucco/config/tsconfig.base.json" }
```

```jsonc
// package.json
{ "prettier": "@gucco/config/prettier" }
```

## `theme.css` is a contract, not a theme

It defines the token → utility mapping (`@theme inline`), the `dark` variant, the base layer,
and the custom utilities that shared components reference by name: `container-page`,
`eyebrow`, `surface-card`, `arch`, `leaf`, `marquee-fade`, `no-scrollbar`, `fade-up`.

It deliberately defines **no colour values and no fonts**. Every `var(--x)` in it is a
variable your store must define in its own `:root` / `.dark` — the required list is in the
file header. Miss one and the corresponding utility silently produces nothing.

Utility names are part of the contract: renaming one breaks every consuming store.

## License

MIT © Mko Matevosyan
