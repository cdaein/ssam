import { defineConfig } from "vite";
import { gitSnapshot } from "./vite-plugin-ssam-git";

export default defineConfig({
  plugins: [gitSnapshot()],
});
