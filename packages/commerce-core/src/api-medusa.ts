// The Medusa-backed implementation of the same `CommerceApi` contract the mock
// factory in `api.ts` produces.
//
// Two factories, one contract: a storefront picks whichever backend it runs on
// and the UI can't tell the difference. Everything store-specific — the SDK
// instance, the localStorage prefix, the product field list, curated handles and
// the brand's error copy — is INJECTED, so this file holds no brand data.
//
//   mock   -> createCommerceApi({ data, storagePrefix, … })      (api.ts)
//   Medusa -> createMedusaCommerceApi({ sdk, storagePrefix, … }) (this file)

import type Medusa from "@medusajs/js-sdk";
import type {
  Address,
  Cart,
  Category,
  Collection,
  Customer,
  CustomerAddress,
  Order,
  Paginated,
  PaymentProvider,
  Product,
  ProductFilters,
  Region,
  ShippingOption,
  SortKey,
} from "./types";
import {
  buildCategoryTree,
  flattenCategories,
  mapCart,
  mapCategory,
  mapCollection,
  mapCustomer,
  mapCustomerAddress,
  mapOrder,
  mapProduct,
  mapRegion,
  mapShippingOption,
  resolveCountryCode,
} from "./medusa-map";
import { applyFilters, filtersActive, sortProducts } from "./catalog";
import type { CommerceApi, CommerceCopy } from "./api";

/**
 * Fields the UI needs on a product (pricing, variants, options, media).
 *
 * ⚠️ `*options.values` must be requested explicitly — `*options` alone returns
 * empty `options[].values`, which silently blanks every facet derived from
 * option values.
 */
export const DEFAULT_PRODUCT_FIELDS =
  "id,handle,title,subtitle,description,material,thumbnail,created_at,*images,*tags,*categories,*options,*options.values,*variants,*variants.options,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+metadata";

const CATEGORY_FIELDS = "id,name,handle,description,parent_category_id,metadata";
const COLLECTION_FIELDS = "id,title,handle";
const CUSTOMER_FIELDS = "id,email,first_name,last_name,phone,metadata";
const ORDER_FIELDS =
  "id,display_id,email,currency_code,created_at,total,subtotal,item_subtotal,discount_total,shipping_total,shipping_subtotal,tax_total,*items,*shipping_address";
const ADDRESS_FIELDS =
  "id,default_shipping_address_id,addresses.id,addresses.first_name,addresses.last_name,addresses.phone,addresses.address_1,addresses.address_2,addresses.city,addresses.postal_code,addresses.country_code";

const AUTH_ACTOR = "customer";
const AUTH_METHOD = "emailpass";

const DEFAULT_COPY: CommerceCopy = {
  variantUnavailable: "That item is no longer available.",
  cartExpired: "Your cart has expired.",
  cartNotFound: "We couldn't find your cart. Please try again.",
  cartEmpty: "Your cart is empty.",
  invalidPromo: "That code isn't valid for the items in your cart.",
  notSignedIn: "You're not signed in.",
};

export interface MedusaCommerceConfig {
  /** The shared SDK instance (SSR + client) — see each store's `sdk.ts`. */
  sdk: Medusa;
  /** localStorage key prefix, brand-scoped so two stores on one origin don't collide. */
  storagePrefix: string;
  /** Override when a store needs extra product fields. */
  productFields?: string;
  /** Curated handles for the featured / new-arrival rows. Falls back to recency. */
  featuredHandles?: string[];
  newArrivalHandles?: string[];
  copy?: Partial<CommerceCopy>;
}

export function createMedusaCommerceApi(config: MedusaCommerceConfig) {
  const { sdk } = config;
  const PRODUCT_FIELDS = config.productFields ?? DEFAULT_PRODUCT_FIELDS;
  const copy = { ...DEFAULT_COPY, ...config.copy };

  const CART_ID_KEY = `${config.storagePrefix}cartId`;

  // ---------- Cart id persistence ----------
  function readCartIdFromStorage(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CART_ID_KEY);
  }
  function writeCartIdToStorage(id: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_ID_KEY, id);
  }
  function clearCartIdFromStorage() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CART_ID_KEY);
  }

  // ---------- Regions ----------
  let regionsCache: Region[] | null = null;

  async function getRegions(): Promise<Region[]> {
    if (!regionsCache) {
      const { regions } = await sdk.store.region.list({
        fields: "id,name,currency_code,*countries",
      });
      regionsCache = regions.map(mapRegion);
    }
    return regionsCache;
  }

  // Server-side loaders may pass an empty/unknown region id; resolve to a real one.
  async function resolveRegionId(regionId?: string): Promise<string> {
    if (regionId) return regionId;
    const regions = await getRegions();
    return regions[0]?.id ?? "";
  }

  async function listRegions(): Promise<Region[]> {
    return getRegions();
  }

  async function getRegion(id?: string): Promise<Region> {
    const regions = await getRegions();
    const found = id ? regions.find((r) => r.id === id) : undefined;
    if (found) return found;
    if (!id) return regions[0];
    const { region } = await sdk.store.region.retrieve(id, {
      fields: "id,name,currency_code,*countries",
    });
    return mapRegion(region);
  }

  async function getRegionId(regionId?: string): Promise<string> {
    return resolveRegionId(regionId);
  }

  // ---------- Categories ----------
  async function listCategoriesFlat(): Promise<Category[]> {
    const { product_categories } = await sdk.store.category.list({
      fields: CATEGORY_FIELDS,
      limit: 1000,
    });
    return product_categories.map(mapCategory);
  }

  async function listCategories(): Promise<Category[]> {
    return listCategoriesFlat();
  }

  /**
   * Root categories with their children nested.
   *
   * ⚠️ `parent_category_id: "null"` is required — without it
   * `include_descendants_tree` also returns every descendant at the top level
   * and the megamenu renders each child twice.
   */
  async function getCategoryTree(): Promise<Category[]> {
    return buildCategoryTree(await listCategoriesFlat());
  }

  async function getCategory(handle: string): Promise<Category | null> {
    const { product_categories } = await sdk.store.category.list({
      handle,
      fields: CATEGORY_FIELDS,
      limit: 1,
    });
    return product_categories[0] ? mapCategory(product_categories[0]) : null;
  }

  function categoryHandleScope(category: Category): string[] {
    return flattenCategories([category]).map((c) => c.handle);
  }

  async function categoryIdsForHandles(handles: string[]): Promise<string[]> {
    if (!handles.length) return [];
    const { product_categories } = await sdk.store.category.list({
      handle: handles,
      fields: "id,handle",
      limit: 1000,
    });
    return product_categories.map((c) => c.id);
  }

  // ---------- Collections ----------
  async function listCollections(): Promise<Collection[]> {
    const { collections } = await sdk.store.collection.list({
      fields: COLLECTION_FIELDS,
      limit: 100,
    });
    return collections.map(mapCollection);
  }

  async function getCollection(handle: string): Promise<Collection | null> {
    const { collections } = await sdk.store.collection.list({
      handle,
      fields: COLLECTION_FIELDS,
      limit: 1,
    });
    return collections[0] ? mapCollection(collections[0]) : null;
  }

  // ---------- Products ----------
  /**
   * Every product (mapped) for a region, optionally scoped to a category or
   * collection. Price sorting and facet derivation both need the whole set,
   * because the store API can't order by or filter on a calculated price.
   *
   * Scope it whenever you can: a category page that pushes `category_id` to the
   * backend fetches only its own products instead of the entire catalog.
   */
  async function fetchAllProducts(
    regionId: string,
    categoryId?: string,
    collectionId?: string,
  ): Promise<Product[]> {
    const out: Product[] = [];
    const limit = 100;
    let offset = 0;
    for (;;) {
      const { products, count } = await sdk.store.product.list({
        region_id: regionId,
        fields: PRODUCT_FIELDS,
        limit,
        offset,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(collectionId ? { collection_id: collectionId } : {}),
      });
      out.push(...products.map((p) => mapProduct(p, regionId)));
      offset += limit;
      if (offset >= count || products.length === 0) break;
    }
    return out;
  }

  async function listAllProducts(regionId: string): Promise<Product[]> {
    return fetchAllProducts(await resolveRegionId(regionId));
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

    let categoryId = opts.categoryId ?? opts.filters?.categoryIds?.[0];
    if (!categoryId && opts.categoryHandles?.length) {
      categoryId = (await categoryIdsForHandles(opts.categoryHandles))[0];
    }

    let collectionId = opts.collectionId;
    if (!collectionId && opts.collectionHandle) {
      collectionId = (await getCollection(opts.collectionHandle))?.id;
    }

    // In-memory only when the backend can't do the job: calculated-price sorting
    // and option/price/tag filtering. Otherwise let Medusa paginate.
    const isPriceSort = sort === "price-asc" || sort === "price-desc";
    if (isPriceSort || filtersActive(opts.filters)) {
      const all = await fetchAllProducts(regionId, categoryId, collectionId);
      const filtered = opts.filters ? applyFilters(all, opts.filters, regionId) : all;
      const ordered = sortProducts(filtered, sort, regionId);
      const start = (page - 1) * pageSize;
      return { items: ordered.slice(start, start + pageSize), total: ordered.length, page, pageSize };
    }

    const order = sort === "newest" ? "-created_at" : undefined;
    const { products, count } = await sdk.store.product.list({
      region_id: regionId,
      fields: PRODUCT_FIELDS,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(collectionId ? { collection_id: collectionId } : {}),
      ...(order ? { order } : {}),
    });

    return { items: products.map((p) => mapProduct(p, regionId)), total: count, page, pageSize };
  }

  async function getProduct(handle: string, regionId: string): Promise<Product | null> {
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      handle,
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit: 1,
    });
    return products[0] ? mapProduct(products[0], rid) : null;
  }

  /**
   * Resolve ids into products, **preserving the caller's order**. Medusa's list
   * endpoint ignores the order of an `id` filter, so an admin's hand-picked row
   * renders shuffled without the re-sort.
   */
  async function listProductsByIds(ids: string[], regionId: string): Promise<Product[]> {
    if (ids.length === 0) return [];
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      id: ids,
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit: ids.length,
    });
    const byId = new Map(products.map((p) => [p.id, mapProduct(p, rid)]));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }

  async function listProductsByHandles(handles: string[], regionId: string): Promise<Product[]> {
    if (!handles.length) return [];
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      handle: handles,
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit: handles.length,
    });
    const byHandle = new Map(products.map((p) => [p.handle, mapProduct(p, rid)]));
    return handles.map((h) => byHandle.get(h)).filter((p): p is Product => Boolean(p));
  }

  async function searchProducts(query: string, regionId: string): Promise<Product[]> {
    const q = query.trim();
    if (!q) return [];
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      q,
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit: 50,
    });
    return products.map((p) => mapProduct(p, rid));
  }

  async function getRelatedProducts(handle: string, regionId: string, limit = 4): Promise<Product[]> {
    const rid = await resolveRegionId(regionId);
    const product = await getProduct(handle, rid);
    if (!product) return [];
    const categoryId = product.categoryIds[0];
    const { products } = await sdk.store.product.list({
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit: limit + 1, // the product itself may come back in its own category
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    return products
      .map((p) => mapProduct(p, rid))
      .filter((p) => p.id !== product.id)
      .slice(0, limit);
  }

  async function listRecent(regionId: string, limit: number): Promise<Product[]> {
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit,
      order: "-created_at",
    });
    return products.map((p) => mapProduct(p, rid));
  }

  // No sales or rating signal exists on the store API, so "featured" and "best
  // sellers" are whatever the store curated by handle, falling back to recency.
  async function getFeaturedProducts(regionId: string, limit = 4): Promise<Product[]> {
    const curated = config.featuredHandles ?? [];
    if (curated.length) return (await listProductsByHandles(curated, regionId)).slice(0, limit);
    return listRecent(regionId, limit);
  }

  async function getBestSellers(regionId: string, limit = 8): Promise<Product[]> {
    return getFeaturedProducts(regionId, limit);
  }

  async function getNewArrivals(regionId: string, limit = 8): Promise<Product[]> {
    const curated = config.newArrivalHandles ?? [];
    if (curated.length) return (await listProductsByHandles(curated, regionId)).slice(0, limit);
    return listRecent(regionId, limit);
  }

  async function getProductsByCollection(
    collectionHandle: string,
    regionId: string,
    limit = 8,
  ): Promise<Product[]> {
    const collection = await getCollection(collectionHandle);
    if (!collection) return [];
    const rid = await resolveRegionId(regionId);
    const { products } = await sdk.store.product.list({
      region_id: rid,
      fields: PRODUCT_FIELDS,
      limit,
      collection_id: collection.id,
    });
    return products.map((p) => mapProduct(p, rid));
  }

  // ---------- Cart ----------
  async function createCart(regionId: string): Promise<Cart> {
    const rid = await resolveRegionId(regionId);
    const { cart } = await sdk.store.cart.create({ region_id: rid });
    writeCartIdToStorage(cart.id);
    return mapCart(cart);
  }

  async function getOrCreateCart(regionId: string): Promise<Cart> {
    const rid = await resolveRegionId(regionId);
    const existingId = readCartIdFromStorage();
    if (existingId) {
      try {
        const { cart } = await sdk.store.cart.retrieve(existingId);
        if (cart && !cart.completed_at) {
          if (cart.region_id !== rid) {
            const updated = await sdk.store.cart.update(existingId, { region_id: rid });
            return mapCart(updated.cart);
          }
          return mapCart(cart);
        }
      } catch {
        // Stored cart is gone/invalid — fall through and create a fresh one.
      }
    }
    return createCart(rid);
  }

  async function getCart(id: string): Promise<Cart | null> {
    try {
      const { cart } = await sdk.store.cart.retrieve(id);
      return cart ? mapCart(cart) : null;
    } catch {
      return null;
    }
  }

  async function addLineItem(cartId: string, variantId: string, qty = 1): Promise<Cart> {
    const { cart } = await sdk.store.cart.createLineItem(cartId, {
      variant_id: variantId,
      quantity: qty,
    });
    return mapCart(cart);
  }

  async function updateLineItem(cartId: string, itemId: string, qty: number): Promise<Cart> {
    if (qty <= 0) return removeLineItem(cartId, itemId);
    const { cart } = await sdk.store.cart.updateLineItem(cartId, itemId, { quantity: qty });
    return mapCart(cart);
  }

  async function removeLineItem(cartId: string, itemId: string): Promise<Cart> {
    const res = await sdk.store.cart.deleteLineItem(cartId, itemId);
    const parent = (res as { parent?: Parameters<typeof mapCart>[0] }).parent;
    if (parent) return mapCart(parent);
    const cart = await getCart(cartId);
    if (!cart) throw new Error(copy.cartExpired);
    return cart;
  }

  async function applyPromo(cartId: string, code: string): Promise<Cart> {
    const trimmed = code.trim();
    const { cart } = await sdk.store.cart.update(cartId, { promo_codes: [trimmed] });
    const applied = cart.promotions?.some((p) => p.code?.toLowerCase() === trimmed.toLowerCase());
    // Medusa silently drops a code it won't honour, and the response doesn't say
    // why. A real code can be dropped simply because nothing in the basket is
    // eligible for it — a product flagged `discountable: false`, or a
    // collection-scoped promotion — so this can't claim the code doesn't exist.
    if (!applied) throw new Error(copy.invalidPromo);
    return mapCart(cart);
  }

  // ---------- Checkout ----------
  async function setShippingAddress(cartId: string, address: Address): Promise<Cart> {
    const { cart: current } = await sdk.store.cart.retrieve(cartId, { fields: "id,region_id" });
    const regions = await getRegions();
    const region = regions.find((r) => r.id === current.region_id);
    const countryCode = resolveCountryCode(address.country, region);

    const medusaAddress = {
      first_name: address.firstName,
      last_name: address.lastName,
      phone: address.phone,
      address_1: address.line1,
      address_2: address.line2,
      city: address.city,
      postal_code: address.postalCode,
      country_code: countryCode,
    };

    const { cart } = await sdk.store.cart.update(cartId, {
      email: address.email,
      shipping_address: medusaAddress,
      billing_address: medusaAddress,
    });
    return mapCart(cart);
  }

  async function listShippingOptions(cartId: string): Promise<ShippingOption[]> {
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
    return shipping_options.map(mapShippingOption);
  }

  async function setShippingMethod(cartId: string, optionId: string): Promise<Cart> {
    const { cart } = await sdk.store.cart.addShippingMethod(cartId, { option_id: optionId });
    return mapCart(cart);
  }

  function prettyProviderName(id: string): string {
    if (id === "pp_system_default") return "Manual payment (test)";
    const stripped = id.replace(/^pp_/, "").replace(/_/g, " ");
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  async function listPaymentProviders(cartId: string): Promise<PaymentProvider[]> {
    const { cart } = await sdk.store.cart.retrieve(cartId, { fields: "id,region_id" });
    const { payment_providers } = await sdk.store.payment.listPaymentProviders({
      region_id: cart.region_id!,
    });
    // The store endpoint only returns providers enabled for the region.
    return payment_providers.map((p) => ({ id: p.id, name: prettyProviderName(p.id) }));
  }

  async function completeCart(cartId: string, paymentProviderId?: string): Promise<Order> {
    const { cart } = await sdk.store.cart.retrieve(cartId);

    let providerId = paymentProviderId;
    if (!providerId) {
      const { payment_providers } = await sdk.store.payment.listPaymentProviders({
        region_id: cart.region_id!,
      });
      providerId = payment_providers[0]?.id;
    }
    if (!providerId) throw new Error("No payment method is available for this region.");

    await sdk.store.payment.initiatePaymentSession(cart, { provider_id: providerId });

    const result = await sdk.store.cart.complete(cartId);
    if (result.type === "order") {
      clearCartIdFromStorage();
      return mapOrder(result.order);
    }
    throw new Error(result.error?.message ?? copy.cartNotFound);
  }

  async function getOrder(id: string): Promise<Order | null> {
    try {
      const { order } = await sdk.store.order.retrieve(id, { fields: ORDER_FIELDS });
      return order ? mapOrder(order) : null;
    } catch {
      return null;
    }
  }

  // ---------- Customer auth ----------
  // Medusa's emailpass provider. The SDK stores the returned JWT and attaches it
  // to every subsequent request, so the "session" is the presence of that token.
  async function registerCustomer(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer> {
    // 1. Obtain a registration token (stored + used for the create call below).
    await sdk.auth.register(AUTH_ACTOR, AUTH_METHOD, {
      email: input.email,
      password: input.password,
    });
    // 2. Create the customer record tied to that identity.
    const { customer } = await sdk.store.customer.create({
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    });
    // 3. Swap the registration token for a full auth token.
    await loginCustomer(input.email, input.password);
    return mapCustomer(customer);
  }

  async function loginCustomer(email: string, password: string): Promise<Customer> {
    const result = await sdk.auth.login(AUTH_ACTOR, AUTH_METHOD, { email, password });
    // emailpass returns a token string. Anything else (third-party redirect, MFA)
    // isn't wired up in these storefronts.
    if (typeof result !== "string") {
      throw new Error("This account requires a sign-in method that isn't supported here.");
    }
    const { customer } = await sdk.store.customer.retrieve({ fields: CUSTOMER_FIELDS });
    return mapCustomer(customer);
  }

  async function logoutCustomer(): Promise<void> {
    await sdk.auth.logout();
  }

  /** The signed-in customer, or null when there's no valid token. Never throws
   *  for the unauthenticated case — callers treat null as "guest". */
  async function getCurrentCustomer(): Promise<Customer | null> {
    try {
      const { customer } = await sdk.store.customer.retrieve({ fields: CUSTOMER_FIELDS });
      return customer ? mapCustomer(customer) : null;
    } catch {
      return null;
    }
  }

  async function updateCustomer(input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer> {
    const { customer } = await sdk.store.customer.update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    });
    return mapCustomer(customer);
  }

  /**
   * Saved product ids live in `customer.metadata` — Medusa ships no wishlist
   * module. If a wishlist plugin is ever installed, this is the single seam to
   * move.
   */
  async function saveCustomerFavorites(ids: string[]): Promise<Customer> {
    const { customer } = await sdk.store.customer.update({ metadata: { favorites: ids } });
    return mapCustomer(customer);
  }

  type StoreAddress = NonNullable<
    Awaited<ReturnType<typeof sdk.store.customer.retrieve>>["customer"]["addresses"]
  >[number];

  // Prefer the customer's default shipping address; fall back to their first.
  function pickDefaultAddress(customer: {
    default_shipping_address_id?: string | null;
    addresses?: StoreAddress[];
  }): StoreAddress | null {
    const addresses = customer.addresses ?? [];
    if (!addresses.length) return null;
    return addresses.find((a) => a.id === customer.default_shipping_address_id) ?? addresses[0];
  }

  async function getDefaultAddress(): Promise<CustomerAddress | null> {
    try {
      const { customer } = await sdk.store.customer.retrieve({ fields: ADDRESS_FIELDS });
      const addr = pickDefaultAddress(customer);
      return addr ? mapCustomerAddress(addr) : null;
    } catch {
      return null;
    }
  }

  /** `country` is an ISO-2 code (from the region-scoped country select). */
  async function saveDefaultAddress(input: CustomerAddress): Promise<void> {
    const { customer } = await sdk.store.customer.retrieve({ fields: ADDRESS_FIELDS });
    const existing = pickDefaultAddress(customer);
    const body = {
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      address_1: input.line1,
      address_2: input.line2,
      city: input.city,
      postal_code: input.postalCode,
      ...(input.country ? { country_code: input.country.toLowerCase() } : {}),
    };
    if (existing) {
      await sdk.store.customer.updateAddress(existing.id, body);
    } else {
      await sdk.store.customer.createAddress({ ...body, is_default_shipping: true });
    }
  }

  async function listCustomerOrders(): Promise<Order[]> {
    const { orders } = await sdk.store.order.list({
      fields: ORDER_FIELDS,
      limit: 50,
      order: "-created_at",
    });
    return orders.map(mapOrder);
  }

  /** Associate the anonymous cart with the signed-in customer, so the resulting
   *  order shows up in their account. No-op when there's no stored cart. */
  async function transferCartToCustomer(): Promise<Cart | null> {
    const cartId = readCartIdFromStorage();
    if (!cartId) return null;
    try {
      const { cart } = await sdk.store.cart.transferCart(cartId);
      return mapCart(cart);
    } catch {
      // The cart may have already been claimed or completed — not fatal.
      return null;
    }
  }

  // ---------- Sitemap helpers ----------
  async function getAllProductHandles(): Promise<string[]> {
    const handles: string[] = [];
    const limit = 200;
    let offset = 0;
    for (;;) {
      const { products, count } = await sdk.store.product.list({ fields: "handle", limit, offset });
      handles.push(...products.map((p) => p.handle).filter(Boolean));
      offset += limit;
      if (offset >= count || products.length === 0) break;
    }
    return handles;
  }

  async function getAllCategoryHandles(): Promise<string[]> {
    const { product_categories } = await sdk.store.category.list({ fields: "handle", limit: 1000 });
    return product_categories.map((c) => c.handle).filter(Boolean);
  }

  async function getAllCollectionHandles(): Promise<string[]> {
    const { collections } = await sdk.store.collection.list({ fields: "handle", limit: 100 });
    return collections.map((c) => c.handle).filter(Boolean);
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

/**
 * Compile-time proof that the Medusa factory satisfies the same contract as the
 * mock one. If a method is added to `createCommerceApi` and not here (or a
 * signature drifts), this fails the build rather than a storefront at runtime.
 */
type _AssertSatisfiesContract = ReturnType<typeof createMedusaCommerceApi> extends CommerceApi
  ? true
  : { error: "createMedusaCommerceApi no longer satisfies CommerceApi" };
const _contractOk: _AssertSatisfiesContract = true;
void _contractOk;
