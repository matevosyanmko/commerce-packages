---
"@wm-storefront/config": major
---

Renamed from `@gucco/config`. Published under a new npm scope — the old `@gucco/*`
packages are unpublished and will be deprecated once consumers move over. Any store
depending on `@gucco/config` must switch its dependency, its `@import`/`extends`
subpaths, and its Tailwind `@source` globs to `@wm-storefront/config`.
