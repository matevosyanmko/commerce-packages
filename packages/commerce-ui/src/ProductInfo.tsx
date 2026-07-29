import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "@gucco/commerce-core";
import { discountPercent } from "@gucco/commerce-core";
import { variantPrice } from "@gucco/commerce-core";
import { useRegion } from "./RegionProvider";
import { useCart } from "./CartProvider";
import { useStorefront } from "./StorefrontProvider";
import { FavoriteButton } from "./FavoriteButton";
import { Price } from "./Price";
import { VariantPicker } from "./VariantPicker";
import { Button } from "@gucco/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function ProductInfo({
  product,
  onVariantChange,
  highlights,
  purchaseNote,
  perks,
}: {
  product: Product;
  onVariantChange?: (variant: ProductVariant) => void;
  /** Brand slot: quick-fact chips beside the price (compose with <ProductChip>). */
  highlights?: ReactNode;
  /** Brand slot: the panel under the buy buttons (delivery promise, gift note …). */
  purchaseNote?: ReactNode;
  /** Brand slot: the perk row at the bottom (compose with <ProductPerk>). */
  perks?: ReactNode;
}) {
  const navigate = useNavigate();
  const { region } = useRegion();
  const { addItem, isMutating } = useCart();
  const copy = useStorefront().config.copy;
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const o of product.options) {
      if (o.values[0]) init[o.name] = o.values[0];
    }
    return init;
  });

  const variant: ProductVariant = useMemo(() => {
    if (product.variants.length === 1) return product.variants[0];
    return (
      product.variants.find((v) =>
        Object.entries(selected).every(([k, val]) => v.options[k] === val),
      ) ?? product.variants[0]
    );
  }, [product, selected]);

  useEffect(() => {
    onVariantChange?.(variant);
  }, [variant, onVariantChange]);

  const price = variantPrice(variant, region.id);
  const discount = discountPercent(price.amount, price.compareAt);
  const inStock = variant.stock > 0;

  const handleAdd = async () => {
    try {
      await addItem(variant.id, 1);
      toast.success(`${product.title} added to your basket`);
    } catch {
      toast.error("Couldn't add that just now. Please try again.");
    }
  };
  const handleBuyNow = async () => {
    try {
      await addItem(variant.id, 1);
      navigate({ to: "/checkout" });
    } catch {
      toast.error("Couldn't add that just now. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="eyebrow">{(product.categoryHandles[0] ?? "").replace(/-/g, " ")}</div>
        <h1 className="mt-2.5 text-[2.1rem] leading-[1.05] md:text-[2.6rem]">{product.title}</h1>
        {product.subtitle && (
          <p className="mt-2 font-display text-lg italic text-muted-foreground">
            {product.subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Price amount={price.amount} compareAt={price.compareAt} className="text-2xl" />
        {discount != null && (
          <span className="rounded-full bg-sale/12 px-2.5 py-0.5 text-xs font-semibold text-sale">
            Save {discount}%
          </span>
        )}
      </div>

      {highlights && <div className="flex flex-wrap gap-2">{highlights}</div>}

      <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

      {product.options.length > 0 && (
        <div className="flex flex-col gap-5">
          {product.options.map((opt) => (
            <VariantPicker
              key={opt.id}
              option={opt}
              value={selected[opt.name]}
              onChange={(v) => setSelected((s) => ({ ...s, [opt.name]: v }))}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs">
        <span
          className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-primary" : "bg-muted-foreground"}`}
        />
        <span className={inStock ? "text-foreground" : "text-muted-foreground"}>
          {inStock
            ? copy?.stockInNote ?? "In stock and ready to ship"
            : copy?.stockOutNote ?? "Currently out of stock"}
        </span>
      </div>

      {/* flex-1 scoped to sm+ so the mobile column doesn't collapse button heights. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="h-12 w-full rounded-full sm:w-auto sm:flex-1"
          onClick={handleAdd}
          disabled={!inStock || isMutating}
        >
          Add to basket
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-full rounded-full sm:w-auto sm:flex-1"
          onClick={handleBuyNow}
          disabled={!inStock || isMutating}
        >
          Order now
        </Button>
        <FavoriteButton
          productId={product.id}
          productTitle={product.title}
          size="lg"
          className="h-12 w-12 border border-border"
        />
      </div>

      {purchaseNote && (
        <div className="flex items-start gap-2 rounded-2xl bg-secondary/70 px-4 py-3 text-xs text-muted-foreground">
          {purchaseNote}
        </div>
      )}

      {perks && (
        <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          {perks}
        </div>
      )}
    </div>
  );
}

/** A quick-fact chip for the `highlights` slot. */
export function ProductChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

/** One entry in the `perks` slot's row. */
export function ProductPerk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
