---
"@gucco/commerce-core": patch
---

Derive the facet price range in one pass instead of `Math.min(...prices)`. The spread passes
one argument per product, so a catalog above the engine's argument limit (~124k in V8) threw
`RangeError: Maximum call stack size exceeded` from inside a PLP loader rather than returning
a range.
