// Money formatting. Amounts are in display units (e.g. 1249.00), never cents.
//
// Currency is a caller concern: the storefront's RegionProvider always holds a
// region, so every call site passes the region's currency. The fallback here is
// only for the rare unparameterised call — a brand that wants a different
// fallback passes `currency` explicitly (or wraps this with its configured one).

const FALLBACK_CURRENCY = "EUR";

export function formatMoney(
  amount: number,
  currency: string = FALLBACK_CURRENCY,
  locale = "en-US",
): string {
  // Show cents only when the amount actually has a fractional part, so whole
  // prices stay clean while sale prices (e.g. 19.99) render correctly.
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneyRange(
  min: number,
  max: number,
  currency: string = FALLBACK_CURRENCY,
  locale = "en-US",
): string {
  if (min === max) return formatMoney(min, currency, locale);
  return `${formatMoney(min, currency, locale)} – ${formatMoney(max, currency, locale)}`;
}

export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
