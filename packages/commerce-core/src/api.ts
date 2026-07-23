// The data-access seam, as an injectable factory.
//
// The UI calls the same backend-neutral functions regardless of where the data
// comes from. What differs per storefront — the catalog, the storage-key prefix,
// the currency, the shipping/payment/promo config, the copy — is INJECTED via
// `createCommerceApi(config)` rather than imported, so this file holds no brand
// data and no brand literals and can be published once and shared by every store.
//
// MOCK-DATA MODE: pass a `data` object built from local fixtures and the cart /
// order / customer state is simulated in `localStorage` (keyed by `storagePrefix`).
// TO CONNECT MEDUSA LATER: keep this factory's returned signatures and swap the
// bodies to the SDK-backed versions — `sdk.ts` / `medusa-map.ts` are the adapter.
//
// The pure helpers (`sortProducts`, `applyFilters`, `filtersActive`, `getFacets`)
// live in `catalog.ts`: they take neutral data as arguments and need no config.

import type {
  Address,
  Cart,
  CartLineItem,
  Category,
  Collection,
  Customer,
  CustomerAddress,
  Order,
  Paginated,
  PaymentProvider,
  Product,
  ProductFilters,
  ProductVariant,
  Region,
  ShippingOption,
  SortKey,
} from "./types";
import { buildCategoryTree, flattenCategories } from "./medusa-map";
import { productPrice, variantPrice } from "./pricing";
import { applyFilters, sortProducts } from "./catalog";

/* ── Injected configuration ─────────────────────────────────────────────────── */

/** The catalog a storefront runs on. In Medusa mode these come from the SDK. */
export interface CommerceData {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  regions: Region[];
  /** Fallback region id when a caller passes none (e.g. SSR loaders). */
  defaultRegionId: string;
  featuredHandles: string[];
  newArrivalHandles: string[];
}

export type Promo = { type: "percent"; value: number } | { type: "freeship" };

/** User-facing error strings, so brand voice isn't baked into shared code. */
export interface CommerceCopy {
  variantUnavailable: string;
  cartExpired: string;
  cartNotFound: string;
  cartEmpty: string;
  invalidPromo: string;
  notSignedIn: string;
}

const DEFAULT_COPY: CommerceCopy = {
  variantUnavailable: "That item is no longer available.",
  cartExpired: "Your cart has expired.",
  cartNotFound: "We couldn't find your cart. Please try again.",
  cartEmpty: "Your cart is empty.",
  invalidPromo: "That code isn't valid for the items in your cart.",
  notSignedIn: "You're not signed in.",
};

export interface CommerceConfig {
  data: CommerceData;
  /** localStorage key prefix, brand-scoped so two stores on one origin don't collide. */
  storagePrefix: string;
  currency: string;
  shippingOptions: ShippingOption[];
  paymentProviders: PaymentProvider[];
  promos: Record<string, Promo>;
  copy?: Partial<CommerceCopy>;
  /** Simulated network latency for exercising loading states. Default 0. */
  latencyMs?: number;
}

/** Everything the UI imports from the `api` seam. */
export type CommerceApi = ReturnType<typeof createCommerceApi>;

export function createCommerceApi(config: CommerceConfig) {
  const {
    data: { products: PRODUCTS, categories: CATEGORIES, collections: COLLECTIONS, regions: REGIONS },
    currency,
    shippingOptions: SHIPPING_OPTIONS,
    paymentProviders: PAYMENT_PROVIDERS,
    promos: PROMOS,
  } = config;
  const REGION_ID = config.data.defaultRegionId;
  const FEATURED_HANDLES = config.data.featuredHandles;
  const NEW_ARRIVAL_HANDLES = config.data.newArrivalHandles;
  const copy = { ...DEFAULT_COPY, ...config.copy };

  const LATENCY_MS = config.latencyMs ?? 0;
  const settle = <T>(value: T): Promise<T> =>
    LATENCY_MS > 0 ? new Promise((r) => setTimeout(() => r(value), LATENCY_MS)) : Promise.resolve(value);

  function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }

  // ---------- localStorage helpers (client-only; no-op / null on the server) ----
  const CART_ID_KEY = `${config.storagePrefix}cartId`;
  const CART_KEY = `${config.storagePrefix}cart`;
  const ORDERS_KEY = `${config.storagePrefix}orders`;
  const CUSTOMER_KEY = `${config.storagePrefix}customer`;
  const ADDRESS_KEY = `${config.storagePrefix}address`;

  function readJson<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  function writeJson(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  function removeKey(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }

  function readCartIdFromStorage(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CART_ID_KEY);
  }
  function writeCartIdToStorage(id: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_ID_KEY, id);
  }
  function clearCartIdFromStorage() {
    removeKey(CART_ID_KEY);
    removeKey(CART_KEY);
  }

  // ---------- Regions ----------
  async function getRegions(): Promise<Region[]> {
    return settle(REGIONS);
  }
  async function resolveRegionId(regionId?: string): Promise<string> {
    return regionId || REGIONS[0]?.id || REGION_ID;
  }
  async function listRegions(): Promise<Region[]> {
    return getRegions();
  }
  async function getRegion(id?: string): Promise<Region> {
    const found = id ? REGIONS.find((r) => r.id === id) : undefined;
    return settle(found ?? REGIONS[0]);
  }
  async function getRegionId(regionId?: string): Promise<string> {
    return resolveRegionId(regionId);
  }

  // ---------- Categories ----------
  async function listCategories(): Promise<Category[]> {
    return settle(CATEGORIES);
  }
  async function getCategoryTree(): Promise<Category[]> {
    // The catalog is flat; buildCategoryTree returns the roots (all of them) and
    // lights up subcategory columns on its own if parent links are ever added.
    return settle(buildCategoryTree(CATEGORIES));
  }
  async function getCategory(handle: string): Promise<Category | null> {
    return settle(CATEGORIES.find((c) => c.handle === handle) ?? null);
  }
  function categoryHandleScope(category: Category): string[] {
    return flattenCategories([category]).map((c) => c.handle);
  }

  // ---------- Collections ----------
  async function listCollections(): Promise<Collection[]> {
    return settle(COLLECTIONS);
  }
  async function getCollection(handle: string): Promise<Collection | null> {
    return settle(COLLECTIONS.find((c) => c.handle === handle) ?? null);
  }

  // ---------- Products ----------
  const VARIANT_INDEX = new Map<string, { product: Product; variant: ProductVariant }>();
  for (const p of PRODUCTS) for (const v of p.variants) VARIANT_INDEX.set(v.id, { product: p, variant: v });

  const COLLECTION_HANDLE_BY_ID = new Map(COLLECTIONS.map((c) => [c.id, c.handle]));

  async function listAllProducts(_regionId: string): Promise<Product[]> {
    return settle(PRODUCTS);
  }

  async function listProducts(opts: {
    categoryId?: string;
    categoryHandles?: string[];
    collectionId?: string;
    collectionHandle?: string;
    regionId: string;
    filters?: ProductFilters;
    page?: number;
    pageSize?: number;
    sort?: SortKey;
  }): Promise<Paginated<Product>> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 24;
    const sort = opts.sort ?? "featured";
    const regionId = await resolveRegionId(opts.regionId);

    let all = PRODUCTS;

    const categoryId = opts.categoryId ?? opts.filters?.categoryIds?.[0];
    if (categoryId) all = all.filter((p) => p.categoryIds.includes(categoryId));

    if (opts.categoryHandles?.length) {
      const scope = new Set(opts.categoryHandles);
      all = all.filter((p) => p.categoryHandles.some((h) => scope.has(h)));
    }

    const collectionHandle =
      opts.collectionHandle ??
      (opts.collectionId ? COLLECTION_HANDLE_BY_ID.get(opts.collectionId) : undefined);
    if (collectionHandle) all = all.filter((p) => p.collectionHandle === collectionHandle);

    const filtered = opts.filters ? applyFilters(all, opts.filters, regionId) : all;
    const ordered = sortProducts(filtered, sort, regionId);
    const start = (page - 1) * pageSize;
    return settle({
      items: ordered.slice(start, start + pageSize),
      total: ordered.length,
      page,
      pageSize,
    });
  }

  async function getProduct(handle: string, _regionId: string): Promise<Product | null> {
    return settle(PRODUCTS.find((p) => p.handle === handle) ?? null);
  }

  async function listProductsByIds(ids: string[], _regionId: string): Promise<Product[]> {
    if (ids.length === 0) return [];
    const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
    return settle(ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p)));
  }

  async function searchProducts(query: string, _regionId: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hit = (p: Product) =>
      p.title.toLowerCase().includes(q) ||
      (p.subtitle ?? "").toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
      p.categoryHandles.some((h) => h.includes(q));
    return settle(PRODUCTS.filter(hit).slice(0, 50));
  }

  async function getRelatedProducts(handle: string, _regionId: string, limit = 4): Promise<Product[]> {
    const product = PRODUCTS.find((p) => p.handle === handle);
    if (!product) return [];
    const cats = new Set(product.categoryHandles);
    const related = PRODUCTS.filter((p) => p.id !== product.id && p.categoryHandles.some((h) => cats.has(h)));
    // Top up from the same collection, then anything, so we always return `limit`.
    const pool = [
      ...related,
      ...PRODUCTS.filter((p) => p.id !== product.id && p.collectionHandle === product.collectionHandle),
      ...PRODUCTS.filter((p) => p.id !== product.id),
    ];
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of pool) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= limit) break;
    }
    return settle(out);
  }

  function byHandles(handles: string[]): Product[] {
    const byHandle = new Map(PRODUCTS.map((p) => [p.handle, p]));
    return handles.map((h) => byHandle.get(h)).filter((p): p is Product => Boolean(p));
  }

  async function getFeaturedProducts(_regionId: string, limit = 4): Promise<Product[]> {
    return settle(byHandles(FEATURED_HANDLES).slice(0, limit));
  }

  async function getProductsByCollection(collectionHandle: string, _regionId: string, limit = 8): Promise<Product[]> {
    return settle(PRODUCTS.filter((p) => p.collectionHandle === collectionHandle).slice(0, limit));
  }

  async function getNewArrivals(_regionId: string, limit = 8): Promise<Product[]> {
    return settle(byHandles(NEW_ARRIVAL_HANDLES).slice(0, limit));
  }
  async function getBestSellers(_regionId: string, limit = 8): Promise<Product[]> {
    return settle(byHandles(FEATURED_HANDLES).slice(0, limit));
  }

  // ---------- Cart (simulated, persisted in localStorage) ----------
  function emptyCart(id: string, regionId: string): Cart {
    return {
      id,
      regionId,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      total: 0,
      currency,
      itemCount: 0,
      promoCode: null,
    };
  }

  function recompute(cart: Cart): Cart {
    cart.subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    cart.itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

    const promo = cart.promoCode ? PROMOS[cart.promoCode.toUpperCase()] : undefined;
    cart.discountTotal = promo?.type === "percent" ? Math.round((cart.subtotal * promo.value) / 100) : 0;

    let shipping = cart.shippingOptionId
      ? SHIPPING_OPTIONS.find((o) => o.id === cart.shippingOptionId)?.price ?? 0
      : 0;
    if (promo?.type === "freeship") shipping = 0;
    cart.shippingTotal = shipping;

    cart.taxTotal = 0; // demo: prices are shown VAT-inclusive
    cart.total = Math.max(0, cart.subtotal - cart.discountTotal) + cart.shippingTotal;
    return cart;
  }

  function readCart(): Cart | null {
    return readJson<Cart>(CART_KEY);
  }
  function writeCart(cart: Cart) {
    writeJson(CART_KEY, cart);
    writeCartIdToStorage(cart.id);
  }

  function lineFromVariant(product: Product, variant: ProductVariant, quantity: number): CartLineItem {
    const price = variantPrice(variant, REGION_ID);
    return {
      id: `li_${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      image: product.images[0],
      quantity,
      unitPrice: price.amount,
      unitCompareAt: price.compareAt,
      handle: product.handle,
    };
  }

  async function createCart(regionId: string): Promise<Cart> {
    const rid = await resolveRegionId(regionId);
    const cart = emptyCart(uid("cart"), rid);
    writeCart(cart);
    return settle(cart);
  }

  async function getOrCreateCart(regionId: string): Promise<Cart> {
    const existing = readCart();
    if (existing) return settle(existing);
    return createCart(regionId);
  }

  async function getCart(id: string): Promise<Cart | null> {
    const cart = readCart();
    return settle(cart && cart.id === id ? cart : null);
  }

  async function addLineItem(cartId: string, variantId: string, qty = 1): Promise<Cart> {
    const cart = readCart() ?? emptyCart(cartId, REGION_ID);
    const ref = VARIANT_INDEX.get(variantId);
    if (!ref) throw new Error(copy.variantUnavailable);
    const existing = cart.items.find((i) => i.variantId === variantId);
    if (existing) existing.quantity += qty;
    else cart.items.push(lineFromVariant(ref.product, ref.variant, qty));
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  async function updateLineItem(cartId: string, itemId: string, qty: number): Promise<Cart> {
    if (qty <= 0) return removeLineItem(cartId, itemId);
    const cart = readCart();
    if (!cart) throw new Error(copy.cartExpired);
    const line = cart.items.find((i) => i.id === itemId);
    if (line) line.quantity = qty;
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  async function removeLineItem(_cartId: string, itemId: string): Promise<Cart> {
    const cart = readCart();
    if (!cart) throw new Error(copy.cartExpired);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  async function applyPromo(_cartId: string, code: string): Promise<Cart> {
    const cart = readCart();
    if (!cart) throw new Error(copy.cartExpired);
    const trimmed = code.trim().toUpperCase();
    if (!PROMOS[trimmed]) {
      throw new Error(copy.invalidPromo);
    }
    cart.promoCode = trimmed;
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  // ---------- Checkout ----------
  async function setShippingAddress(cartId: string, address: Address): Promise<Cart> {
    const cart = readCart() ?? emptyCart(cartId, REGION_ID);
    cart.shippingAddress = address;
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  async function listShippingOptions(_cartId: string): Promise<ShippingOption[]> {
    return settle(SHIPPING_OPTIONS);
  }

  async function setShippingMethod(cartId: string, optionId: string): Promise<Cart> {
    const cart = readCart() ?? emptyCart(cartId, REGION_ID);
    cart.shippingOptionId = optionId;
    recompute(cart);
    writeCart(cart);
    return settle(cart);
  }

  async function listPaymentProviders(_cartId: string): Promise<PaymentProvider[]> {
    return settle(PAYMENT_PROVIDERS);
  }

  // ---------- Orders ----------
  // Kept in a module map (survives client navigation) AND localStorage (survives a
  // hard reload of the confirmation page), so getOrder resolves in both cases.
  const orderStore = new Map<string, Order>();

  function persistOrder(order: Order) {
    orderStore.set(order.id, order);
    const all = readJson<Record<string, Order>>(ORDERS_KEY) ?? {};
    all[order.id] = order;
    writeJson(ORDERS_KEY, all);
  }

  function readAllOrders(): Order[] {
    const stored = readJson<Record<string, Order>>(ORDERS_KEY) ?? {};
    const merged = new Map<string, Order>(Object.entries(stored));
    for (const [id, o] of orderStore) merged.set(id, o);
    return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function completeCart(cartId: string, _paymentProviderId?: string): Promise<Order> {
    const cart = readCart();
    if (!cart || cart.id !== cartId) throw new Error(copy.cartNotFound);
    if (cart.items.length === 0) throw new Error(copy.cartEmpty);

    const order: Order = {
      id: uid("order"),
      displayId: 1000 + readAllOrders().length + 1,
      createdAt: new Date().toISOString(),
      items: cart.items,
      subtotal: cart.subtotal,
      shippingTotal: cart.shippingTotal,
      discountTotal: cart.discountTotal,
      taxTotal: cart.taxTotal,
      total: cart.total,
      currency: cart.currency,
      email: cart.shippingAddress?.email ?? readJson<Customer>(CUSTOMER_KEY)?.email ?? "",
      shippingAddress: cart.shippingAddress ?? ({} as Address),
      status: "confirmed",
    };
    persistOrder(order);
    clearCartIdFromStorage();
    return settle(order);
  }

  async function getOrder(id: string): Promise<Order | null> {
    const found = orderStore.get(id) ?? readJson<Record<string, Order>>(ORDERS_KEY)?.[id] ?? null;
    return settle(found);
  }

  // ---------- Customer auth (simulated) ----------
  async function registerCustomer(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer> {
    const customer: Customer = {
      id: uid("cus"),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      favorites: [],
    };
    writeJson(CUSTOMER_KEY, customer);
    return settle(customer);
  }

  async function loginCustomer(email: string, _password: string): Promise<Customer> {
    // Demo: any credentials sign you in. An existing session for this email keeps
    // its saved name and favorites; otherwise a fresh customer is created.
    const existing = readJson<Customer>(CUSTOMER_KEY);
    const customer: Customer =
      existing && existing.email.toLowerCase() === email.toLowerCase()
        ? existing
        : { id: uid("cus"), email, favorites: [] };
    writeJson(CUSTOMER_KEY, customer);
    return settle(customer);
  }

  async function logoutCustomer(): Promise<void> {
    removeKey(CUSTOMER_KEY);
    return settle(undefined);
  }

  async function getCurrentCustomer(): Promise<Customer | null> {
    return settle(readJson<Customer>(CUSTOMER_KEY));
  }

  async function updateCustomer(input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer> {
    const current = readJson<Customer>(CUSTOMER_KEY);
    if (!current) throw new Error(copy.notSignedIn);
    const next: Customer = { ...current, ...input };
    writeJson(CUSTOMER_KEY, next);
    return settle(next);
  }

  async function saveCustomerFavorites(ids: string[]): Promise<Customer> {
    const current = readJson<Customer>(CUSTOMER_KEY);
    if (!current) throw new Error(copy.notSignedIn);
    const next: Customer = { ...current, favorites: ids };
    writeJson(CUSTOMER_KEY, next);
    return settle(next);
  }

  async function getDefaultAddress(): Promise<CustomerAddress | null> {
    return settle(readJson<CustomerAddress>(ADDRESS_KEY));
  }

  async function saveDefaultAddress(input: CustomerAddress): Promise<void> {
    writeJson(ADDRESS_KEY, input);
    return settle(undefined);
  }

  async function listCustomerOrders(): Promise<Order[]> {
    return settle(readAllOrders());
  }

  async function transferCartToCustomer(): Promise<Cart | null> {
    return settle(readCart());
  }

  // ---------- Sitemap helpers ----------
  async function getAllProductHandles(): Promise<string[]> {
    return settle(PRODUCTS.map((p) => p.handle));
  }
  async function getAllCategoryHandles(): Promise<string[]> {
    return settle(CATEGORIES.map((c) => c.handle));
  }
  async function getAllCollectionHandles(): Promise<string[]> {
    return settle(COLLECTIONS.map((c) => c.handle));
  }

  return {
    readCartIdFromStorage,
    writeCartIdToStorage,
    clearCartIdFromStorage,
    listRegions,
    getRegion,
    getRegionId,
    listCategories,
    getCategoryTree,
    getCategory,
    categoryHandleScope,
    listCollections,
    getCollection,
    listAllProducts,
    listProducts,
    getProduct,
    listProductsByIds,
    searchProducts,
    getRelatedProducts,
    getFeaturedProducts,
    getProductsByCollection,
    getNewArrivals,
    getBestSellers,
    createCart,
    getOrCreateCart,
    getCart,
    addLineItem,
    updateLineItem,
    removeLineItem,
    applyPromo,
    setShippingAddress,
    listShippingOptions,
    setShippingMethod,
    listPaymentProviders,
    completeCart,
    getOrder,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    getCurrentCustomer,
    updateCustomer,
    saveCustomerFavorites,
    getDefaultAddress,
    saveDefaultAddress,
    listCustomerOrders,
    transferCartToCustomer,
    getAllProductHandles,
    getAllCategoryHandles,
    getAllCollectionHandles,
  };
}
