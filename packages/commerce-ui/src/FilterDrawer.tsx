import { SlidersHorizontal } from "lucide-react";
import type { Facets } from "@gucco/commerce-core";
import type { FilterValue } from "@gucco/commerce-core";
import { Button } from "@gucco/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@gucco/ui/sheet";
import { FilterSidebar } from "./FilterSidebar";

/**
 * The filter sidebar as a drawer, for viewports too narrow to show it beside
 * the grid — plus the button that opens it.
 *
 * Both PLPs had their own copy of this: an `<aside>` that became
 * `fixed inset-0 z-50 !block` through a `cn()` branch, with no focus trap, no
 * scroll lock and no Escape. On ui/sheet (Radix Dialog) all three come for
 * free, and there is one copy instead of two.
 *
 * It owns its trigger rather than taking an `open` prop, because Radix restores
 * focus to a Dialog's trigger on close — a triggerless sheet drops focus on
 * <body>.
 */
export function FilterDrawer({
  facets,
  value,
  onChange,
  onClear,
  activeCount,
  resultCount,
}: {
  facets: Facets;
  value: FilterValue;
  onChange: (patch: Partial<FilterValue>) => void;
  onClear: () => void;
  activeCount: number;
  resultCount: number;
}) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm lg:hidden">
        <SlidersHorizontal className="h-4 w-4" />
        Filters {activeCount > 0 && `(${activeCount})`}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm lg:hidden"
        aria-describedby={undefined}
      >
        <SheetHeader className="shrink-0 flex-row items-center border-b border-border/60 px-6 py-4 text-left">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <FilterSidebar facets={facets} value={value} onChange={onChange} onClear={onClear} />
        </div>

        <SheetFooter className="shrink-0 border-t border-border/60 p-4">
          <SheetClose asChild>
            <Button size="lg" className="h-12 w-full rounded-full">
              Show {resultCount} {resultCount === 1 ? "result" : "results"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
