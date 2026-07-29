# @gucco/config

Shared tooling. **No build step, no runtime code** — three files consumed by subpath.

```
css/theme.css        @import "@gucco/config/theme.css"
tsconfig.base.json   "extends": "@gucco/config/tsconfig.base.json"
prettier.json        "prettier": "@gucco/config/prettier"   (in package.json)
```

## `theme.css` is a contract, not a theme

It defines the **token → utility mapping** (`@theme inline`), the `dark` variant, the base
layer, and the custom utilities shared components use by name: `container-page`, `eyebrow`,
`surface-card`, `arch`, `leaf`, `marquee-fade`, `no-scrollbar`, `fade-up`.

It defines **no colour values and no fonts**. Every `var(--x)` in it is a variable the
*store* must define in its own `:root` / `.dark`. The required list is in the file header —
**keep it accurate**; it's the only thing standing between a new store and a page of
invisible text.

### Changing it

- **Adding a utility used by a shared component?** It belongs here, and the name becomes
  part of the contract — renaming later breaks every store.
- **Adding a token?** Add the `--color-*` mapping here *and* document the required variable
  in the header. Every existing store must then define it, or that utility silently
  produces nothing.
- **Anything brand-specific stays in the store's `styles.css`.** Fonts, palette values, and
  one-off flourishes are not contract.

## Verifying a change

CSS regressions are invisible in a build log. Diff the output:

```bash
# in a store, before the change
cp .output/public/assets/styles-*.css /tmp/base.css
# after
tr '}' '\n' < /tmp/base.css | sort > /tmp/a.txt
tr '}' '\n' < .output/public/assets/styles-*.css | sort > /tmp/b.txt
diff /tmp/a.txt /tmp/b.txt
```

A refactor that shouldn't change styling must diff to (near) nothing. Anything unexplained
is a regression, not noise.

## Reminder for stores

Tailwind runs with `source(none)`, so a store must also scan the package dists or classes
used only inside package components are silently dropped:

```css
@source "../node_modules/@gucco/ui/dist";
@source "../node_modules/@gucco/commerce-ui/dist";
```
