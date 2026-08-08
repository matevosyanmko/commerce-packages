# @gucco/commerce-core

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
