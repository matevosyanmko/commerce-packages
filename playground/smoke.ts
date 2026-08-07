// Smoke harness for @wm-storefront/commerce-core.
//
// Proves the extracted seam works at runtime AND is genuinely domain-agnostic:
// the fixture below is a GADGETS store, not flowers. The same published core
// that drives the flower shop drives this one — only the injected data differs.
//
// Run: bun run smoke  (from the repo root)  —  builds nothing; imports dist.

import {
  createCommerceApi,
  getFacets,
  productPrice,
  type CommerceData,
  type Product,
  type Region,
} from "@wm-storefront/commerce-core";

/* ── A minimal in-memory localStorage so the cart/order flow is exercisable in
      a non-browser runtime (the core no-ops persistence when window is absent). */
const store = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

/* ── Fixture: a gadgets catalog (deliberately not flowers) ──────────────────── */
const REGION: Region = {
  id: "reg_eu",
  name: "Europe",
  currency: "EUR",
  locale: "en-IE",
  countries: ["ie", "fr"],
};

const products: Product[] = [
  {
    id: "prod_aurora",
    handle: "aurora-headphones",
    title: "Aurora Headphones",
    description: "Over-ear wireless headphones with active noise cancellation.",
    categoryIds: ["cat_audio"],
    categoryHandles: ["audio"],
    collectionHandle: "premium",
    images: ["img:aurora"],
    options: [{ id: "opt_color", name: "Color", values: ["Black", "White"] }],
    variants: [
      {
        id: "var_aurora_black",
        sku: "AUR-BLK",
        title: "Black",
        options: { Color: "Black" },
        prices: { reg_eu: { amount: 199, compareAt: 249 } },
        stock: 5,
      },
      {
        id: "var_aurora_white",
        sku: "AUR-WHT",
        title: "White",
        options: { Color: "White" },
        prices: { reg_eu: { amount: 199 } },
        stock: 0,
      },
    ],
    createdAt: "2026-02-01T00:00:00.000Z",
    tags: ["black", "white"],
    specifications: [{ label: "Battery", value: "30h" }],
  },
  {
    id: "prod_nimbus",
    handle: "nimbus-speaker",
    title: "Nimbus Speaker",
    description: "Compact portable Bluetooth speaker.",
    categoryIds: ["cat_audio"],
    categoryHandles: ["audio"],
    collectionHandle: "everyday",
    images: ["img:nimbus"],
    options: [{ id: "opt_color2", name: "Color", values: ["Grey"] }],
    variants: [
      {
        id: "var_nimbus_grey",
        sku: "NIM-GRY",
        title: "Grey",
        options: { Color: "Grey" },
        prices: { reg_eu: { amount: 89 } },
        stock: 10,
      },
    ],
    createdAt: "2026-03-15T00:00:00.000Z",
    tags: ["grey"],
    specifications: [{ label: "Battery", value: "12h" }],
  },
];

const data: CommerceData = {
  products,
  categories: [{ id: "cat_audio", handle: "audio", name: "Audio" }],
  collections: [
    { id: "col_premium", handle: "premium", title: "Premium" },
    { id: "col_everyday", handle: "everyday", title: "Everyday" },
  ],
  regions: [REGION],
  defaultRegionId: "reg_eu",
  featuredHandles: ["nimbus-speaker"],
  newArrivalHandles: ["aurora-headphones"],
};

const api = createCommerceApi({
  data,
  storagePrefix: "gadgets.",
  currency: "EUR",
  shippingOptions: [{ id: "so_std", name: "Standard", price: 5, estimatedDays: "2–3 days" }],
  paymentProviders: [{ id: "pp_card", name: "Card" }],
  promos: {
    SAVE10: { type: "percent", value: 10 },
    FREESHIP: { type: "freeship" },
  },
});

/* ── Assertions ─────────────────────────────────────────────────────────────── */
let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail !== undefined ? ` — got ${JSON.stringify(detail)}` : ""}`);
  }
}

const RID = "reg_eu";

async function run() {
  console.log("commerce-core smoke (gadgets fixture)\n");

  // Catalog reads
  const all = await api.listProducts({ regionId: RID });
  check("listProducts returns both products", all.total === 2, all.total);

  const overHundred = await api.listProducts({ regionId: RID, filters: { minPrice: 100 } });
  check(
    "minPrice filter keeps only the headphones",
    overHundred.total === 1 && overHundred.items[0]?.handle === "aurora-headphones",
    overHundred.items.map((p) => p.handle),
  );

  const asc = await api.listProducts({ regionId: RID, sort: "price-asc" });
  check(
    "price-asc sorts speaker before headphones",
    asc.items[0]?.handle === "nimbus-speaker",
    asc.items.map((p) => `${p.handle}:${productPrice(p, RID)}`),
  );

  const facets = getFacets(products, new Map(), new Map(), RID);
  check("facet price range spans 89–199", facets.price.min === 89 && facets.price.max === 199, facets.price);
  check("both products count as in stock", facets.inStockCount === 2, facets.inStockCount);

  const search = await api.searchProducts("aurora", RID);
  check("search finds the headphones", search.length === 1 && search[0]?.handle === "aurora-headphones");

  const featured = await api.getFeaturedProducts(RID);
  check("featured resolves the configured handle", featured[0]?.handle === "nimbus-speaker");

  // Cart math
  const cart0 = await api.createCart(RID);
  const cart1 = await api.addLineItem(cart0.id, "var_aurora_black", 2);
  check("cart subtotal = 2 × 199", cart1.subtotal === 398, cart1.subtotal);
  check("cart itemCount = 2", cart1.itemCount === 2, cart1.itemCount);
  check("cart currency is injected EUR", cart1.currency === "EUR", cart1.currency);

  const cart2 = await api.applyPromo(cart1.id, "SAVE10");
  check("SAVE10 discounts 10% (≈40)", cart2.discountTotal === 40, cart2.discountTotal);

  const cart3 = await api.setShippingMethod(cart2.id, "so_std");
  check("shipping applied = 5", cart3.shippingTotal === 5, cart3.shippingTotal);
  check("total = 398 − 40 + 5", cart3.total === 363, cart3.total);

  const cart4 = await api.applyPromo(cart3.id, "FREESHIP");
  check("FREESHIP zeroes shipping", cart4.shippingTotal === 0, cart4.shippingTotal);

  // Order flow
  await api.setShippingAddress(cart4.id, {
    firstName: "Ada",
    lastName: "Byte",
    email: "ada@example.com",
    line1: "1 Register Way",
    city: "Dublin",
    postalCode: "D01",
    country: "ie",
  });
  const order = await api.completeCart(cart4.id, "pp_card");
  check("order total carries over", order.total === cart4.total, { order: order.total, cart: cart4.total });
  const fetched = await api.getOrder(order.id);
  check("getOrder resolves the completed order", fetched?.id === order.id);

  // Storage prefix is honoured (proves brand-scoping is injected, not hardcoded).
  // completeCart clears the cart keys on checkout, so we assert on the order key.
  check("state persisted under the injected prefix", store.has("gadgets.orders"), [...store.keys()]);

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
