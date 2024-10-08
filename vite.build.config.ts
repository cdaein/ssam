// for library build

import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    target: "esnext",
    lib: {
      name: "ssam",
      fileName: "index",
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      external: ["p5"],
      output: [
        {
          format: "es",
          dir: "dist/static",
          entryFileNames: "index.js",
        },
      ],
    },
  },
});
