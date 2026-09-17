import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// base: './' -- so the built dist/ folder works served from a GitHub Pages
// project subpath (e.g. https://<user>.github.io/minimalbooks-web/) rather
// than only from a domain root.
export default defineConfig({
  base: "./",
  plugins: [preact()],
  server: {
    open: true,
  },
});
