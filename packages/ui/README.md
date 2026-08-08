# @wm-storefront/ui

46 brand-agnostic [Radix UI](https://www.radix-ui.com/) primitive wrappers, plus `cn()` and a
`use-mobile` hook. **This package knows nothing about commerce** — no products, no cart.

Part of [commerce-packages](https://github.com/matevosyanmko/commerce-packages).

## Install

```bash
bun add @wm-storefront/ui react react-dom
```

`react` and `react-dom` (>=19) are peer dependencies. Everything else — Radix, `cva`, `clsx`,
`tailwind-merge`, `cmdk`, `vaul`, `embla`, `recharts` — arrives transitively; don't declare
them yourself. ESM only.

## Usage

```tsx
import { Button } from "@wm-storefront/ui";
// or, cheaper to tree-shake:
import { Button } from "@wm-storefront/ui/button";

<Button variant="outline" size="sm">Add to cart</Button>;
```

## Theming

Components style through **semantic CSS variables only** (`bg-background`, `text-foreground`,
`border-border`) — never a literal colour. The variables themselves are yours to define. The
token contract lives in [`@wm-storefront/config`](https://www.npmjs.com/package/@wm-storefront/config):

```css
@import "@wm-storefront/config/theme.css";
```

Because these components live in `node_modules`, Tailwind won't see their classes unless you
point it at them:

```css
@import "tailwindcss" source(none);
@source "../node_modules/@wm-storefront/ui/dist";
```

Skip that and the classes silently never get generated.

## What's inside

Accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar,
card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer,
dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu,
pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet,
sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group,
tooltip.

A few wrap something other than Radix: `carousel` → embla, `chart` → recharts, `drawer` →
vaul, `command` → cmdk, `calendar` → react-day-picker, `form` → react-hook-form,
`resizable` → react-resizable-panels, `input-otp` → input-otp, `sonner` → sonner.

## Note on `sideEffects`

This package declares `"sideEffects": false`, which is accurate today — no module imports CSS
or registers anything globally. If that ever changes, the import would be tree-shaken away in
consumer builds.

## License

MIT © Mko Matevosyan
