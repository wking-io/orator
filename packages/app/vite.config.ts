import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, transformWithEsbuild } from "vite";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)));

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

export default defineConfig({
  plugins: [vitePluginRemix(), tailwindcss()],
  resolve: {
    alias: {
      "@app": resolve(appRoot, "src"),
      "@ui": "@orator/ui/src",
      "@utils": "@orator/utils/src",
      "@core": "@orator/core/src",
    },
  },
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["@remix-run/component", "@remix-run/interaction", "effect"],
    },
  },
});
