import { Link } from "@tanstack/react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@wm-storefront/ui/pagination";
import { buttonVariants } from "@wm-storefront/ui/button";
import { cn } from "@wm-storefront/ui/utils";

/** Products per page. 24 divides evenly by the 2/3/4-column grids. */
export const PAGE_SIZE = 24;

/**
 * Page numbers to render, collapsing the middle of a long range:
 * `1 … 4 5 6 … 20`. Always shows first, last, current and its neighbours.
 */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pageCount - 1, page + 1);

  if (from > 2) out.push("gap");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pageCount - 1) out.push("gap");

  out.push(pageCount);
  return out;
}

/**
 * Catalog pagination.
 *
 * Every page is a real `<a href>` carrying the current filters, so a page deep
 * in a filtered result set is shareable, crawlable and survives a reload — the
 * same contract the filters themselves keep with the URL. Page 1 is written as
 * an absent `page` param rather than `?page=1`, so the first page of a listing
 * has exactly one address instead of two.
 */
export function ProductPagination({
  page,
  pageCount,
  className,
}: {
  page: number;
  pageCount: number;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const linkTo = (p: number) => ({
    to: ".",
    search: (prev: Record<string, unknown>) => ({
      ...prev,
      page: p === 1 ? undefined : p,
    }),
    // Without this every page link matches on pathname alone, so TanStack marks
    // page 1 as the active page no matter which page you are actually on — and
    // stamps its own `aria-current="page"` on it.
    activeOptions: { includeSearch: true, exact: true },
  });

  const itemClass = (active: boolean) =>
    cn(
      buttonVariants({ variant: active ? "outline" : "ghost", size: "icon" }),
      "tabular-nums",
      active && "border-foreground font-medium",
    );

  return (
    <Pagination className={cn("mt-12", className)}>
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          {page > 1 ? (
            <Link
              {...linkTo(page - 1)}
              aria-label="Go to previous page"
              className={cn(buttonVariants({ variant: "ghost" }), "gap-1 pl-2.5")}
            >
              Previous
            </Link>
          ) : (
            // Rendered inert rather than dropped, so the row doesn't reflow as
            // the shopper moves between page 1 and page 2.
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-1 pl-2.5 pointer-events-none opacity-40",
              )}
            >
              Previous
            </span>
          )}
        </PaginationItem>

        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <Link
                {...linkTo(p)}
                aria-label={`Go to page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={itemClass(p === page)}
              >
                {p}
              </Link>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          {page < pageCount ? (
            <Link
              {...linkTo(page + 1)}
              aria-label="Go to next page"
              className={cn(buttonVariants({ variant: "ghost" }), "gap-1 pr-2.5")}
            >
              Next
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-1 pr-2.5 pointer-events-none opacity-40",
              )}
            >
              Next
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** "Showing 1–24 of 250 products" — the range this page actually covers. */
export function ResultRange({
  page,
  pageSize = PAGE_SIZE,
  total,
  className,
}: {
  page: number;
  pageSize?: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <span className={className}>
      Showing {from}–{to} of {total} {total === 1 ? "product" : "products"}
    </span>
  );
}
