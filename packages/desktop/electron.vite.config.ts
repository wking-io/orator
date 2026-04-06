import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "electron-vite";
import { type Plugin, transformWithEsbuild } from "vite";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function vitePluginRemix(): Plugin {
  return {
    name: "vite-plugin-remix",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith(".tsx")) {
        return transformWithEsbuild(code, id, {
          loader: "tsx",
          jsx: "automatic",
          jsxImportSource: "@remix-run/component",
        });
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    main: {
      build: {
        externalizeDeps: true,
        outDir: "dist/main",
        rollupOptions: {
          input: {
            index: "src/main/index.ts",
          },
        },
      },
    },
    preload: {
      build: {
        externalizeDeps: true,
        outDir: "dist/preload",
        rollupOptions: {
          input: {
            index: "src/preload/index.ts",
          },
          output: {
            format: "cjs",
            entryFileNames: "[name].cjs",
          },
        },
      },
    },
    renderer: {
      root: ".",
      plugins: [vitePluginRemix(), tailwindcss()],
      server: {
        watch: {
          paths: [resolve(repoRoot, "packages")],
        },
      },
      build: {
        outDir: "dist/renderer",
        rollupOptions: {
          input: {
            index: "index.html",
          },
        },
      },
      resolve: {
        alias: {
          "@ui": resolve(repoRoot, "packages/ui/src"),
          "@utils": resolve(repoRoot, "packages/utils/src"),
          "@core": resolve(repoRoot, "packages/core/src"),
          "unicornstudio/dist/unicornStudio.umd.js": resolve(
            repoRoot,
            "packages/ui/node_modules/unicornstudio/dist/unicornStudio.umd.js",
          ),
        },
      },
    },
  };
});
