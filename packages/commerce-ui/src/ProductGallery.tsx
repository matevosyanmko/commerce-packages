import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wm-storefront/ui/tabs";
import { cn } from "@wm-storefront/ui/utils";
import { StoreImage } from "./StoreImage";

/**
 * PDP image gallery.
 *
 * A thumbnail strip driving one large image *is* a tab list, so it's built on
 * Radix Tabs: arrow keys move between shots, `aria-selected` says which one is
 * showing, and the large image is a real tabpanel. The main shot sits in the
 * arched "atelier window" frame — the storefront's signature.
 */
export function ProductGallery({
  images,
  title,
  activeUrl,
}: {
  images: string[];
  title: string;
  activeUrl?: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!activeUrl) return;
    const i = images.indexOf(activeUrl);
    if (i >= 0) setActive(i);
  }, [activeUrl, images]);

  const index = Math.min(active, Math.max(images.length - 1, 0));

  return (
    <Tabs
      value={String(index)}
      onValueChange={(v) => {
        setActive(Number(v));
        setZoom(false);
      }}
      className="grid gap-4 md:sticky md:top-28 md:self-start"
    >
      {images.map((img, i) => (
        <TabsContent key={`${img}-${i}`} value={String(i)} className="mt-0">
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            aria-pressed={zoom}
            className="arch surface-card relative block aspect-[4/5] w-full cursor-zoom-in ring-1 ring-border/60"
          >
            <span className="sr-only">
              {zoom ? "Zoom out of" : "Zoom into"} {title}
            </span>
            <StoreImage
              src={img}
              size="lg"
              alt={`${title} — image ${i + 1}`}
              width={1000}
              height={1250}
              priority={i === 0}
              decoding={i === 0 ? "sync" : "async"}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500",
                zoom && "scale-150",
              )}
            />
          </button>
        </TabsContent>
      ))}

      {images.length > 1 && (
        <TabsList
          aria-label={`${title} images`}
          className="grid h-auto grid-cols-3 gap-3 bg-transparent p-0"
        >
          {images.map((img, i) => (
            <TabsTrigger
              key={`${img}-${i}`}
              value={String(i)}
              aria-label={`Image ${i + 1} of ${images.length}`}
              className="surface-card block aspect-square h-auto overflow-hidden rounded-[1.1rem] p-0 ring-1 ring-transparent transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:ring-primary"
            >
              <StoreImage
                src={img}
                size="sm"
                alt=""
                width={240}
                height={240}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </TabsTrigger>
          ))}
        </TabsList>
      )}
    </Tabs>
  );
}
