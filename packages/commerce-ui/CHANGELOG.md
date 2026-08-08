# @gucco/commerce-ui

## 0.1.2

### Patch Changes

- Updated dependencies [[`03a468c`](https://github.com/matevosyanmko/commerce-packages/commit/03a468c2a9884f125efbd555dc4fbc21410bce2e)]:
  - @wm-storefront/commerce-core@0.2.0

## 0.1.1

### Patch Changes

- [#25](https://github.com/matevosyanmko/commerce-packages/pull/25) [`e7b4eec`](https://github.com/matevosyanmko/commerce-packages/commit/e7b4eecf3d1feae0ee1004b17594a8dfd1a4432c) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Spell out the actual minimum peer dependency versions in the README instead of listing
  bare package names.
- Updated dependencies [[`e7b4eec`](https://github.com/matevosyanmko/commerce-packages/commit/e7b4eecf3d1feae0ee1004b17594a8dfd1a4432c)]:
  - @wm-storefront/commerce-core@0.1.2

## 0.1.0

### Major Changes

- [#19](https://github.com/matevosyanmko/commerce-packages/pull/19) [`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Renamed from `@gucco/commerce-ui`, and its dependencies on `@gucco/commerce-core` /
  `@gucco/ui` repointed to `@wm-storefront/commerce-core` / `@wm-storefront/ui`.
  Published under a new npm scope — the old `@gucco/*` packages are unpublished and
  will be deprecated once consumers move over. Any store depending on
  `@gucco/commerce-ui` must switch its dependency and imports to
  `@wm-storefront/commerce-ui`.

### Patch Changes

- Updated dependencies [[`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed), [`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed)]:
  - @wm-storefront/commerce-core@1.0.0
  - @wm-storefront/ui@1.0.0

## 0.2.2

### Patch Changes

- [#17](https://github.com/matevosyanmko/commerce-packages/pull/17) [`24a6258`](https://github.com/matevosyanmko/commerce-packages/commit/24a625875db1365adba21e87cbfb395724872948) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Stop `ProductCard` rendering a broken image for a product with no images. The fallback
  `[product.images[0]]` evaluated to `[undefined]` on an empty list, which rendered an `<img>`
  with no `src`; the card now shows the empty frame instead.
- Updated dependencies [[`24a6258`](https://github.com/matevosyanmko/commerce-packages/commit/24a625875db1365adba21e87cbfb395724872948)]:
  - @gucco/commerce-core@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`5be58e8`](https://github.com/matevosyanmko/commerce-packages/commit/5be58e829b7f963188737656dfe70715fa1c7741)]:
  - @gucco/ui@0.2.1
  - @gucco/commerce-core@0.2.1

## 0.2.0

### Minor Changes

- [#9](https://github.com/matevosyanmko/commerce-packages/pull/9) [`e52bf4c`](https://github.com/matevosyanmko/commerce-packages/commit/e52bf4cab108796c10e7b235814ac4147d22e753) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Export `PriceProps`, `ProductCardProps` and `VariantPickerProps` from the barrel, so a store
  can name the props of the components it wraps — `StoreImageProps` and `WordmarkProps` were
  already public, these three were not.

### Patch Changes

- Updated dependencies []:
  - @gucco/commerce-core@0.2.0
  - @gucco/ui@0.2.0

## 0.1.1

### Patch Changes

- [#5](https://github.com/matevosyanmko/commerce-packages/pull/5) [`c359e7b`](https://github.com/matevosyanmko/commerce-packages/commit/c359e7bf5aff9dbbf613e65608db5876330ec0a2) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Emit explicit `.js` extensions in the published output so the packages resolve under plain
  Node ESM, not just under a bundler. Add per-package README and LICENSE, ship `src` alongside
  `dist` so the existing source maps point at real files, and fix the `clean` script.
- Updated dependencies [[`c359e7b`](https://github.com/matevosyanmko/commerce-packages/commit/c359e7bf5aff9dbbf613e65608db5876330ec0a2)]:
  - @gucco/commerce-core@0.1.1
  - @gucco/ui@0.1.1
