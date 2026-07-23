// Turn the ISO-2 country codes a region ships to into a labelled, sorted list
// for a <Select>. Using the platform's Intl.DisplayNames avoids maintaining a
// hand-written code→name table.

let displayNames: Intl.DisplayNames | null = null;
function getDisplayNames(): Intl.DisplayNames | null {
  if (displayNames) return displayNames;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    displayNames = null;
  }
  return displayNames;
}

export function countryName(code: string): string {
  const iso = code.toUpperCase();
  const dn = getDisplayNames();
  return dn?.of(iso) ?? iso;
}

export interface CountryOption {
  code: string; // ISO-2, lowercase (matches Medusa)
  name: string;
}

export function countryOptions(codes: string[]): CountryOption[] {
  return codes
    .filter(Boolean)
    .map((c) => ({ code: c.toLowerCase(), name: countryName(c) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
