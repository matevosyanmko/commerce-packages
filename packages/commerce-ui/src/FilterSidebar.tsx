import { useEffect, useId, useState } from "react";
import type { Facet, Facets } from "@storefront/commerce-core";
import { activeFilterCount, toggleInList, type FilterValue } from "@storefront/commerce-core";
import { useRegion } from "./RegionProvider";
import { Checkbox } from "@storefront/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@storefront/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@storefront/ui/radio-group";
import { Slider } from "@storefront/ui/slider";
import { formatMoney } from "@storefront/commerce-core";
import { cn } from "@storefront/ui";
import { Check } from "lucide-react";
import { useStorefront, type ColourSwatch } from "./StorefrontProvider";

/**
 * Filter row label.
 *
 * `button` is a labelable element, so `htmlFor` really does make the whole
 * label activate the Radix control — which means the label *is* the tap target,
 * not the 16px box beside it. At a bare line-height that target was 20px tall,
 * under the 24px WCAG 2.2 minimum, so it gets vertical padding pulled back out
 * again with negative margin: bigger to hit, identical to look at.
 */
const ROW_LABEL = "cursor-pointer py-1 -my-1";

/**
 * Filter sidebar, derived entirely from the products on the page.
 *
 * Nothing here is hardcoded: the option groups, their values and every count
 * come from `getFacets`, so a Laptops page offers Storage and Screen size while
 * an Audio page offers Colour and Connectivity — and neither ever shows a
 * filter that would return nothing.
 *
 * State is the `FilterValue` from `lib/commerce/filters.ts`, which the routes
 * mirror 1:1 into their search params.
 *
 * Every control is a Radix primitive. The single-select groups in particular
 * used to be plain `<button>`s that showed their selection through font weight
 * alone — visible only if you could see it, and invisible to a screen reader.
 */
export function FilterSidebar({
  facets,
  value,
  onChange,
  onClear,
}: {
  facets: Facets;
  value: FilterValue;
  onChange: (patch: Partial<FilterValue>) => void;
  onClear: () => void;
}) {
  const activeCount = activeFilterCount(value);
  const inStockId = useId();
  const colourSwatches = useStorefront().config.colourSwatches;
  const swatchByValue = colourSwatches && new Map(colourSwatches.map((c) => [c.value, c]));

  const toggleOption = (name: string, optionValue: string) => {
    const next = { ...value.options };
    const toggled = toggleInList(next[name], optionValue);
    if (toggled) next[name] = toggled;
    else delete next[name];
    onChange({ options: next });
  };

  return (
    <div>
      {activeCount > 0 && (
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <span className="text-sm font-medium">
            {activeCount} {activeCount === 1 ? "filter" : "filters"}
          </span>
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Price leads the panel — it's the filter shoppers reach for first. */}
      {facets.price.max > facets.price.min && (
        <FilterGroup title="Price">
          <PriceRangeFilter
            min={facets.price.min}
            max={facets.price.max}
            value={[value.minPrice ?? facets.price.min, value.maxPrice ?? facets.price.max]}
            onCommit={([lo, hi]) =>
              onChange({
                minPrice: lo > facets.price.min ? lo : undefined,
                maxPrice: hi < facets.price.max ? hi : undefined,
              })
            }
          />
        </FilterGroup>
      )}

      {facets.subcategories.map((facet) => (
        <FilterGroup key={facet.key} title={facet.label}>
          <RadioList
            facet={facet}
            allLabel="All"
            selected={value.subcategory}
            onSelect={(v) => onChange({ subcategory: v })}
          />
        </FilterGroup>
      ))}

      {/* "Size" is a per-item purchase choice (Petite / Signature / pot type),
          not a way to browse the catalog — mixing pot sizes and stem counts in a
          filter reads as noise, so it's kept to the PDP. Any other option facet
          still shows. */}
      {facets.options
        .filter((facet) => facet.key !== "Size")
        .map((facet) => (
          <FilterGroup key={facet.key} title={facet.label}>
            <CheckboxList
              facet={facet}
              isChecked={(v) => !!value.options[facet.key]?.includes(v)}
              onToggle={(v) => toggleOption(facet.key, v)}
            />
          </FilterGroup>
        ))}

      {facets.collections.map((facet) => (
        <FilterGroup key={facet.key} title={facet.label}>
          <RadioList
            facet={facet}
            allLabel="All collections"
            selected={value.collection}
            onSelect={(v) => onChange({ collection: v })}
          />
        </FilterGroup>
      ))}

      {/* Tags render as pigment swatches when the brand supplies them (colour-first
          shopping, e.g. flowers), and as the standard checkbox list otherwise. */}
      {facets.tags.map((facet) => (
        <FilterGroup key={facet.key} title={facet.label}>
          {swatchByValue ? (
            <ColourSwatchList
              facet={facet}
              swatchByValue={swatchByValue}
              isChecked={(v) => value.tags.includes(v)}
              onToggle={(v) => onChange({ tags: toggleInList(value.tags, v) ?? [] })}
            />
          ) : (
            <CheckboxList
              facet={facet}
              isChecked={(v) => value.tags.includes(v)}
              onToggle={(v) => onChange({ tags: toggleInList(value.tags, v) ?? [] })}
            />
          )}
        </FilterGroup>
      ))}

      <FilterGroup title="Availability">
        <div className="flex items-center gap-2.5 text-sm">
          <Checkbox
            id={inStockId}
            checked={value.inStock}
            onCheckedChange={(checked) => onChange({ inStock: checked === true })}
          />
          <label htmlFor={inStockId} className={ROW_LABEL}>
            In stock only
          </label>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {facets.inStockCount}
          </span>
        </div>
      </FilterGroup>
    </div>
  );
}

/**
 * Dual-handle price range.
 *
 * Dragging is local state committed on release — writing every intermediate
 * value to the URL would push a history entry per pixel and refilter the grid
 * mid-drag.
 */
function PriceRangeFilter({
  min,
  max,
  value,
  onCommit,
}: {
  min: number;
  max: number;
  value: [number, number];
  onCommit: (value: [number, number]) => void;
}) {
  const { region } = useRegion();
  const [draft, setDraft] = useState<[number, number]>(value);

  // Re-sync when the URL changes underneath (Clear all, back button).
  useEffect(() => setDraft(value), [value[0], value[1]]);

  // A single-euro step is meaningless across a €50–€2000 span; scale it so the
  // handle moves in round numbers.
  const step = Math.max(1, Math.round((max - min) / 100));
  const money = (amount: number) => formatMoney(amount, region.currency, region.locale);

  return (
    <div className="pt-1">
      <Slider
        min={min}
        max={max}
        step={step}
        value={draft}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => setDraft([v[0], v[1]])}
        onValueCommit={(v) => onCommit([v[0], v[1]])}
        aria-label="Price range"
        className="mt-2"
      />
      <div className="mt-3 flex items-center justify-between text-sm tabular-nums">
        <span>{money(draft[0])}</span>
        <span className="text-muted-foreground">{money(draft[1])}</span>
      </div>
    </div>
  );
}

// A tag facet can run to 30+ values; past this many the sidebar becomes a
// scroll hazard, so the tail collapses behind a toggle.
const COLLAPSE_AFTER = 8;

function CheckboxList({
  facet,
  isChecked,
  onToggle,
}: {
  facet: Facet;
  isChecked: (value: string) => boolean;
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = facet.values.length > COLLAPSE_AFTER;

  // Anything already selected stays visible while collapsed — hiding an active
  // filter behind "show more" makes it impossible to find and switch off.
  const alwaysVisible = collapsible
    ? facet.values.filter((v, i) => i < COLLAPSE_AFTER || isChecked(v.value))
    : facet.values;
  const behindToggle = facet.values.filter((v) => !alwaysVisible.includes(v));

  const row = (v: Facet["values"][number]) => (
    <CheckboxRow
      key={v.value}
      label={v.label}
      count={v.count}
      checked={isChecked(v.value)}
      onToggle={() => onToggle(v.value)}
    />
  );

  if (!collapsible) {
    return <div className="flex flex-col gap-2.5">{facet.values.map(row)}</div>;
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="flex flex-col gap-2.5">
      {alwaysVisible.map(row)}
      <CollapsibleContent>
        {/* The tag facet runs to 200+ values on the full catalog — capped and
            scrolled so "show all" can't turn the sidebar into a mile of rows.
            The cap goes on a child, not on Content itself, whose height Radix
            animates. */}
        <div className="flex max-h-72 flex-col gap-2.5 overflow-y-auto pt-2.5">
          {behindToggle.map(row)}
        </div>
      </CollapsibleContent>
      <CollapsibleTrigger className="self-start text-xs text-muted-foreground underline hover:text-foreground">
        {expanded ? "Show less" : `Show all ${facet.values.length}`}
      </CollapsibleTrigger>
    </Collapsible>
  );
}

function CheckboxRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <label htmlFor={id} className={cn(ROW_LABEL, "min-w-0 flex-1 truncate")}>
        {label}
      </label>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

// Radix RadioGroup has no "nothing selected" value, so the All row gets a
// sentinel rather than the empty string (a real facet value could be "").
const ALL_VALUE = "__all__";

function RadioList({
  facet,
  allLabel,
  selected,
  onSelect,
}: {
  facet: Facet;
  allLabel: string;
  selected?: string;
  onSelect: (value: string | undefined) => void;
}) {
  const base = useId();
  return (
    <RadioGroup
      aria-label={facet.label}
      value={selected ?? ALL_VALUE}
      onValueChange={(v) => onSelect(v === ALL_VALUE ? undefined : v)}
      className="gap-2.5"
    >
      <div className="flex items-center gap-2.5 text-sm">
        <RadioGroupItem value={ALL_VALUE} id={`${base}-all`} />
        <label htmlFor={`${base}-all`} className={ROW_LABEL}>
          {allLabel}
        </label>
      </div>
      {facet.values.map((v, i) => (
        <div key={v.value} className="flex items-center gap-2.5 text-sm">
          <RadioGroupItem value={v.value} id={`${base}-${i}`} />
          <label htmlFor={`${base}-${i}`} className={cn(ROW_LABEL, "min-w-0 flex-1 truncate")}>
            {v.label}
          </label>
          <span className="text-xs tabular-nums text-muted-foreground">{v.count}</span>
        </div>
      ))}
    </RadioGroup>
  );
}

/**
 * The colour facet, rendered as pigment swatches instead of checkboxes — colour
 * is the first thing a flower shopper filters by, so it earns a swatch grid.
 * These are multi-select toggles (`aria-pressed`), each labelled for a screen
 * reader with its colour name and product count.
 */
function ColourSwatchList({
  facet,
  swatchByValue,
  isChecked,
  onToggle,
}: {
  facet: Facet;
  swatchByValue: Map<string, ColourSwatch>;
  isChecked: (value: string) => boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-4 pt-1">
      {facet.values.map((v) => {
        const meta = swatchByValue.get(v.value);
        const checked = isChecked(v.value);
        const label = meta?.label ?? v.label;
        return (
          <button
            key={v.value}
            type="button"
            aria-pressed={checked}
            aria-label={`${label} (${v.count})`}
            onClick={() => onToggle(v.value)}
            className="group flex w-11 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "relative grid h-9 w-9 place-items-center rounded-full ring-1 ring-border transition group-hover:ring-bloom",
                checked && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              style={{ background: meta?.swatch ?? "#ccc" }}
            >
              {checked && (
                <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-[11px] leading-none",
                checked ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    // role=group + the heading as its accessible name, so a screen reader
    // announces "Storage group" rather than a bare list of checkboxes.
    <div role="group" aria-labelledby={id} className="border-b border-border/60 py-5">
      <div
        id={id}
        className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {title}
      </div>
      {children}
    </div>
  );
}
