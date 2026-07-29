---
"@gucco/commerce-core": patch
"@gucco/commerce-ui": patch
"@gucco/config": patch
"@gucco/ui": patch
---

Emit explicit `.js` extensions in the published output so the packages resolve under plain
Node ESM, not just under a bundler. Add per-package README and LICENSE, ship `src` alongside
`dist` so the existing source maps point at real files, and fix the `clean` script.
