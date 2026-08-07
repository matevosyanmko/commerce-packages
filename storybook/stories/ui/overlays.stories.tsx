// Everything that portals out of the story subtree. These are the stories most
// likely to reveal a theming mistake in the harness: portalled content mounts on
// document.body, so it only inherits the tokens if they're defined on :root
// rather than scoped to the decorator's wrapper.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, CreditCard, LogOut, Settings, Trash2, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@wm-storefront/ui/alert-dialog";
import { Button } from "@wm-storefront/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@wm-storefront/ui/context-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@wm-storefront/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@wm-storefront/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@wm-storefront/ui/hover-card";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@wm-storefront/ui/menubar";
import { Popover, PopoverContent, PopoverTrigger } from "@wm-storefront/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wm-storefront/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wm-storefront/ui/tooltip";

// The roots (Popover, Sheet, …) are re-exported Radix primitives with nothing of
// ours on them, so the tables point at the parts this package actually wraps.
// SheetContent leads: `side` is the only genuinely custom prop across these
// overlays. The rest forward to Radix, so their tables would show `asChild` and
// nothing else — the menu, drawer and alert-dialog parts are omitted for that
// reason rather than by oversight.
const meta: Meta = {
  title: "ui/Overlays",
  component: SheetContent,
  subcomponents: { PopoverContent, TooltipContent, HoverCardContent, DrawerContent },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Popovers: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Delivery estimate</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        Ordered today, this arrives between Thursday and Saturday.
      </PopoverContent>
    </Popover>
  ),
};

export const Tooltips: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Copy">
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy order number</TooltipContent>
        </Tooltip>
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button variant="ghost">Always open</Button>
          </TooltipTrigger>
          <TooltipContent>Pinned so the styling is visible at rest</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const HoverCards: Story = {
  render: () => (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <Button variant="link">Aurora Headphones</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 text-sm">
        <p className="font-medium">Aurora Headphones</p>
        <p className="text-muted-foreground mt-1">
          Forty hours of battery, adaptive noise cancellation.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Sheets: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(["left", "right", "top", "bottom"] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Panel from {side}</SheetTitle>
              <SheetDescription>The cart drawer and mobile nav both use this.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};

/** Vaul-backed, not Radix — the drag-to-dismiss one. */
export const Drawers: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Sort products</DrawerTitle>
          <DrawerDescription>Drag the handle down to dismiss.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const AlertDialogs: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Empty basket
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Empty your basket?</AlertDialogTitle>
          <AlertDialogDescription>
            All items will be removed. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep them</AlertDialogCancel>
          <AlertDialogAction>Empty it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const DropdownMenus: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="h-4 w-4" /> Orders
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-4 w-4" /> Settings
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* These wrappers predate upstream's `variant` prop (see CLAUDE.md — the
            ui/ folder keeps the older forwardRef convention), so destructive
            styling is a className here, not a variant. */}
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const ContextMenus: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="border-border text-muted-foreground grid h-40 w-80 place-items-center rounded-xl border border-dashed text-sm">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          Add to basket <ContextMenuShortcut>⌘B</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Save for later</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive">Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const Menubars: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Shop</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>All products</MenubarItem>
          <MenubarItem>New arrivals</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Sale</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Delivery</MenubarItem>
          <MenubarItem>Returns</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};
