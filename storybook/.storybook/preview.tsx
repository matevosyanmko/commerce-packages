import type { Preview } from "@storybook/react-vite";
import type { StorefrontConfig } from "@gucco/commerce-ui";
import { baseConfig, StoryHarness } from "../src/decorator";
import "../src/preview.css";

const preview: Preview = {
  // Every story group gets a generated Docs page with its prop table(s).
  tags: ["autodocs"],

  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },

  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: { theme: "light" },

  decorators: [
    (Story, context) => {
      // A story opts into a different injected config by setting
      // `parameters.storefrontConfig` — that's how the with/without-fallback
      // pairs render the same component under two stores.
      const config = (context.parameters.storefrontConfig as StorefrontConfig) ?? baseConfig;
      return (
        <StoryHarness config={config} dark={context.globals.theme === "dark"}>
          <Story />
        </StoryHarness>
      );
    },
  ],
};

export default preview;
