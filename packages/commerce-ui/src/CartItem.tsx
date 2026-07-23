import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import type { CartLineItem } from "@storefront/commerce-core";
import { useCart } from "./CartProvider";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

export function CartItem({ item }: { item: CartLineItem }) {
  const { updateItem: update, removeItem: remove, isMutating } = useCart();
  return (
    <div className="grid grid-cols-[88px_1fr_auto] gap-4 border-b border-border/60 py-6 sm:grid-cols-[112px_1fr_auto]">
      <Link
        to="/products/$handle"
        params={{ handle: item.handle }}
        className="surface-card aspect-square overflow-hidden rounded-xl"
      >
        <StoreImage
          src={item.image}
          size="sm"
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to="/products/$handle"
          params={{ handle: item.handle }}
          className="truncate text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
        <div className="truncate text-xs text-muted-foreground">{item.variantTitle}</div>
        <div className="mt-auto flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-border">
            <button
              aria-label="Decrease quantity"
              onClick={() => update(item.id, item.quantity - 1)}
              disabled={isMutating}
              className="rounded-l-full p-2 hover:bg-accent disabled:opacity-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => update(item.id, item.quantity + 1)}
              disabled={isMutating}
              className="rounded-r-full p-2 hover:bg-accent disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => remove(item.id)}
            disabled={isMutating}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>
      <div className="text-right">
        <Price amount={item.unitPrice * item.quantity} compact stacked />
        {item.quantity > 1 && (
          <div className="mt-1 text-xs tabular-nums text-muted-foreground">
            <Price amount={item.unitPrice} compact /> each
          </div>
        )}
      </div>
    </div>
  );
}
