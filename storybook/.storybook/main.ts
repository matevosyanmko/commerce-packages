import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const pkg = (name: string, sub = "") => resolve(repo, `packages/${name}/src${sub}`);

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],

  typescript: {
    // The default (`react-docgen`) doesn't expand intersected or imported prop
    // types, so a commerce component whose props are `{ product: Product }` would
    // document nothing. react-docgen-typescript resolves them properly. It's the
    // slower of the two — that cost buys the prop tables.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Which props reach the table.
      //
      // Anything declared in OUR packages is kept — that's every commerce prop,
      // and every genuinely custom prop on a ui wrapper. Anything inherited from
      // a dependency is dropped, because a `ui/` wrapper spreads `...props` into
      // a Radix primitive and would otherwise list 60+ HTML and Radix attributes
      // that say nothing about the wrapper.
      //
      // The exception is class-variance-authority: `variant` and `size` arrive
      // through `VariantProps<typeof buttonVariants>`, so they'd be filtered as
      // node_modules props — and they're exactly the ones worth showing.
      propFilter: (prop: { parent?: { fileName?: string } }) => {
        const from = prop.parent?.fileName ?? "";
        if (!from.includes("node_modules")) return true;
        return from.includes("class-variance-authority");
      },
    },
  },

  async viteFinal(cfg) {
    cfg.plugins = [
      ...(cfg.plugins ?? []),
      tailwindcss(),
      {
        // The aliases below resolve the packages from outside this workspace, and
        // vite's watcher only covers its own root — so without this the modules
        // load fine but never HMR: you edit a component, the page doesn't change,
        // and it looks exactly like the dist-staleness problem the aliases exist
        // to avoid. Tailwind rescans regardless (it watches its own @source
        // globs), which makes the half-working state especially confusing.
        name: "storefront:watch-package-sources",
        configureServer(server) {
          server.watcher.add(resolve(repo, "packages"));
        },
      },
    ];

    cfg.resolve = {
      ...cfg.resolve,
      // Resolve the packages from SOURCE, not dist. Without this every component
      // edit needs `bun run build` before a story reflects it — the same papercut
      // stores hit, and the reason a change can look like it did nothing.
      // Subpaths are listed first: vite takes the first matching alias, so
      // `@gucco/ui/utils` must be tried before the bare `@gucco/ui`.
      alias: [
        { find: /^@storefront\/ui\/(.*)$/, replacement: pkg("ui", "/$1") },
        { find: /^@storefront\/ui$/, replacement: pkg("ui", "/index.ts") },
        { find: /^@storefront\/commerce-ui\/(.*)$/, replacement: pkg("commerce-ui", "/$1") },
        { find: /^@storefront\/commerce-ui$/, replacement: pkg("commerce-ui", "/index.ts") },
        { find: /^@storefront\/commerce-core\/(.*)$/, replacement: pkg("commerce-core", "/$1") },
        { find: /^@storefront\/commerce-core$/, replacement: pkg("commerce-core", "/index.ts") },
      ],
      // The dual-React trap from CLAUDE.md, in a new form: the packages are
      // symlinked workspaces, so without this they can resolve their own copy of
      // react and every Radix component throws "Invalid hook call". The router
      // and sonner are here for the same singleton reason.
      dedupe: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "sonner",
        "lucide-react",
      ],
    };

    return cfg;
  },
};

export default config;
