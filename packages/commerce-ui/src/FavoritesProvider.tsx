// Saved products ("favorites").
//
// Medusa ships no wishlist module, so when a backend has no wishlist plugin
// there is no endpoint to call. Rather than drop the feature or settle for a
// list that evaporates when the shopper changes device, favorites are stored
// where the store API *does* accept arbitrary customer data: `customer.metadata`.
//
//   signed in -> customer.metadata.favorites, so the list follows the account
//                across devices and survives a cleared cache
//   guest     -> localStorage under `{storagePrefix}favorites`, merged into the
//                account on the next sign-in, the same way the guest cart is claimed
//
// Every toggle is optimistic: the heart flips immediately and rolls back if the
// write fails, because a save that feels slow reads as broken.

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
import { useStorefront } from "./StorefrontProvider";
import { useAuth } from "./AuthProvider";

function readLocal(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Private mode / quota — the in-memory list still works for this session.
  }
}

interface FavoritesContextValue {
  ids: string[];
  count: number;
  isFavorite: (productId: string) => boolean;
  /** Returns the state it moved to, so callers can word their own feedback. */
  toggle: (productId: string) => Promise<boolean>;
  remove: (productId: string) => Promise<void>;
  /** True while a write is in flight; drives the button's busy state. */
  isSaving: boolean;
  /** Whether this list is persisted to the account or only to this browser. */
  isPersisted: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { api, config } = useStorefront();
  const storageKey = `${config.storagePrefix}favorites`;
  const { customer, status } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Guards the one-time guest→account merge from re-running on every render.
  const mergedFor = useRef<string | null>(null);

  // Guests read from this browser. Deferred to an effect rather than a lazy
  // useState initialiser because localStorage doesn't exist during SSR and the
  // server/client markup has to agree on the first paint.
  useEffect(() => {
    if (status !== "guest") return;
    mergedFor.current = null;
    setIds(readLocal(storageKey));
  }, [status, storageKey]);

  // On sign-in, fold anything saved as a guest into the account list. Union, not
  // replace: a shopper who saved three things before logging in should still
  // have them, alongside whatever the account already held.
  useEffect(() => {
    if (status !== "authenticated" || !customer) return;
    if (mergedFor.current === customer.id) return;
    mergedFor.current = customer.id;

    const local = readLocal(storageKey);
    const merged = Array.from(new Set([...customer.favorites, ...local]));
    setIds(merged);

    if (local.length && merged.length !== customer.favorites.length) {
      void api
        .saveCustomerFavorites(merged)
        .then(() => writeLocal(storageKey, []))
        .catch(() => {
          // Keep the guest copy so the next sign-in can try the merge again.
        });
    } else {
      writeLocal(storageKey, []);
    }
  }, [status, customer, api, storageKey]);

  const persist = useCallback(
    async (next: string[], previous: string[]) => {
      if (status !== "authenticated") {
        writeLocal(storageKey, next);
        return;
      }
      setIsSaving(true);
      try {
        await api.saveCustomerFavorites(next);
      } catch (err) {
        setIds(previous); // roll the optimistic update back
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [status, api, storageKey],
  );

  const toggle = useCallback(
    async (productId: string) => {
      const previous = ids;
      const isOn = previous.includes(productId);
      const next = isOn ? previous.filter((id) => id !== productId) : [...previous, productId];
      setIds(next);
      await persist(next, previous);
      return !isOn;
    },
    [ids, persist],
  );

  const remove = useCallback(
    async (productId: string) => {
      const previous = ids;
      const next = previous.filter((id) => id !== productId);
      setIds(next);
      await persist(next, previous);
    },
    [ids, persist],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      isFavorite: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      isSaving,
      isPersisted: status === "authenticated",
    }),
    [ids, toggle, remove, isSaving, status],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
