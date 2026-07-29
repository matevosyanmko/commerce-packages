---
"@gucco/commerce-ui": patch
---

Stop `ProductCard` rendering a broken image for a product with no images. The fallback
`[product.images[0]]` evaluated to `[undefined]` on an empty list, which rendered an `<img>`
with no `src`; the card now shows the empty frame instead.
