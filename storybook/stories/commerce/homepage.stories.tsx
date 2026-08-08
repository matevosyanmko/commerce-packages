// The homepage renderer and its parts.
//
// `HomepageSections` takes an ordered list and dispatches on `type`. Three
// behaviours are worth proving and have no other coverage: order is the admin's,
// an unknown type renders nothing rather than throwing, and `[]` is a valid
// homepage.

import type { Meta, StoryObj } from "@storybook/react-vite";
import type { HomepageSection } from "@wm-storefront/commerce-core";
import { HeroCarousel, HomepageSections, SectionHeading, ShopByRoom } from "@wm-storefront/commerce-ui";
import { SECTIONS, SLIDES, TILES } from "../../src/homepage";

const meta: Meta = {
  title: "commerce/Homepage",
  parameters: { layout: "fullscreen" },
  component: HomepageSections,
  subcomponents: { HeroCarousel, ShopByRoom, SectionHeading },
};
export default meta;
// Loose args: these files group several components, so a story's args are not
// the meta component's props.
type Story = StoryObj;

/** Rotates on a timer, and respects prefers-reduced-motion. */
export const Hero: Story = {
  render: () => <HeroCarousel slides={SLIDES} />,
};

/** One slide — the dots and rotation should both be absent. */
export const HeroSingleSlide: Story = {
  render: () => <HeroCarousel slides={[SLIDES[0]]} />,
};

/** A slide whose image the admin never uploaded falls back to a catalog shot. */
export const HeroWithFallbackImage: Story = {
  render: () => (
    <HeroCarousel
      slides={[{ ...SLIDES[0], image: "" }]}
      fallbackImage="shape:nimbus-speaker:2"
    />
  ),
};

export const Rooms: Story = {
  render: () => <ShopByRoom heading="Shop by category" tiles={TILES} />,
};

export const Headings: Story = {
  render: () => (
    <div className="container-page space-y-12 py-10">
      <SectionHeading eyebrow="New in" title="Recently arrived" />
      <SectionHeading
        eyebrow="Picked for you"
        title="Featured gadgets"
        cta={{ label: "View all", to: "/store" }}
      />
      <SectionHeading eyebrow="Why us" title="Built to last" center />
    </div>
  ),
};

/** Every section type the contract defines, in one page. */
export const AllSections: Story = {
  render: () => <HomepageSections sections={SECTIONS} />,
};

/** The admin's array order is the render order — here it's reversed. */
export const ReorderedByAdmin: Story = {
  render: () => <HomepageSections sections={[...SECTIONS].reverse()} />,
};

/** An empty list is a valid homepage, not an error. */
export const NoSections: Story = {
  render: () => (
    <div className="container-page py-16">
      <HomepageSections sections={[]} />
      <p className="text-muted-foreground text-sm">
        Nothing above this line — `sections: []` renders nothing at all.
      </p>
    </div>
  ),
};

/**
 * A type this build doesn't know renders nothing and leaves the rest intact —
 * the property that lets the backend ship a new section before the storefront
 * learns to render it.
 */
export const UnknownSectionType: Story = {
  render: () => (
    <div>
      <HomepageSections
        sections={[
          SECTIONS[0],
          { id: "s_future", type: "spinning_carousel_3d" } as unknown as HomepageSection,
          SECTIONS[3],
        ]}
      />
      <p className="text-muted-foreground container-page py-8 text-sm">
        Hero and “why choose us” rendered; the unknown section between them did not.
      </p>
    </div>
  ),
};
