# @gucco/ui

## 0.1.2

### Patch Changes

- [#27](https://github.com/matevosyanmko/commerce-packages/pull/27) [`49b57d2`](https://github.com/matevosyanmko/commerce-packages/commit/49b57d2efaf3ca1435050f56f1975c7bf5483423) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Document that every component exports its own prop-type interface.

## 0.1.1

### Patch Changes

- [#21](https://github.com/matevosyanmko/commerce-packages/pull/21) [`ff00445`](https://github.com/matevosyanmko/commerce-packages/commit/ff0044515acc553660072e9aca2df999045daf52) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Document the `cn()` export in the README — it was demonstrated nowhere despite being
  one of the package's two non-component exports.

## 0.1.0

### Major Changes

- [#19](https://github.com/matevosyanmko/commerce-packages/pull/19) [`d0a40d4`](https://github.com/matevosyanmko/commerce-packages/commit/d0a40d444bfabb58d907b0777a938d694e35c0ed) Thanks [@matevosyanmko](https://github.com/matevosyanmko)! - Renamed from `@gucco/ui`. Published under a new npm scope — the old `@gucco/*`
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
