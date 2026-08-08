import { useId } from "react";
import type { ProductOption } from "@wm-storefront/commerce-core";
import { RadioGroup, RadioGroupPill } from "@wm-storefront/ui/radio-group";

export interface VariantPickerProps {
  option: ProductOption;
  value: string;
  onChange: (value: string) => void;
}

/**
 * One option group on the PDP — Storage, Colour, Size.
 *
 * A Radix RadioGroup rather than a row of toggle buttons: the values are
 * mutually exclusive, so `aria-checked` and arrow-key selection are what the
 * control actually means. As `aria-pressed` toggles it announced "128 GB,
 * pressed / 256 GB, not pressed" instead of "Storage, 128 GB, 1 of 3".
 */
export function VariantPicker({ option, value, onChange }: VariantPickerProps) {
  const labelId = useId();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span id={labelId} className="text-xs uppercase tracking-widest text-muted-foreground">
          {option.name}
        </span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onValueChange={onChange}
        className="flex flex-row flex-wrap gap-2"
      >
        {option.values.map((v) => (
          <RadioGroupPill key={v} value={v}>
            {v}
          </RadioGroupPill>
        ))}
      </RadioGroup>
    </div>
  );
}
