// The heaviest wrapper in the package — it pulls recharts. Worth a story for two
// reasons: it proves the dependency actually loads under the harness, and it's
// the one component whose weight makes the subpath-import discipline matter.
//
// `--chart-1`…`--chart-5` come from the harness skin, so this also checks that
// the full token contract is defined, not just the shadcn subset.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@gucco/ui/chart";

const data = [
  { month: "Jan", audio: 186, desk: 80 },
  { month: "Feb", audio: 305, desk: 200 },
  { month: "Mar", audio: 237, desk: 120 },
  { month: "Apr", audio: 273, desk: 190 },
  { month: "May", audio: 209, desk: 130 },
  { month: "Jun", audio: 314, desk: 240 },
];

const config = {
  audio: { label: "Audio", color: "var(--chart-1)" },
  desk: { label: "Desk", color: "var(--chart-2)" },
} satisfies ChartConfig;

const meta = {
  title: "ui/Chart",
  component: ChartContainer,
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bars: Story = {
  args: { config, children: <div /> },
  render: () => (
    <ChartContainer config={config} className="min-h-[280px] w-full max-w-2xl">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="audio" fill="var(--color-audio)" radius={4} />
        <Bar dataKey="desk" fill="var(--color-desk)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
