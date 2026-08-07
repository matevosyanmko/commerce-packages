// Layout and navigation primitives — the ones that arrange content rather than
// collect it.

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@wm-storefront/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@wm-storefront/ui/breadcrumb";
import { Button } from "@wm-storefront/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wm-storefront/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@wm-storefront/ui/pagination";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@wm-storefront/ui/navigation-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@wm-storefront/ui/resizable";
import { ScrollArea, ScrollBar } from "@wm-storefront/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wm-storefront/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@wm-storefront/ui/tabs";

// The table, breadcrumb and tabs parts are className-only wrappers. These four
// are the ones carrying their own props (`withHandle`, `isActive`/`size`,
// orientation).
const meta: Meta = {
  title: "ui/Structure",
  component: ResizableHandle,
  subcomponents: { PaginationLink, ScrollBar, ResizablePanelGroup, AccordionTrigger },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Accordions: Story = {
  render: () => (
    <Accordion type="single" collapsible className="max-w-lg">
      <AccordionItem value="delivery">
        <AccordionTrigger>How long does delivery take?</AccordionTrigger>
        <AccordionContent>Two to three working days across the EU.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>What's the returns window?</AccordionTrigger>
        <AccordionContent>Thirty days, unopened, in the original packaging.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionTrigger>Is there a warranty?</AccordionTrigger>
        <AccordionContent>Two years on every product.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Collapsibles: Story = {
  render: () => (
    <Collapsible className="max-w-md space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline">Specifications</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground space-y-1 text-sm">
        <p>Warranty — 2 years</p>
        <p>Connectivity — Bluetooth 5.3</p>
        <p>Weight — 192 g</p>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const TabbedPanels: Story = {
  render: () => (
    <Tabs defaultValue="description" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="text-muted-foreground pt-4 text-sm">
        Over-ear wireless headphones with adaptive noise cancellation.
      </TabsContent>
      <TabsContent value="specs" className="text-muted-foreground pt-4 text-sm">
        Bluetooth 5.3, 40-hour battery, 192 g.
      </TabsContent>
      <TabsContent value="delivery" className="text-muted-foreground pt-4 text-sm">
        Free over €50, otherwise €5.
      </TabsContent>
    </Tabs>
  ),
};

export const Tables: Story = {
  render: () => (
    <Table className="max-w-2xl">
      <TableCaption>Recent orders</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          ["#1041", "Delivered", "€279"],
          ["#1042", "Shipped", "€128"],
          ["#1043", "Processing", "€59"],
        ].map(([id, status, total]) => (
          <TableRow key={id}>
            <TableCell className="font-medium">{id}</TableCell>
            <TableCell>{status}</TableCell>
            <TableCell className="text-right">{total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Breadcrumbs: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Audio</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Aurora Headphones</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const Paginations: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const NavigationMenus: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[380px] gap-1 p-3">
              {["Audio", "Wearables", "Desk", "Power"].map((c) => (
                <li key={c}>
                  <NavigationMenuLink className="block rounded-md p-2 text-sm">{c}</NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[280px] gap-1 p-3">
              {["Premium", "Everyday"].map((c) => (
                <li key={c}>
                  <NavigationMenuLink className="block rounded-md p-2 text-sm">{c}</NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

export const ScrollAreas: Story = {
  render: () => (
    <div className="flex gap-8">
      <ScrollArea className="border-border h-56 w-56 rounded-xl border p-4">
        <div className="space-y-2 text-sm">
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i}>Order line {i + 1}</p>
          ))}
        </div>
      </ScrollArea>
      <ScrollArea className="border-border w-96 rounded-xl border whitespace-nowrap">
        <div className="flex gap-3 p-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="bg-surface grid h-24 w-24 shrink-0 place-items-center rounded-lg text-xs">
              {i + 1}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ),
};

export const ResizablePanels: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="horizontal"
      className="border-border h-64 max-w-2xl rounded-xl border"
    >
      <ResizablePanel defaultSize={30}>
        <div className="grid h-full place-items-center p-4 text-sm">Filters</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <div className="grid h-full place-items-center p-4 text-sm">Results</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/**
 * Vertical still lays out correctly: react-resizable-panels v4 sets
 * `flex-flow: column` as an inline style. Note the wrapper's
 * `data-[panel-group-direction=vertical]:flex-col` class is dead — v4 renders a
 * bare `data-group`, with no orientation in any attribute — but nothing depends
 * on it, so this renders right regardless.
 */
export const ResizableVertical: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="vertical"
      className="border-border h-64 max-w-2xl rounded-xl border"
    >
      <ResizablePanel defaultSize={40}>
        <div className="grid h-full place-items-center p-4 text-sm">Preview</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <div className="grid h-full place-items-center p-4 text-sm">Details</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
