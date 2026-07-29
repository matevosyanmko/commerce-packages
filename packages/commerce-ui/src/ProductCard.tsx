import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@gucco/commerce-core";
import { useRegion } from "./RegionProvider";
import { useCart } from "./CartProvider";
import { minVariantPrice, inStock } from "@gucco/commerce-core";
import { discountPercent } from "@gucco/commerce-core";
import { track } from "@gucco/commerce-core";
import { cn } from "@gucco/ui/utils";
import { FavoriteButton } from "./FavoriteButton";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

interface ProductCardProps {
  product: Product;
  /** Above-the-fold card: load its image eagerly so it can be the LCP element. */
  priority?: boolean;
  index?: number;
}

export function ProductCard({ product, priority, index }: ProductCardProps) {
  const { region } = useRegion();
  const { addItem, isMutating } = useCart();

  const price = minVariantPrice(product, region.id);
  const discount = discountPercent(price.amount, price.compareAt);
  const available = inStock(product);
  const category = product.categoryHandles[0] ?? "";

  // Hover gallery: cross-fade through the product's images while the cursor is
  // over the card, then settle back to the primary image on leave. The extra
  // layers are mounted lazily on the first hover so unhovered cards never load
  // (or, with a real backend, request) anything beyond image[0] — the LCP one.
  const images = product.images.length ? product.images : [product.images[0]];
  const hasGallery = images.length > 1;
  const [activeImage, setActiveImage] = useState(0);
  const [galleryMounted, setGalleryMounted] = useState(false);
  const cycle = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCycle = () => {
    if (cycle.current) {
      clearInterval(cycle.current);
      cycle.current = null;
    }
    setActiveImage(0);
  };

  const startCycle = () => {
    if (!hasGallery || cycle.current) return;
    // Honour reduced-motion: no auto-advancing imagery.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setGalleryMounted(true);
    cycle.current = setInterval(() => {
      setActiveImage((i) => (i + 1) % images.length);
    }, 1100);
  };

  // Clear the interval if the card unmounts mid-cycle (e.g. paging the grid).
  useEffect(() => () => stopCycle(), []);

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    const variant = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
    if (!variant) return;
    try {
      await addItem(variant.id, 1);
      toast.success(`${product.title} added to your basket`);
    } catch {
      toast.error("Couldn't add that just now. Please try again.");
    }
  };

  return (
    // See the electronics/furniture note: the card is an <article> with a
    // stretched title link, so the quick-add button is a valid sibling rather
    // than nested interactive content. content-visibility skips paint for
    // off-screen cards on long PLPs. Portrait 4:5 frame — the bloom art is 4:5.
    <article
      className={cn(
        "group relative [content-visibility:auto]",
        "[contain-intrinsic-size:auto_360px] md:[contain-intrinsic-size:auto_420px] lg:[contain-intrinsic-size:auto_440px]",
      )}
    >
      {/* The lift is driven by group-hover on the (stationary) <article>, not by
          the image box's own :hover. Self-:hover here made the box translate out
          from under the pointer over the heart/quick-add controls, toggling the
          hover boundary and bobbing the card. */}
      <div
        className="surface-card relative aspect-[4/5] overflow-hidden rounded-[1.6rem] ring-1 ring-border/50 transition-transform duration-[550ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-[5px]"
        onMouseEnter={startCycle}
        onMouseLeave={stopCycle}
      >
        {/* Cross-fade stack: scale + sold-out dimming live on the wrapper so the
            per-layer opacity is free to drive the hover fade without conflict. */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]",
            !available && "opacity-70 saturate-[0.6]",
          )}
        >
          {(galleryMounted ? images : images.slice(0, 1)).map((src, i) => (
            <StoreImage
              key={src ?? i}
              src={src}
              size="sm"
              alt={i === 0 ? product.title : ""}
              width={640}
              height={800}
              priority={i === 0 ? priority : false}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out",
                i === activeImage ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
        </div>

        {/* One badge, top-left. Sale wins, then a seasonal flag. */}
        {discount != null ? (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
            −{discount}%
          </span>
        ) : product.collectionHandle === "seasonal" ? (
          <span className="leaf absolute left-3 top-3 bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            In season
          </span>
        ) : null}

        {!available && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
            Sold out
          </span>
        )}
      </div>

      {/* Interactive controls sit in an overlay that mirrors the image box but is
          NOT transformed. The image box gets `group-hover:-translate-y`, and a
          transformed element is its own stacking context — which would trap these
          buttons *below* the title's article-level stretched-link `::after`, so a
          click on the heart or Add would fall through to the link and open the
          PDP. Out here their z-10 clears the overlay reliably. `pointer-events-none`
          lets clicks on the bare image pass through to the stretched link (the
          image still opens the PDP); each button re-enables pointer events for
          itself. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[4/5]">
        <FavoriteButton
          productId={product.id}
          productTitle={product.title}
          className="pointer-events-auto absolute right-2.5 top-2.5 bg-card/80 backdrop-blur-sm hover:bg-card"
        />

        {available && (
          <button
            aria-label={`Add ${product.title} to your basket`}
            onClick={quickAdd}
            disabled={isMutating}
            // Visible by default; reveal-on-hover only from lg up (touch has no
            // hover). Keyboard users get it on focus at every width.
            className="pointer-events-auto absolute bottom-3 right-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 focus-visible:translate-y-0 focus-visible:opacity-100 disabled:opacity-50 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      <div className="mt-3.5">
        <div className="eyebrow !text-[0.62rem] !text-muted-foreground">
          {category.replace(/-/g, " ")}
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          {/* h3 inherits Fraunces from the base layer — product names read as
              serif, which is the whole editorial idea. */}
          <h3 className="min-w-0 truncate text-[1.05rem] font-medium" title={product.title}>
            <Link
              to="/products/$handle"
              params={{ handle: product.handle }}
              onClick={() =>
                track("select_item", { item_id: product.id, item_name: product.title, index })
              }
              className="after:absolute after:inset-0 after:content-['']"
            >
              {product.title}
            </Link>
          </h3>
          <Price amount={price.amount} compareAt={price.compareAt} compact className="shrink-0" />
        </div>
        {product.subtitle && (
          <p className="mt-0.5 truncate text-[0.82rem] italic text-muted-foreground">
            {product.subtitle}
          </p>
        )}
      </div>
    </article>
  );
}
