---
"@wm-storefront/commerce-ui": major
---

Renamed from `@gucco/commerce-ui`, and its dependencies on `@gucco/commerce-core` /
`@gucco/ui` repointed to `@wm-storefront/commerce-core` / `@wm-storefront/ui`.
Published under a new npm scope — the old `@gucco/*` packages are unpublished and
will be deprecated once consumers move over. Any store depending on
`@gucco/commerce-ui` must switch its dependency and imports to
`@wm-storefront/commerce-ui`.
