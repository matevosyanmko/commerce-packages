---
"@gucco/commerce-ui": minor
---

Export `PriceProps`, `ProductCardProps` and `VariantPickerProps` from the barrel, so a store
can name the props of the components it wraps — `StoreImageProps` and `WordmarkProps` were
already public, these three were not.
