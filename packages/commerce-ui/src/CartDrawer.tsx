import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@storefront/ui/sheet";
import { Button } from "@storefront/ui/button";
import { Separator } from "@storefront/ui/separator";
import { useCart } from "./CartProvider";
import { useStorefront } from "./StorefrontProvider";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

// Slide-over cart, opened by the navbar bag button and automatically after an
// add-to-cart. Built on ui/sheet (Radix Dialog) so focus trapping, Escape and
// scroll locking come for free.
export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem, isMutating, restoreDrawerFocus } =
    useCart();
  const copy = useStorefront().config.copy;
  const items = cart?.items ?? [];

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(o) => (o ? undefined : closeDrawer())}>
      <SheetContent
        side="right"
        className="flex w-full flex-col bg-background sm:max-w-md"
        // This drawer has no SheetTrigger (the navbar opens it, and so does an
        // add-to-cart), so Radix's default restore has nothing to aim at.
        onCloseAutoFocus={(event) => {
          if (restoreDrawerFocus()) event.preventDefault();
        }}
      >
        <SheetHeader className="border-b">
          <SheetTitle className="font-display text-xl font-medium">Your basket</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-xl">{copy?.cartEmptyTitle ?? "Your basket is empty"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy?.cartEmptyHint ?? "Add a few items and they'll appear here."}
            </p>
            <Button asChild className="mt-6 rounded-full" onClick={closeDrawer}>
              <Link to="/store">{copy?.cartEmptyCta ?? "Browse the store"}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto" role="list">
              {items.map((line) => (
                <li key={line.id} className="flex gap-4 px-4 py-5">
                  <Link
                    to="/products/$handle"
                    params={{ handle: line.handle }}
                    onClick={closeDrawer}
                    className="shrink-0"
                  >
                    <StoreImage
                      src={line.image}
                      size="sm"
                      alt={line.title}
                      width={80}
                      height={80}
                      loading="lazy"
                      className="surface-card h-20 w-20 rounded-xl object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/products/$handle"
                          params={{ handle: line.handle }}
                          onClick={closeDrawer}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {line.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {line.variantTitle}
                        </p>
                      </div>
                      <button
                        onClick={() => void removeItem(line.id)}
                        disabled={isMutating}
                        aria-label={`Remove ${line.title}`}
                        className="-mr-1 -mt-1 p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          className="grid h-8 w-8 place-items-center rounded-l-full transition-colors hover:bg-accent disabled:opacity-50"
                          onClick={() => void updateItem(line.id, line.quantity - 1)}
                          disabled={isMutating}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                          {line.quantity}
                        </span>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-r-full transition-colors hover:bg-accent disabled:opacity-50"
                          onClick={() => void updateItem(line.id, line.quantity + 1)}
                          disabled={isMutating}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Price amount={line.unitPrice * line.quantity} compact />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <Price amount={cart?.subtotal ?? 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Delivery calculated at checkout · free over €60.
                </p>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="w-full rounded-full" onClick={closeDrawer}>
                    <Link to="/checkout">Go to checkout</Link>
                  </Button>
                  <Button asChild variant="ghost" className="rounded-full" onClick={closeDrawer}>
                    <Link to="/cart">View basket</Link>
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
