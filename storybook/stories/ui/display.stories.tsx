// Static display primitives. Grouped into one file because none of them holds
// state or opens anything — a story each would be nine files of one line.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@gucco/ui/alert";
import { AspectRatio } from "@gucco/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@gucco/ui/avatar";
import { Badge } from "@gucco/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gucco/ui/card";
import { Label } from "@gucco/ui/label";
import { Progress } from "@gucco/ui/progress";
import { Separator } from "@gucco/ui/separator";
import { Skeleton } from "@gucco/ui/skeleton";

// `subcomponents` gives the Docs page one prop table per component.
//
// Only the parts that declare their OWN props are listed. The tab strip fits
// about six, and the rest of this file's components (Card, Avatar, Progress,
// Separator, Skeleton, AspectRatio) are pure className wrappers with nothing of
// their own to document — their table would be empty. That's the "key props or
// custom, not every shadcn prop" rule applied to which tables exist at all.
const meta: Meta = {
  title: "ui/Display",
  component: Alert,
  subcomponents: { Badge, Label },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <div className="max-w-lg space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Order received</AlertTitle>
        <AlertDescription>We'll email a confirmation shortly.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Payment declined</AlertTitle>
        <AlertDescription>Check the card details and try again.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Sold out</Badge>
    </div>
  ),
};

export const Cards: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Aurora Headphones</CardTitle>
        <CardDescription>Over-ear, active noise cancellation.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Forty hours of battery and multipoint pairing.
      </CardContent>
      <CardFooter className="text-sm font-medium">€279</CardFooter>
    </Card>
  ),
};

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%236b7280'/%3E%3C/svg%3E" />
        <AvatarFallback>GW</AvatarFallback>
      </Avatar>
      {/* Broken src on purpose — this is the fallback path. */}
      <Avatar>
        <AvatarImage src="/does-not-exist.png" />
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Ratio: Story = {
  render: () => (
    <div className="w-72">
      <AspectRatio ratio={4 / 5} className="bg-surface grid place-items-center rounded-xl">
        <span className="text-muted-foreground text-sm">4 / 5</span>
      </AspectRatio>
    </div>
  ),
};

export const Progression: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <Progress value={0} />
      <Progress value={35} />
      <Progress value={100} />
    </div>
  ),
};

export const Separators: Story = {
  render: () => (
    <div className="max-w-md">
      <p className="text-sm">Subtotal</p>
      <Separator className="my-3" />
      <p className="text-sm">Shipping</p>
      <div className="mt-4 flex h-10 items-center gap-3">
        <span className="text-sm">Left</span>
        <Separator orientation="vertical" />
        <span className="text-sm">Right</span>
      </div>
    </div>
  ),
};

/** What a product card looks like before its data lands. */
export const Skeletons: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  ),
};

export const Labels: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="demo-email">Email address</Label>
      <p className="text-muted-foreground text-xs">Rendered above the input it names.</p>
    </div>
  ),
};
