// Cart context. The cart id is persisted in localStorage (via the api's
// brand-scoped storage prefix); all totals come from the backend. Drawer open
// state lives here too so the navbar and the drawer stay in sync. Auth wraps
// this provider so login can claim the guest cart.
//
// The cart is created LAZILY, on the first add — not on mount. Creating one for
// every visitor (and every crawler) fills the backend with empty carts.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { track, type Cart } from "@gucco/commerce-core";
import { useStorefront } from "./StorefrontProvider";
import { useRegion } from "./RegionProvider";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  isDrawerOpen: boolean;
  isMutating: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (variantId: string, qty?: number) => Promise<void>;
  updateItem: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyPromo: (code: string) => Promise<void>;
  /** Cart id, creating the cart if this is the first thing added. */
  ensureCartId: () => Promise<string>;
  refresh: () => Promise<void>;
  clearLocalCart: () => void;
  /**
   * Hand focus back to whatever opened the drawer. Returns false if there is
   * nothing to restore to, so the caller can leave Radix's default in place.
   */
  restoreDrawerFocus: () => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { api } = useStorefront();
  const { region } = useRegion();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  // Guards against two concurrent cart creations (e.g. rapid add clicks).
  const creating = useRef<Promise<string> | null>(null);

  // Radix restores focus to a Dialog's *trigger* on close, and this drawer has
  // none — it opens from the navbar bag button and, after an add-to-cart, from
  // nothing at all. Without this, closing it drops focus on <body> and a
  // keyboard shopper restarts from the top of the document.
  //
  // Captured before the mutation starts, not after: `isMutating` disables the
  // Add to Cart button mid-flight, and the browser blurs a disabled element.
  const returnFocus = useRef<HTMLElement | null>(null);
  const rememberFocus = useCallback(() => {
    returnFocus.current =
      typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null);
  }, []);

  // Hydrate an existing cart on mount. No cart id = nothing to do; we do NOT
  // create one here.
  useEffect(() => {
    const id = api.readCartIdFromStorage();
    if (!id) return;
    void api
      .getCart(id)
      .then((c) => {
        if (c) setCart(c);
        else {
          // Stale/expired cart id — drop it and start fresh on next add.
          api.clearCartIdFromStorage();
          setCart(null);
        }
      })
      .catch(() => {
        api.clearCartIdFromStorage();
        setCart(null);
      });
  }, [api]);

  const ensureCartId = useCallback(async (): Promise<string> => {
    const existing = api.readCartIdFromStorage();
    if (existing) return existing;
    if (creating.current) return creating.current;

    creating.current = (async () => {
      const created = await api.createCart(region.id);
      setCart(created);
      return created.id;
    })();

    try {
      return await creating.current;
    } finally {
      creating.current = null;
    }
  }, [api, region.id]);

  const refresh = useCallback(async () => {
    const id = api.readCartIdFromStorage();
    if (!id) {
      setCart(null);
      return;
    }
    setCart(await api.getCart(id));
  }, [api]);

  const addItem = useCallback(
    async (variantId: string, qty = 1) => {
      rememberFocus();
      setIsMutating(true);
      try {
        const cartId = await ensureCartId();
        const next = await api.addLineItem(cartId, variantId, qty);
        setCart(next);
        setDrawerOpen(true);
        const line = next.items.find((i) => i.variantId === variantId);
        if (line) {
          track("add_to_cart", {
            currency: next.currency,
            value: line.unitPrice * qty,
            items: [
              {
                item_id: line.variantId,
                item_name: line.title,
                price: line.unitPrice,
                quantity: qty,
              },
            ],
          });
        }
      } finally {
        setIsMutating(false);
      }
    },
    [api, ensureCartId, rememberFocus],
  );

  const updateItem = useCallback(
    async (itemId: string, qty: number) => {
      const cartId = api.readCartIdFromStorage();
      if (!cartId || !cart) return;
      const prev = cart;
      // Optimistic update — the server's totals replace this on response.
      const optimistic: Cart = {
        ...cart,
        items: cart.items
          .map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
          .filter((i) => i.quantity > 0),
      };
      optimistic.subtotal = optimistic.items.reduce(
        (s, i) => s + i.unitPrice * i.quantity,
        0,
      );
      optimistic.itemCount = optimistic.items.reduce((s, i) => s + i.quantity, 0);
      setCart(optimistic);
      setIsMutating(true);
      try {
        setCart(await api.updateLineItem(cartId, itemId, qty));
      } catch (err) {
        setCart(prev);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [api, cart],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const cartId = api.readCartIdFromStorage();
      if (!cartId || !cart) return;
      const prev = cart;
      const line = cart.items.find((i) => i.id === itemId);
      setCart({ ...cart, items: cart.items.filter((i) => i.id !== itemId) });
      setIsMutating(true);
      try {
        setCart(await api.removeLineItem(cartId, itemId));
        if (line) {
          track("remove_from_cart", {
            items: [{ item_id: line.variantId, quantity: line.quantity }],
          });
        }
      } catch (err) {
        setCart(prev);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [api, cart],
  );

  const applyPromo = useCallback(
    async (code: string) => {
      const cartId = api.readCartIdFromStorage();
      if (!cartId) return;
      setCart(await api.applyPromo(cartId, code));
    },
    [api],
  );

  const clearLocalCart = useCallback(() => {
    api.clearCartIdFromStorage();
    setCart(null);
    setDrawerOpen(false);
  }, [api]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      isDrawerOpen,
      isMutating,
      openDrawer: () => {
        rememberFocus();
        setDrawerOpen(true);
      },
      closeDrawer: () => setDrawerOpen(false),
      toggleDrawer: () =>
        setDrawerOpen((o) => {
          if (!o) rememberFocus();
          return !o;
        }),
      restoreDrawerFocus: () => {
        const el = returnFocus.current;
        if (!el?.isConnected) return false;
        el.focus();
        return true;
      },
      addItem,
      updateItem,
      removeItem,
      applyPromo,
      ensureCartId,
      refresh,
      clearLocalCart,
    }),
    [
      cart,
      isDrawerOpen,
      isMutating,
      rememberFocus,
      addItem,
      updateItem,
      removeItem,
      applyPromo,
      ensureCartId,
      refresh,
      clearLocalCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
