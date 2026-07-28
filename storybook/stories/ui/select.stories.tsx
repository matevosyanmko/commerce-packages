// Radix popper positioning. Like Dialog this portals, but it also measures the
// trigger to place the panel — a component that silently breaks when the
// harness gives it an unusual containing block.

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@storefront/ui/select";

const meta: Meta = {
  title: "ui/Select",
  component: SelectTrigger,
  subcomponents: { SelectContent, SelectItem, SelectLabel, SelectSeparator },
  parameters: { layout: "centered" },
};

export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select defaultValue="featured">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured">Featured</SelectItem>
        <SelectItem value="price-asc">Price: low to high</SelectItem>
        <SelectItem value="price-desc">Price: high to low</SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Choose a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Listening</SelectLabel>
          <SelectItem value="audio">Audio</SelectItem>
          <SelectItem value="wearables">Wearables</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Workspace</SelectLabel>
          <SelectItem value="desk">Desk</SelectItem>
          <SelectItem value="power">Power</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
