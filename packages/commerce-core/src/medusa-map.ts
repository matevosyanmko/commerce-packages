// Translates Medusa store responses into the backend-neutral shapes the UI
// consumes (see types.ts). Keeping all Medusa-specific field knowledge here
// means api.ts reads cleanly and the UI never sees a Medusa type.

import type {
  StoreCart,
  StoreCartLineItem,
  StoreCartShippingOption,
  StoreCollection,
  StoreCustomer,
  StoreOrder,
  StoreOrderLineItem,
  StoreProduct,
  StoreProductCategory,
  StoreProductVariant,
  StoreRegion,
} from "@medusajs/types";
import type {
  Address,
  Cart,
  CartLineItem,
  Category,
  Collection,
  Customer,
  CustomerAddress,
  Order,
  Product,
  ProductOption,
  ProductVariant,
  Region,
  ShippingOption,
  Specification,
} from "./types";

// ---------- Locale / currency ----------
const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  SEK: "sv-SE",
  DKK: "da-DK",
  AUD: "en-AU",
  CAD: "en-CA",
};

export function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALE[currency.toUpperCase()] ?? "en-US";
}

// Medusa timestamps come back as string | Date depending on the field.
function toIsoString(value?: string | Date | null): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return typeof n === "number" && !Number.isNaN(n) ? n : fallback;
}

// ---------- Regions ----------
export function mapRegion(r: StoreRegion): Region {
  const currency = (r.currency_code ?? "eur").toUpperCase();
  return {
    id: r.id,
    name: r.name ?? currency,
    currency,
    locale: localeForCurrency(currency),
    countries: (r.countries ?? []).map((c) => c.iso_2 ?? "").filter(Boolean),
  };
}

// ---------- Categories ----------
export function mapCategory(c: StoreProductCategory): Category {
  // `category_children` is present only when the request asks for it (with
  // include_descendants_tree=true it nests recursively).
  const children = (
    (c as { category_children?: StoreProductCategory[] | null }).category_children ?? []
  ).map(mapCategory);

  return {
    id: c.id,
    handle: c.handle,
    name: c.name,
    description: c.description || undefined,
    image: (c.metadata?.image as string | undefined) || undefined,
    parentId: c.parent_category_id ?? null,
    children: children.length > 0 ? children : undefined,
  };
}

// Build a root-level tree with `children` populated from a flat list.
export function buildCategoryTree(flat: Category[]): Category[] {
  const byId = new Map<string, Category>(
    flat.map((c) => [c.id, { ...c, children: [] as Category[] }]),
  );
  const roots: Category[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

/** Flatten a category and all its descendants into one list (self first). */
export function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((c) => [c, ...flattenCategories(c.children ?? [])]);
}

// ---------- Collections ----------
export function mapCollection(c: StoreCollection): Collection {
  const md = c.metadata ?? {};
  return {
    id: c.id,
    handle: c.handle ?? "",
    title: c.title ?? "",
    description: typeof md.description === "string" ? md.description : undefined,
    image: typeof md.image === "string" ? md.image : undefined,
  };
}

// ---------- Products ----------
function mapVariant(
  v: StoreProductVariant,
  optionIdToTitle: Map<string, string>,
  regionId: string,
): ProductVariant {
  const options: Record<string, string> = {};
  for (const ov of v.options ?? []) {
    const title =
      (ov.option?.title ?? (ov.option_id ? optionIdToTitle.get(ov.option_id) : undefined)) ||
      "Option";
    if (ov.value != null) options[title] = ov.value;
  }

  const calc = v.calculated_price;
  const amount = calc?.calculated_amount ?? 0;
  const original = calc?.original_amount ?? amount;

  // Stock: unmanaged inventory or backorder-allowed variants are always buyable.
  const managed = (v as { manage_inventory?: boolean }).manage_inventory ?? false;
  const backorder = (v as { allow_backorder?: boolean }).allow_backorder ?? false;
  const inventory = (v as { inventory_quantity?: number }).inventory_quantity;
  const stock = !managed || backorder ? 9999 : (inventory ?? 0);

  const metadata = (v as { metadata?: Record<string, unknown> | null }).metadata;
  const image = typeof metadata?.image === "string" ? metadata.image : undefined;

  return {
    id: v.id,
    sku: v.sku ?? v.id,
    title: v.title ?? "Default",
    options,
    prices: {
      [regionId]: {
        amount,
        compareAt: original > amount ? original : undefined,
      },
    },
    stock,
    image,
  };
}

export function mapProduct(p: StoreProduct, regionId: string): Product {
  const optionIdToTitle = new Map<string, string>(
    (p.options ?? []).map((o) => [o.id, o.title]),
  );

  const options: ProductOption[] = (p.options ?? []).map((o) => ({
    id: o.id,
    name: o.title,
    values: Array.from(new Set((o.values ?? []).map((val) => val.value))),
  }));

  const images = (p.images ?? []).map((img) => img.url).filter(Boolean);
  if (!images.length && p.thumbnail) images.push(p.thumbnail);

  // Domain extras live in product metadata — the catalog generator writes them
  // there because Medusa has no first-class spec-sheet field.
  const md = p.metadata ?? {};

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle || undefined,
    description: p.description ?? "",
    categoryIds: (p.categories ?? []).map((c) => c.id),
    categoryHandles: (p.categories ?? []).map((c) => c.handle).filter(Boolean),
    collectionHandle: p.collection?.handle || undefined,
    images,
    options,
    variants: (p.variants ?? []).map((v) => mapVariant(v, optionIdToTitle, regionId)),
    createdAt: toIsoString(p.created_at),
    tags: (p.tags ?? []).map((t) => t.value ?? "").filter(Boolean),
    specifications: Array.isArray(md.specifications) ? (md.specifications as Specification[]) : [],
    features: Array.isArray(md.features) ? (md.features as string[]) : undefined,
  };
}

// ---------- Cart / line items ----------
function mapLineItem(item: StoreCartLineItem | StoreOrderLineItem): CartLineItem {
  const i = item as StoreCartLineItem & {
    product_handle?: string;
    compare_at_unit_price?: number;
  };
  return {
    id: i.id,
    productId: i.product_id ?? "",
    variantId: i.variant_id ?? "",
    title: i.product_title ?? i.title ?? "",
    variantTitle: i.variant_title ?? i.subtitle ?? i.title ?? "",
    image: i.thumbnail ?? undefined,
    quantity: i.quantity,
    unitPrice: i.unit_price ?? 0,
    unitCompareAt: i.compare_at_unit_price ?? undefined,
    handle: i.product_handle ?? "",
  };
}

function mapAddress(a: NonNullable<StoreCart["shipping_address"]>, email: string): Address {
  return {
    firstName: a.first_name ?? "",
    lastName: a.last_name ?? "",
    email,
    phone: a.phone ?? undefined,
    line1: a.address_1 ?? "",
    line2: a.address_2 ?? undefined,
    city: a.city ?? "",
    postalCode: a.postal_code ?? "",
    country: (a.country_code ?? "").toUpperCase(),
  };
}

export function mapCart(cart: StoreCart): Cart {
  const items = [...(cart.items ?? [])]
    .sort((a, b) => toIsoString(a.created_at).localeCompare(toIsoString(b.created_at)))
    .map(mapLineItem);

  return {
    id: cart.id,
    regionId: cart.region_id ?? "",
    items,
    subtotal: cart.item_subtotal ?? cart.subtotal ?? 0,
    discountTotal: cart.discount_total ?? 0,
    // Pre-tax shipping so the summary reconciles: subtotal + shipping + tax = total.
    // (shipping_total is tax-inclusive and would double-count with taxTotal.)
    shippingTotal: cart.shipping_subtotal ?? cart.shipping_total ?? 0,
    taxTotal: cart.tax_total ?? 0,
    total: cart.total ?? 0,
    currency: (cart.currency_code ?? "eur").toUpperCase(),
    itemCount: items.reduce((total, i) => total + i.quantity, 0),
    promoCode: cart.promotions?.find((p) => p.code)?.code ?? null,
    shippingAddress: cart.shipping_address
      ? mapAddress(cart.shipping_address, cart.email ?? "")
      : undefined,
    shippingOptionId: cart.shipping_methods?.[0]?.shipping_option_id ?? undefined,
  };
}

// ---------- Orders ----------
const ORDER_STATUS: Record<string, Order["status"]> = {
  not_fulfilled: "processing",
  partially_fulfilled: "processing",
  fulfilled: "processing",
  partially_shipped: "shipped",
  shipped: "shipped",
  partially_delivered: "shipped",
  delivered: "delivered",
  canceled: "cancelled",
};

export function mapOrder(order: StoreOrder): Order {
  const fulfillment = (order as { fulfillment_status?: string | null }).fulfillment_status;
  return {
    id: order.id,
    displayId: (order as { display_id?: number }).display_id ?? undefined,
    createdAt: toIsoString(order.created_at),
    items: (order.items ?? []).map(mapLineItem),
    subtotal: order.item_subtotal ?? order.subtotal ?? 0,
    // Pre-tax shipping so the summary reconciles (see mapCart).
    shippingTotal: order.shipping_subtotal ?? order.shipping_total ?? 0,
    discountTotal: order.discount_total ?? 0,
    taxTotal: order.tax_total ?? 0,
    total: order.total ?? 0,
    currency: (order.currency_code ?? "eur").toUpperCase(),
    email: order.email ?? "",
    shippingAddress: order.shipping_address
      ? mapAddress(order.shipping_address, order.email ?? "")
      : ({} as Address),
    status: (fulfillment ? ORDER_STATUS[fulfillment] : undefined) ?? "confirmed",
  };
}

// ---------- Customer ----------
export function mapCustomer(c: StoreCustomer): Customer {
  // Favorites ride in customer metadata (Medusa ships no wishlist module), and
  // metadata is free-form JSON from the backend — so it gets the same defensive
  // treatment as product metadata rather than being trusted as string[].
  const saved = (c.metadata ?? {}).favorites;
  return {
    id: c.id,
    email: c.email,
    firstName: c.first_name ?? undefined,
    lastName: c.last_name ?? undefined,
    phone: c.phone ?? undefined,
    favorites: Array.isArray(saved) ? saved.filter((v): v is string => typeof v === "string") : [],
  };
}

export function mapCustomerAddress(
  a: NonNullable<StoreCustomer["addresses"]>[number],
): CustomerAddress {
  return {
    firstName: a.first_name ?? undefined,
    lastName: a.last_name ?? undefined,
    phone: a.phone ?? undefined,
    line1: a.address_1 ?? undefined,
    line2: a.address_2 ?? undefined,
    city: a.city ?? undefined,
    postalCode: a.postal_code ?? undefined,
    country: (a.country_code ?? undefined)?.toUpperCase(),
  };
}

// ---------- Shipping ----------
export function mapShippingOption(o: StoreCartShippingOption): ShippingOption {
  const price =
    (o as { amount?: number }).amount ?? o.calculated_price?.calculated_amount ?? 0;
  const metadata = (o as { metadata?: Record<string, unknown> }).metadata;
  return {
    id: o.id,
    name: o.name,
    price,
    estimatedDays: (metadata?.estimated_days as string | undefined) ?? "",
  };
}

// ---------- Country resolution ----------
// Checkout collects a country from a region-scoped <Select>, but a stored
// customer address or a hand-typed value can still arrive as a name. Resolve
// against the region's countries so Medusa always gets a valid ISO-2 code.
const NAME_TO_ISO2: Record<string, string> = {
  "united states": "us",
  usa: "us",
  "united kingdom": "gb",
  uk: "gb",
  germany: "de",
  france: "fr",
  netherlands: "nl",
  ireland: "ie",
  italy: "it",
  spain: "es",
  sweden: "se",
  denmark: "dk",
  armenia: "am",
  canada: "ca",
  australia: "au",
};

export function resolveCountryCode(input: string, region?: Region): string {
  const countries = region?.countries ?? [];
  const raw = (input ?? "").trim().toLowerCase();

  // Already a valid ISO-2 within the region.
  if (raw.length === 2 && (!countries.length || countries.includes(raw))) return raw;

  const mapped = NAME_TO_ISO2[raw];
  if (mapped && (!countries.length || countries.includes(mapped))) return mapped;

  // Single-country region: there is only one valid answer.
  if (countries.length === 1) return countries[0];
  if (mapped) return mapped;
  return countries[0] ?? raw;
}
