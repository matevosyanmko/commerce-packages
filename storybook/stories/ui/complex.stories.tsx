// The wrappers with a third-party engine behind them: react-day-picker, embla,
// cmdk and sonner. Each is worth a story mostly to prove the dependency loads
// and inherits the theme — they're the ones that fail loudly when it doesn't.

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Calculator, Calendar as CalendarIcon, Search, Settings, Smile } from "lucide-react";
import { Button } from "@wm-storefront/ui/button";
import { Calendar } from "@wm-storefront/ui/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@wm-storefront/ui/carousel";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@wm-storefront/ui/command";

// Calendar and Carousel take real options of their own; the cmdk parts forward
// everything, so only the two roots are tabulated.
const meta: Meta = {
  title: "ui/Complex",
  component: Calendar,
  subcomponents: { Carousel, Command },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Calendars: Story = {
  render: function Render() {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 6, 28));
    return (
      <div className="flex flex-wrap gap-8">
        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-xl border" />
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border"
        />
      </div>
    );
  },
};

/** Embla-backed. The product gallery and hero both lean on this. */
export const Carousels: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-md">
      <Carousel>
        <CarouselContent>
          {Array.from({ length: 6 }, (_, i) => (
            <CarouselItem key={i}>
              <div className="bg-surface grid aspect-video place-items-center rounded-xl text-2xl">
                {i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const MultiItemCarousel: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-2xl">
      <Carousel opts={{ align: "start" }}>
        <CarouselContent>
          {Array.from({ length: 9 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/3">
              <div className="bg-surface grid aspect-square place-items-center rounded-xl">
                {i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

/** cmdk. SearchDialog is built on the same primitive. */
export const CommandPalette: Story = {
  render: () => (
    <Command className="border-border max-w-md rounded-xl border">
      <CommandInput placeholder="Search products and pages…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Products">
          <CommandItem>
            <Search className="h-4 w-4" /> Aurora Headphones
          </CommandItem>
          <CommandItem>
            <Search className="h-4 w-4" /> Meridian Watch
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          <CommandItem>
            <CalendarIcon className="h-4 w-4" /> Delivery
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Calculator className="h-4 w-4" /> Returns
          </CommandItem>
          <CommandItem>
            <Smile className="h-4 w-4" /> Contact
          </CommandItem>
          <CommandItem>
            <Settings className="h-4 w-4" /> Account
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/**
 * The decorator already mounts one `<Toaster />` for the whole harness — mounting
 * a second here would render every toast twice, which is exactly the duplicate
 * -singleton problem `sonner` being a peer dep is meant to prevent. So this story
 * only fires toasts.
 */
export const Toasts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast("Added to basket")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Aurora Headphones saved")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("That variant is unavailable")}>
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Removed from saved", {
            description: "Saved items live on this device until you sign in.",
            action: { label: "Undo", onClick: () => toast.success("Restored") },
          })
        }
      >
        With action
      </Button>
    </div>
  ),
};
