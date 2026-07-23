import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@storefront/ui";
import { useOptionalStorefront } from "./StorefrontProvider";

export type ImageSize = "sm" | "base" | "lg";

/**
 * Insert a `-{size}` postfix before the file extension of an image URL.
 * `base` (the default) is returned untouched. Query strings and hashes are
 * preserved, and URLs with no detectable extension are returned as-is.
 *
 *   withSize("/img/rose.webp", "sm")        -> "/img/rose-sm.webp"
 *   withSize("https://x/a.png?v=2", "lg")   -> "https://x/a-lg.png?v=2"
 *   withSize("/img/rose.webp", "base")      -> "/img/rose.webp"
 */
export function withSize(
  url: string | undefined,
  size: ImageSize = "base",
): string | undefined {
  if (!url || size === "base") return url;

  const match = /^([^?#]*)(.*)$/.exec(url);
  const path = match?.[1] ?? url;
  const suffix = match?.[2] ?? "";

  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");
  if (dot === -1 || dot < slash) return url;

  return `${path.slice(0, dot)}-${size}${path.slice(dot)}${suffix}`;
}

export interface StoreImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image size variant; picks the matching `-{size}` file. Defaults to `base`. */
  size?: ImageSize;
  /**
   * Skip progressive loading entirely and request the full size immediately,
   * server-rendered. Use for the LCP element — a hero or a PDP main image.
   */
  priority?: boolean;
  /** How far outside the viewport to start the upgrade. */
  rootMargin?: string;
}

/**
 * Catalog image with progressive loading.
 *
 * Brand-specific inline imagery (e.g. Fleurette's procedural `bloom:` SVGs) is
 * resolved through the injected `inlineImage` resolver on StorefrontConfig — this
 * component knows nothing about any particular scheme. A resolved inline image
 * (and any `data:` URI) renders immediately with no network request and no
 * `-sm/-lg` rewrite. Everything else takes the progressive path below
 * (IntersectionObserver + `-sm` derivative + cross-fade).
 *
 * `width`/`height` are still required from callers — the browser derives the
 * aspect ratio from them and reserves the box before any bytes arrive, which is
 * what keeps the grid from shifting as images load.
 */
export const StoreImage = forwardRef<HTMLImageElement, StoreImageProps>(
  (
    {
      src,
      size = "base",
      alt = "",
      decoding = "async",
      priority = false,
      rootMargin = "300px 0px",
      className,
      loading,
      fetchPriority,
      onLoad,
      ...props
    },
    ref,
  ) => {
    const inlineImage = useOptionalStorefront()?.config.inlineImage;

    // Inline imagery (brand schemes + data URIs) needs no network round-trip, so
    // it renders immediately and skips the progressive machinery entirely.
    const inlineSrc = useMemo(() => {
      const resolved = inlineImage?.(src);
      if (resolved) return resolved;
      if (src?.startsWith("data:")) return src;
      return null;
    }, [src, inlineImage]);

    const target = withSize(src, size);
    const placeholder = size === "sm" ? target : withSize(src, "sm");
    const needsUpgrade = !inlineSrc && !priority && target !== placeholder;

    const [upgraded, setUpgraded] = useState(!needsUpgrade);
    const [swapping, setSwapping] = useState(false);
    const node = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
      if (!needsUpgrade || upgraded) return;
      const el = node.current;
      if (!el) return;

      const margin = parseInt(rootMargin, 10) || 0;
      const box = el.getBoundingClientRect();
      const nearViewport =
        box.top < window.innerHeight + margin &&
        box.bottom > -margin &&
        box.left < window.innerWidth + margin &&
        box.right > -margin;

      if (nearViewport || typeof IntersectionObserver === "undefined") {
        setUpgraded(true);
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          setSwapping(true);
          setUpgraded(true);
          io.disconnect();
        },
        { rootMargin },
      );
      io.observe(el);
      return () => io.disconnect();
    }, [needsUpgrade, upgraded, rootMargin]);

    return (
      <img
        ref={(el) => {
          node.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        src={inlineSrc ?? (upgraded ? target : placeholder)}
        alt={alt}
        decoding={decoding}
        loading={loading ?? (priority ? "eager" : "lazy")}
        fetchPriority={fetchPriority ?? (priority ? "high" : undefined)}
        onLoad={(e) => {
          setSwapping(false);
          onLoad?.(e);
        }}
        className={cn(swapping && "blur-[2px]", "transition-[filter] duration-300", className)}
        {...props}
      />
    );
  },
);

StoreImage.displayName = "StoreImage";
