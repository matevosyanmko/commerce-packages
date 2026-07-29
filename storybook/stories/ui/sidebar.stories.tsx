// The largest wrapper in the package — 24 exports and its own context. No
// storefront currently mounts it, which is precisely why it's worth a story:
// it's the component most likely to have rotted unnoticed.

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Headphones, Home, Package, Settings, Watch, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@gucco/ui/sidebar";

const meta: Meta = {
  title: "ui/Sidebar",
  parameters: { layout: "fullscreen" },
  // Sidebar (side/variant/collapsible), the provider (open state) and the menu
  // button (isActive/size/tooltip) are the parts with real props; the ~15 layout
  // slots are className wrappers.
  component: Sidebar,
  subcomponents: { SidebarProvider, SidebarMenuButton, SidebarMenuSkeleton },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

const NAV = [
  { label: "Overview", icon: Home, badge: null },
  { label: "Audio", icon: Headphones, badge: "3" },
  { label: "Wearables", icon: Watch, badge: "2" },
  { label: "Power", icon: Zap, badge: "3" },
  { label: "Orders", icon: Package, badge: null },
];

function Shell({ loading = false }: { loading?: boolean }) {
  return (
    // The provider owns the open/collapsed state and the CSS variables the rest
    // of the parts read, so nothing below renders correctly without it.
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarInput placeholder="Search…" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Catalog</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuSkeleton showIcon />
                      </SidebarMenuItem>
                    ))
                  : NAV.map(({ label, icon: Icon, badge }, i) => (
                      <SidebarMenuItem key={label}>
                        <SidebarMenuButton isActive={i === 0}>
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Catalog</span>
        </header>
        <div className="text-muted-foreground p-6 text-sm">
          Use the trigger to collapse the rail.
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Default: Story = { render: () => <Shell /> };

/** SidebarMenuSkeleton, for the pre-data state. */
export const Loading: Story = { render: () => <Shell loading /> };
