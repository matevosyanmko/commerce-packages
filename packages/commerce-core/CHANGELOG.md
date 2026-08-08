# @gucco/commerce-core

## 0.2.0

### Minor Changes

- [#29](https://github.com/matevosyanmko/commerce-packages/pull/29) [`03a468c`](https://github.com/matevosyanmko/commerce-packages/commit/03a468c2a9884f125efbd555dc4fbc21410bce2e) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Add `formatMoneyRange(min, max, currency?, locale?)` for rendering variant price ranges
  (e.g. "€19 – €49"), a common need with no existing helper in this module.

## 0.1.3

### Patch Changes

- [#27](https://github.com/matevosyanmko/commerce-packages/pull/27) [`49b57d2`](https://github.com/matevosyanmko/commerce-packages/commit/49b57d2efaf3ca1435050f56f1975c7bf5483423) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Note the targeted Medusa v2 SDK version in the README install section.

## 0.1.2

### Patch Changes

- [#25](https://github.com/matevosyanmko/commerce-packages/pull/25) [`e7b4eec`](https://github.com/matevosyanmko/commerce-packages/commit/e7b4eecf3d1feae0ee1004b17594a8dfd1a4432c) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Add the missing `medusa-map` row to the module table in the README.

## 0.1.1

### Patch Changes

- [#23](https://github.com/matevosyanmko/commerce-packages/pull/23) [`9ccb340`](https://github.com/matevosyanmko/commerce-packages/commit/9ccb3407b55220ab6eac1d51c1b07081630e4b3a) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Add the missing `countries` and `analytics` rows to the module table in the README —
  both modules exist and are exported but were undocumented.

## 0.1.0

### Major Changes

- [#19](https://github.com/matevosyanmko/commerce-packages/pull/19) [`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Renamed from `@gucco/commerce-core`. Published under a new npm scope — the old
  `@gucco/*` packages are unpublished and will be deprecated once consumers move over.
  Any store depending on `@gucco/commerce-core` must switch its dependency and imports
  to `@wm-storefront/commerce-core`.

## 0.2.2

### Patch Changes

- [#17](https://github.com/matevosyanmko/commerce-packages/pull/17) [`24a6258`](https://github.com/matevosyanmko/commerce-packages/commit/24a625875db1365adba21e87cbfb395724872948) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Derive the facet price range in one pass instead of `Math.min(...prices)`. The spread passes
  one argument per product, so a catalog above the engine's argument limit (~124k in V8) threw
  `RangeError: Maximum call stack size exceeded` from inside a PLP loader rather than returning
  a range.

## 0.2.1

## 0.2.0

## 0.1.1

### Patch Changes

- [#5](https://github.com/matevosyanmko/commerce-packages/pull/5) [`c359e7b`](https://github.com/matevosyanmko/commerce-packages/commit/c359e7bf5aff9dbbf613e65608db5876330ec0a2) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Emit explicit `.js` extensions in the published output so the packages resolve under plain
  Node ESM, not just under a bundler. Add per-package README and LICENSE, ship `src` alongside
  `dist` so the existing source maps point at real files, and fix the `clean` script.
