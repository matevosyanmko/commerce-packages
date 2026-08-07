import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "./FavoritesProvider";
import { cn } from "@wm-storefront/ui/utils";

/**
 * Save/unsave a product.
 *
 * Deliberately always visible rather than revealed on hover: touch devices have
 * no hover, and a save control the shopper can't see is a save control they
 * don't use. `aria-pressed` carries the state — this is a toggle, not a link —
 * and the label changes with it so a screen reader announces what the press
 * will do rather than just "favourite".
 */
export function FavoriteButton({
  productId,
  productTitle,
  className,
  size = "sm",
}: {
  productId: string;
  productTitle: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const { isFavorite, toggle, isSaving, isPersisted } = useFavorites();
  const active = isFavorite(productId);

  const onClick = async (e: React.MouseEvent) => {
    // On a product card this button sits inside the card's stretched link.
    e.preventDefault();
    e.stopPropagation();
    try {
      const nowSaved = await toggle(productId);
      toast.success(nowSaved ? `${productTitle} saved` : `${productTitle} removed from saved`, {
        // Guests get told once that the list is only on this device — the
        // honest version of a wishlist without a backend to hold it.
        description: nowSaved && !isPersisted ? "Sign in to keep it across devices." : undefined,
      });
    } catch {
      toast.error("Couldn't update your saved items. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      aria-pressed={active}
      aria-label={active ? `Remove ${productTitle} from saved` : `Save ${productTitle}`}
      className={cn(
        // 44px tap target regardless of the icon inside it.
        "grid h-11 w-11 place-items-center rounded-full transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          size === "lg" ? "h-5 w-5" : "h-4 w-4",
          "transition-all",
          active ? "fill-sale text-sale scale-110" : "text-foreground",
        )}
      />
    </button>
  );
}
