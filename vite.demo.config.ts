import { defineConfig } from "vite";
import { gitSnapshot } from "./vite-ssam-plugins";

export default defineConfig({
  plugins: [gitSnapshot()],
});
