import { useState } from "react";
import { toast } from "sonner";
import type { Cart } from "@wm-storefront/commerce-core";
import { useCart } from "./CartProvider";
import { useRegion } from "./RegionProvider";
import { formatMoney } from "@wm-storefront/commerce-core";
import { Button } from "@wm-storefront/ui/button";
import { Input } from "@wm-storefront/ui/input";

export function CartSummary({ cart, action }: { cart: Cart; action?: React.ReactNode }) {
  const { region } = useRegion();
  const money = (amount: number) => formatMoney(amount, cart.currency, region.locale);

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Subtotal" value={money(cart.subtotal)} />
        {cart.discountTotal > 0 && (
          <Row
            label={cart.promoCode ? `Discount (${cart.promoCode})` : "Discount"}
            value={`−${money(cart.discountTotal)}`}
          />
        )}
        <Row
          label="Shipping"
          value={
            cart.subtotal === 0 ? "—" : cart.shippingTotal === 0 ? "Free" : money(cart.shippingTotal)
          }
        />
        <Row label="Estimated tax" value={money(cart.taxTotal)} />
      </dl>
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-5">
        <span className="text-sm font-medium">Total</span>
        <span className="text-xl font-semibold tabular-nums">{money(cart.total)}</span>
      </div>
      <PromoForm />
      {action && <div className="mt-6">{action}</div>}
      <p className="mt-4 text-xs text-muted-foreground">
        Free local delivery over €60 · delivery calculated at checkout. Try code{" "}
        <span className="font-semibold text-foreground">BLOOM10</span>.
      </p>
    </div>
  );
}

function PromoForm() {
  const { applyPromo } = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await applyPromo(trimmed);
      toast.success("Promo applied");
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Promo code"
        aria-label="Promo code"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="h-11 rounded-full"
      />
      <Button
        type="submit"
        variant="outline"
        className="h-11 shrink-0 rounded-full px-5"
        disabled={busy || !code.trim()}
      >
        {busy ? "Applying…" : "Apply"}
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
