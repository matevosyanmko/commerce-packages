// Backend-neutral commerce shapes. The UI consumes only these types.
// Medusa's own shapes never leave medusa-map.ts.

export interface Region {
  id: string;
  name: string;
  currency: string; // ISO 4217, upper-case
  locale: string; // BCP 47
  countries: string[]; // ISO-2, lower-case (matches Medusa)
}

export interface Category {
  id: string;
  handle: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[]; // built by listCategories() / getCategoryTree()
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: string;
}

export interface ProductOption {
  id: string;
  name: string; // "Color", "Storage", "Screen Size"
  values: string[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  options: Record<string, string>; // { Color: "Midnight", Storage: "256GB" }
  // Price in display units, keyed by region id. A product is fetched for one
  // region at a time, so in practice there is exactly one entry — read it
  // through pricing.ts rather than indexing directly.
  prices: Record<string, { amount: number; compareAt?: number }>;
  stock: number; // 0 = out of stock
  image?: string; // per-variant image (Medusa variant metadata.image)
}

/** A spec-sheet row on the PDP, from the product's `metadata.specifications`. */
export interface Specification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  /** Category ids — what the store API filters on. */
  categoryIds: string[];
  /** Category handles — what the PLPs and facets match on. Both are needed:
   *  a product filed under a child category must still surface on its parent's
   *  page, and that comparison happens by handle. */
  categoryHandles: string[];
  collectionHandle?: string;
  images: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  createdAt: string;
  tags?: string[];
  specifications: Specification[];
  features?: string[];
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /**
   * Saved product ids. Medusa has no wishlist module, so these live in customer
   * metadata — see `FavoritesProvider`.
   */
  favorites: string[];
}

// A saved customer address (default shipping). All fields optional — the
// account lets shoppers fill as much or as little as they like.
export interface CustomerAddress {
  firstName?: string;
  lastName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string; // ISO-2 code
}

export interface CartLineItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  unitCompareAt?: number;
  handle: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  description?: string;
}

export interface Cart {
  id: string;
  regionId: string;
  items: CartLineItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  itemCount: number;
  promoCode?: string | null;
  shippingAddress?: Address;
  shippingOptionId?: string;
}

export interface Order {
  id: string;
  displayId?: number;
  createdAt: string;
  items: CartLineItem[];
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  email: string;
  shippingAddress: Address;
  status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export interface ProductFilters {
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  optionValues?: Record<string, string[]>; // { Storage: ["256GB"] }
  inStockOnly?: boolean;
  collection?: string;
  subcategory?: string;
  tags?: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- facets ------------------------------------------------------------------
// Medusa's store API can't aggregate, so facets are DERIVED from the product set
// already in memory (see CLAUDE.md "in-memory filtering"). Every facet therefore
// reflects exactly what the shopper can actually reach from the current page.

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface Facet {
  /** Stable key used in the URL, e.g. `Color` for a product option. */
  key: string;
  label: string;
  values: FacetValue[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Facets {
  price: PriceRange;
  /** One per product option name present in the set (Color, Storage, …). */
  options: Facet[];
  collections: Facet[];
  tags: Facet[];
  /** Child categories present in the set; empty unless the page's category
   *  has children in Medusa. */
  subcategories: Facet[];
  inStockCount: number;
}
