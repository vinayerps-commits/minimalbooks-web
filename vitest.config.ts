import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

// Default environment is "node" -- core/ and io/ are DOM-free by design and
// make up the bulk of the test suite. A handful of ui/ component tests opt
// into jsdom individually via a `// @vitest-environment jsdom` docblock at
// the top of the test file, rather than paying jsdom's overhead globally.
export default defineConfig({
  plugins: [preact()],
  test: {
    environment: "node",
  },
});
