# @gucco/config

## 0.1.1

### Patch Changes

- [#23](https://github.com/matevosyanmko/commerce-packages/pull/23) [`9ccb340`](https://github.com/matevosyanmko/commerce-packages/commit/9ccb3407b55220ab6eac1d51c1b07081630e4b3a) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Surface the "stores must `@source` the package dists" reminder in the public README —
  it previously only existed in the package's internal CLAUDE.md.

## 0.1.0

### Major Changes

- [#19](https://github.com/matevosyanmko/commerce-packages/pull/19) [`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Renamed from `@gucco/config`. Published under a new npm scope — the old `@gucco/*`
  packages are unpublished and will be deprecated once consumers move over. Any store
  depending on `@gucco/config` must switch its dependency, its `@import`/`extends`
  subpaths, and its Tailwind `@source` globs to `@wm-storefront/config`.

## 0.2.1

## 0.2.0

## 0.1.1

### Patch Changes

- [#5](https://github.com/matevosyanmko/commerce-packages/pull/5) [`c359e7b`](https://github.com/matevosyanmko/commerce-packages/commit/c359e7bf5aff9dbbf613e65608db5876330ec0a2) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Emit explicit `.js` extensions in the published output so the packages resolve under plain
  Node ESM, not just under a bundler. Add per-package README and LICENSE, ship `src` alongside
  `dist` so the existing source maps point at real files, and fix the `clean` script.
