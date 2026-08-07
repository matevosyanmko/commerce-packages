# @gucco/ui

## 1.0.0

### Major Changes

- [#19](https://github.com/matevosyanmko/commerce-packages/pull/19) [`8af6d89`](https://github.com/matevosyanmko/commerce-packages/commit/8af6d89286ab10abe6ea4126ef743cfc65d8c342) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Renamed from `@gucco/ui`. Published under a new npm scope — the old `@gucco/*`
  packages are unpublished and will be deprecated once consumers move over. Any store
  depending on `@gucco/ui` must switch its dependency and imports to `@wm-storefront/ui`.

## 0.2.1

### Patch Changes

- [#11](https://github.com/matevosyanmko/commerce-packages/pull/11) [`5be58e8`](https://github.com/matevosyanmko/commerce-packages/commit/5be58e829b7f963188737656dfe70715fa1c7741) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Move `sonner` and `lucide-react` to peer dependencies. `@gucco/ui` ships the `<Toaster>`
  wrapper while `@gucco/commerce-ui` calls `toast()` through a peer, so a regular dependency
  here could resolve to a second copy of sonner — the Toaster mounts in one instance, the
  toasts fire into the other, and nothing appears.

## 0.2.0

## 0.1.1

### Patch Changes

- [#5](https://github.com/matevosyanmko/commerce-packages/pull/5) [`c359e7b`](https://github.com/matevosyanmko/commerce-packages/commit/c359e7bf5aff9dbbf613e65608db5876330ec0a2) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Emit explicit `.js` extensions in the published output so the packages resolve under plain
  Node ESM, not just under a bundler. Add per-package README and LICENSE, ship `src` alongside
  `dist` so the existing source maps point at real files, and fix the `clean` script.
