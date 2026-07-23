import { useRegion } from "./RegionProvider";
import { formatMoney } from "@storefront/commerce-core";
import { cn } from "@storefront/ui";

interface PriceProps {
  amount: number;
  compareAt?: number;
  className?: string;
  compact?: boolean;
  /** Stack the compare-at price under the price instead of beside it. */
  stacked?: boolean;
}

export function Price({ amount, compareAt, className, compact, stacked }: PriceProps) {
  const { region } = useRegion();
  const price = formatMoney(amount, region.currency, region.locale);
  const compare = compareAt ? formatMoney(compareAt, region.currency, region.locale) : null;

  return (
    <span
      className={cn(
        stacked ? "flex flex-col items-end" : "inline-flex items-baseline gap-2",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold tabular-nums",
          compareAt ? "text-sale" : "text-foreground",
          compact ? "text-sm" : "text-base",
        )}
      >
        {price}
      </span>
      {compare && (
        <span className="text-xs tabular-nums text-muted-foreground line-through">
          {compare}
        </span>
      )}
    </span>
  );
}
