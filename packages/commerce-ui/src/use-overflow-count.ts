import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * "Priority+" navigation: how many items fit on one row before the rest have
 * to move into an overflow menu.
 *
 * A category nav can't assume a fixed item count — names come from the backend
 * and vary in length, so any hardcoded "show the first 6" either wraps the
 * header or wastes space. This measures the real rendered widths once, then
 * recomputes on resize from the cached measurements.
 *
 * Returns a ref for the measuring row, the number that fit, and whether a
 * measurement has happened yet (render the row hidden until it has, or the
 * first paint flashes the full, overflowing list).
 */
export function useOverflowCount(itemCount: number, reservedWidth = 96) {
  const containerRef = useRef<HTMLElement | null>(null);
  const widthsRef = useRef<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(itemCount);
  const [measured, setMeasured] = useState(false);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const widths = widthsRef.current;
    if (!container || widths.length === 0) return;

    const available = container.clientWidth;
    const total = widths.reduce((sum, w) => sum + w, 0);

    // Everything fits — no overflow trigger needed, so no width reserved.
    if (total <= available) {
      setVisibleCount(widths.length);
      return;
    }

    let used = 0;
    let count = 0;
    for (const width of widths) {
      if (used + width > available - reservedWidth) break;
      used += width;
      count += 1;
    }
    setVisibleCount(count);
  }, [reservedWidth]);

  // useLayoutEffect so the measure-then-trim happens before the browser paints.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (widthsRef.current.length !== itemCount) {
      widthsRef.current = Array.from(container.children).map(
        (child) => (child as HTMLElement).offsetWidth,
      );
    }
    recompute();
    setMeasured(true);

    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [itemCount, recompute]);

  return { containerRef, visibleCount, measured };
}
