// Story data: a GADGETS catalog.
//
// Deliberately not flowers, for the same reason `playground/smoke.ts` is not —
// if a shared component only looks right against floral data, the seam has gone
// brand-shaped. This fixture is richer than smoke's (which needs two products to
// assert arithmetic): a card grid, the facet sidebar and the mega menu all need
// enough breadth to show their real behaviour.

import type {
  Cart,
  CartLineItem,
  Category,
  Collection,
  CommerceData,
  Product,
  ProductOption,
  ProductVariant,
  Region,
} from "@storefront/commerce-core";

export const REGION: Region = {
  id: "reg_eu",
  name: "Europe",
  currency: "EUR",
  locale: "en-IE",
  countries: ["ie", "fr", "de"],
};

export const CATEGORIES: Category[] = [
  { id: "cat_audio", handle: "audio", name: "Audio", description: "Headphones and speakers." },
  { id: "cat_wearables", handle: "wearables", name: "Wearables", description: "Watches and bands." },
  { id: "cat_desk", handle: "desk", name: "Desk", description: "Keyboards, mice and lighting." },
  { id: "cat_power", handle: "power", name: "Power", description: "Chargers and battery packs." },
];

export const COLLECTIONS: Collection[] = [
  { id: "col_premium", handle: "premium", title: "Premium" },
  { id: "col_everyday", handle: "everyday", title: "Everyday" },
];

/* ── Builders ───────────────────────────────────────────────────────────────── */

let seq = 0;

function variant(
  sku: string,
  title: string,
  options: Record<string, string>,
  amount: number,
  stock: number,
  compareAt?: number,
): ProductVariant {
  return {
    id: `var_${sku.toLowerCase()}`,
    sku,
    title,
    options,
    prices: { [REGION.id]: compareAt == null ? { amount } : { amount, compareAt } },
    stock,
  };
}

function product(p: {
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  collection?: string;
  colours: string[];
  price: number;
  compareAt?: number;
  stock?: number;
  extraOption?: ProductOption;
  features?: string[];
}): Product {
  const cat = CATEGORIES.find((c) => c.handle === p.category)!;
  const stock = p.stock ?? 8;

  // One variant per colour, and — where a second option exists — per combination,
  // so the PDP's option matrix has something real to resolve against.
  const variants: ProductVariant[] = [];
  for (const colour of p.colours) {
    const extras = p.extraOption?.values ?? [null];
    extras.forEach((extra, i) => {
      const opts: Record<string, string> = { Colour: colour };
      if (extra && p.extraOption) opts[p.extraOption.name] = extra;
      variants.push(
        variant(
          `${p.handle.slice(0, 6).toUpperCase()}-${colour.slice(0, 3).toUpperCase()}${extra ? `-${i}` : ""}`,
          [colour, extra].filter(Boolean).join(" / "),
          opts,
          p.price + i * 30,
          colour === "Sand" ? 0 : stock, // one reliably out-of-stock colour
          p.compareAt == null ? undefined : p.compareAt + i * 30,
        ),
      );
    });
  }

  const options: ProductOption[] = [
    { id: `opt_colour_${p.handle}`, name: "Colour", values: p.colours },
    ...(p.extraOption ? [p.extraOption] : []),
  ];

  seq += 1;
  return {
    id: `prod_${p.handle}`,
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    categoryIds: [cat.id],
    categoryHandles: [cat.handle],
    collectionHandle: p.collection,
    // `shape:` is a fixture-local image scheme resolved by the `inlineImage`
    // config entry in decorator.tsx — the same seam a store uses for its own.
    images: [`shape:${p.handle}:1`, `shape:${p.handle}:2`, `shape:${p.handle}:3`],
    options,
    variants,
    // Descending, one day apart, so "newest" sorting is deterministic.
    createdAt: new Date(Date.UTC(2026, 0, 30 - seq)).toISOString(),
    tags: p.colours.map((c) => c.toLowerCase()),
    specifications: [
      { label: "Warranty", value: "2 years" },
      { label: "Connectivity", value: "Bluetooth 5.3" },
      { label: "Weight", value: `${180 + seq * 12} g` },
    ],
    features: p.features,
  };
}

const STORAGE: ProductOption = { id: "opt_size", name: "Size", values: ["40 mm", "44 mm"] };

/* ── Catalog ────────────────────────────────────────────────────────────────── */

export const PRODUCTS: Product[] = [
  product({
    handle: "aurora-headphones",
    title: "Aurora Headphones",
    subtitle: "Active noise cancellation",
    description:
      "Over-ear wireless headphones with adaptive noise cancellation and a 40-hour battery.",
    category: "audio",
    collection: "premium",
    colours: ["Black", "Ivory", "Sand"],
    price: 279,
    compareAt: 329,
    features: ["40-hour battery", "Adaptive ANC", "Multipoint pairing"],
  }),
  product({
    handle: "nimbus-speaker",
    title: "Nimbus Speaker",
    subtitle: "Room-filling sound",
    description: "A compact shelf speaker with a woven grille and surprising low end.",
    category: "audio",
    collection: "premium",
    colours: ["Slate", "Ivory"],
    price: 199,
  }),
  product({
    handle: "echo-earbuds",
    title: "Echo Earbuds",
    description: "Featherweight in-ear buds with a pocketable charging case.",
    category: "audio",
    collection: "everyday",
    colours: ["Black", "Sand"],
    price: 129,
    compareAt: 149,
  }),
  product({
    handle: "meridian-watch",
    title: "Meridian Watch",
    subtitle: "Titanium case",
    description: "A brushed titanium smartwatch with a sapphire face and week-long battery.",
    category: "wearables",
    collection: "premium",
    colours: ["Slate", "Black"],
    price: 449,
    extraOption: STORAGE,
    features: ["Sapphire crystal", "7-day battery", "50 m water resistance"],
  }),
  product({
    handle: "pulse-band",
    title: "Pulse Band",
    description: "A lightweight fitness band that tracks sleep, strain and recovery.",
    category: "wearables",
    collection: "everyday",
    colours: ["Black", "Moss"],
    price: 89,
  }),
  product({
    handle: "atlas-keyboard",
    title: "Atlas Keyboard",
    subtitle: "Low-profile mechanical",
    description: "A low-profile mechanical keyboard with hot-swap switches and a milled frame.",
    category: "desk",
    collection: "premium",
    colours: ["Slate", "Ivory"],
    price: 189,
    compareAt: 219,
  }),
  product({
    handle: "orbit-mouse",
    title: "Orbit Mouse",
    description: "A contoured wireless mouse with a silent scroll wheel.",
    category: "desk",
    collection: "everyday",
    colours: ["Black", "Ivory", "Moss"],
    price: 79,
  }),
  product({
    handle: "lumen-lamp",
    title: "Lumen Lamp",
    subtitle: "Tunable white",
    description: "A monitor light bar that lifts your desk without glare on the screen.",
    category: "desk",
    colours: ["Slate"],
    price: 119,
  }),
  product({
    handle: "vertex-dock",
    title: "Vertex Dock",
    description: "An eleven-port dock that drives two displays from a single cable.",
    category: "desk",
    collection: "premium",
    colours: ["Slate", "Black"],
    price: 249,
    stock: 3,
  }),
  product({
    handle: "cobalt-charger",
    title: "Cobalt Charger",
    description: "A folding 65 W charger small enough to forget in a bag.",
    category: "power",
    collection: "everyday",
    colours: ["Ivory", "Black"],
    price: 59,
    compareAt: 69,
  }),
  product({
    handle: "reserve-powerbank",
    title: "Reserve Power Bank",
    subtitle: "Two full charges",
    description: "A 20,000 mAh pack with pass-through charging and a braided cable.",
    category: "power",
    collection: "everyday",
    colours: ["Black", "Moss", "Sand"],
    price: 69,
  }),
  product({
    handle: "tether-cable",
    title: "Tether Cable",
    description: "A two-metre braided USB-C cable rated for 240 W.",
    category: "power",
    colours: ["Black", "Ivory", "Moss", "Sand"],
    price: 24,
  }),
];

/* ── A settled cart ─────────────────────────────────────────────────────────── */
//
// Built as a literal rather than by driving the api, because CartItem and
// CartSummary take a Cart as a PROP — a story that had to mutate its way to the
// right totals would be slower and less legible than stating them.

function line(handle: string, quantity: number): CartLineItem {
  const p = PRODUCTS.find((x) => x.handle === handle)!;
  const v = p.variants[0];
  const price = v.prices[REGION.id];
  return {
    id: `line_${handle}`,
    productId: p.id,
    variantId: v.id,
    title: p.title,
    variantTitle: v.title,
    image: p.images[0],
    quantity,
    unitPrice: price.amount,
    unitCompareAt: price.compareAt,
    handle: p.handle,
  };
}

export const CART_ITEMS: CartLineItem[] = [
  line("aurora-headphones", 1),
  line("cobalt-charger", 2),
  line("tether-cable", 3),
];

const subtotal = CART_ITEMS.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

export const CART: Cart = {
  id: "cart_demo",
  regionId: REGION.id,
  items: CART_ITEMS,
  subtotal,
  discountTotal: 40,
  shippingTotal: 5,
  taxTotal: 0,
  total: subtotal - 40 + 5,
  currency: REGION.currency,
  itemCount: CART_ITEMS.reduce((n, i) => n + i.quantity, 0),
  promoCode: "SAVE10",
};

export const DATA: CommerceData = {
  products: PRODUCTS,
  categories: CATEGORIES,
  collections: COLLECTIONS,
  regions: [REGION],
  defaultRegionId: REGION.id,
  featuredHandles: ["aurora-headphones", "meridian-watch", "atlas-keyboard", "vertex-dock"],
  newArrivalHandles: ["tether-cable", "reserve-powerbank", "cobalt-charger", "lumen-lamp"],
};
