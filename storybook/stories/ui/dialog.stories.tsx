// Proves a Radix PORTAL renders correctly from inside the decorator stack.
// Portalled content escapes the story's DOM subtree, so if the theme variables
// were scoped to the harness wrapper rather than inherited, this is the story
// that would show it — an unstyled dialog on a styled page.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@gucco/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gucco/ui/dialog";

const meta: Meta = {
  title: "ui/Dialog",
  // Dialog itself is a re-exported Radix root; the wrapped parts are below.
  component: DialogContent,
  subcomponents: { DialogHeader, DialogFooter, DialogTitle, DialogDescription },
  parameters: { layout: "centered" },
};

export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this item?</DialogTitle>
          <DialogDescription>
            It will be taken out of your basket. You can always add it again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Keep it</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Remove</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Focus trap check</DialogTitle>
          <DialogDescription>
            Tab should cycle inside this dialog and Escape should close it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
