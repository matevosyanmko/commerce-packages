// Auth context — the store's customer. Mounted ABOVE CartProvider so that on
// login/register we can claim the guest cart (transferCartToCustomer) by its
// persisted id before the customer keeps shopping.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Customer } from "@storefront/commerce-core";
import { useStorefront } from "./StorefrontProvider";

type AuthStatus = "loading" | "authenticated" | "guest";

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthContextValue {
  customer: Customer | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { api } = useStorefront();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    const c = await api.getCurrentCustomer();
    setCustomer(c);
    setStatus(c ? "authenticated" : "guest");
  }, [api]);

  // Resolve the session on mount. The token (if any) lives in localStorage, so
  // this only ever finds a customer on the client.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      customer,
      status,
      isAuthenticated: status === "authenticated",
      login: async (email, password) => {
        const c = await api.loginCustomer(email, password);
        // Claim the guest cart so any resulting order lands in this account.
        await api.transferCartToCustomer();
        setCustomer(c);
        setStatus("authenticated");
      },
      register: async (input) => {
        const c = await api.registerCustomer(input);
        await api.transferCartToCustomer();
        setCustomer(c);
        setStatus("authenticated");
      },
      logout: async () => {
        await api.logoutCustomer();
        // Drop the customer-owned cart id so a fresh guest cart starts.
        api.clearCartIdFromStorage();
        setCustomer(null);
        setStatus("guest");
      },
      updateProfile: async (input) => {
        const c = await api.updateCustomer(input);
        setCustomer(c);
      },
      refresh,
    }),
    [customer, status, refresh, api],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
