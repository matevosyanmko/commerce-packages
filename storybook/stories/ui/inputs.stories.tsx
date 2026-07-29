// Form controls. Each is uncontrolled here except where the component only
// makes sense with state — the point is the rendered states, not the wiring.

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { Checkbox } from "@gucco/ui/checkbox";
import { Input } from "@gucco/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@gucco/ui/input-otp";
import { Label } from "@gucco/ui/label";
import { RadioGroup, RadioGroupItem, RadioGroupPill } from "@gucco/ui/radio-group";
import { Slider } from "@gucco/ui/slider";
import { Switch } from "@gucco/ui/switch";
import { Textarea } from "@gucco/ui/textarea";
import { Toggle } from "@gucco/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@gucco/ui/toggle-group";

// Toggle leads because it's the one with variants. Input, Textarea, Checkbox,
// Switch, Slider and the OTP parts pass everything straight through to Radix, so
// they have no props of their own to tabulate.
const meta: Meta = {
  title: "ui/Inputs",
  component: Toggle,
  subcomponents: { ToggleGroup, ToggleGroupItem, RadioGroupPill, Label },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

export const TextInputs: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="s-email">Email</Label>
        <Input id="s-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-disabled">Disabled</Label>
        <Input id="s-disabled" disabled placeholder="Not editable" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-note">Delivery note</Label>
        <Textarea id="s-note" rows={4} placeholder="Leave it with a neighbour…" />
      </div>
    </div>
  ),
};

export const Checkboxes: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="c1" />
        <Label htmlFor="c1">In stock only</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="c2" defaultChecked />
        <Label htmlFor="c2">On sale</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="c3" disabled />
        <Label htmlFor="c3">Unavailable filter</Label>
      </div>
    </div>
  ),
};

export const Switches: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch id="w1" />
        <Label htmlFor="w1">Off</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="w2" defaultChecked />
        <Label htmlFor="w2">On</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="w3" disabled />
        <Label htmlFor="w3">Disabled</Label>
      </div>
    </div>
  ),
};

export const Sliders: Story = {
  render: function Render() {
    const [range, setRange] = useState([40, 260]);
    return (
      <div className="max-w-md space-y-8">
        <Slider defaultValue={[50]} max={100} step={1} />
        <div>
          <Slider value={range} onValueChange={setRange} min={0} max={450} step={5} />
          <p className="text-muted-foreground mt-3 text-sm">
            €{range[0]} – €{range[1]}
          </p>
        </div>
      </div>
    );
  },
};

export const Radios: Story = {
  render: () => (
    <div className="space-y-8">
      <RadioGroup defaultValue="std" className="space-y-2">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="std" id="r1" />
          <Label htmlFor="r1">Standard — €5</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="exp" id="r2" />
          <Label htmlFor="r2">Express — €12</Label>
        </div>
      </RadioGroup>

      {/* The pill variant is what VariantPicker renders for product options. */}
      <RadioGroup defaultValue="Black" className="flex flex-row flex-wrap gap-2">
        {["Black", "Ivory", "Slate", "Moss"].map((v) => (
          <RadioGroupPill key={v} value={v}>
            {v}
          </RadioGroupPill>
        ))}
      </RadioGroup>
    </div>
  ),
};

export const Toggles: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Toggle aria-label="Bold">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle aria-label="Italic" defaultPressed>
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle aria-label="Underline" disabled>
          <Underline className="h-4 w-4" />
        </Toggle>
      </div>
      <ToggleGroup type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

/** Order-confirmation style code entry. */
export const OneTimeCode: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};
