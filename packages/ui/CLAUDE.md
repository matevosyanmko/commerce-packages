# @gucco/ui

Brand-agnostic Radix primitives — 46 vendored wrappers, plus `cn()` (`utils.ts`) and the
`use-mobile` hook. **This package knows nothing about commerce.** No products, no cart, no
`@gucco/commerce-core` import — if you need one, you're in the wrong package.

## Rules

- **Never hand-roll what Radix provides.** Dropdowns, dialogs, popovers, tabs, accordions,
  tooltips, selects, checkboxes, radios, switches, sliders, scroll areas and nav menus must
  be built on the primitive — not `div`s with `useState`, click-outside listeners and manual
  key handling. Radix gives focus trapping and restore, roving tabindex, `aria-*` wiring,
  Escape/arrow keys, collision-aware portalled positioning and scroll locking for free.
- **Match the existing file style exactly**: `React.forwardRef` with
  `React.ElementRef` / `React.ComponentPropsWithoutRef` generics, `cn()` for classes,
  `Primitive.displayName` assignment, variants via `cva`. Only 2 of 46 use `data-slot`;
  don't spread that further.
- **Do not run `bunx shadcn@latest add …`.** It emits today's upstream style, which doesn't
  match these files. Hand-write the wrapper instead.
- **Style through tokens only.** Semantic CSS variables (`bg-background`, `text-foreground`,
  `border-border`) — never a literal colour. The variables are defined by the *store*, via
  `@gucco/config/theme.css`.
- **Never override Radix's positioning, focus management or `data-state` behaviour.**

## Adding a wrapper

1. `bun add @radix-ui/react-<primitive>` **in this package** — stores don't declare these,
   they arrive transitively, so a dependency added to a store instead of here will resolve in
   dev and break for the next store.
2. Write `src/<name>.tsx` in the convention above.
3. Add `export * from "./<name>";` to `src/index.ts`.
4. `bun run build` — stores resolve `dist`, not `src`.

Subpath exports are generated automatically (`@gucco/ui/<name>`), so no config change
is needed. Stores import from here directly; **they do not re-export our components**, so an
export you don't add to the barrel is effectively invisible.

## Note

A few files wrap other libraries rather than Radix — know which before hunting for a
primitive that doesn't exist:

| file | backed by | file | backed by |
| --- | --- | --- | --- |
| `carousel` | embla-carousel-react | `chart` | recharts |
| `drawer` | vaul | `calendar` | react-day-picker |
| `command` | cmdk | `input-otp` | input-otp |
| `sonner` | sonner | `resizable` | react-resizable-panels |
