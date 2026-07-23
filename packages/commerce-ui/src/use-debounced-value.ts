import { useEffect, useState } from "react";

/** Delay propagating fast-changing input (a search box) so downstream effects
 *  and requests fire once the user pauses rather than once per keystroke. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
