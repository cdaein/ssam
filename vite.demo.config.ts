import { defineConfig } from "vite";
import { ssamGit } from "vite-plugin-ssam-git";

export default defineConfig({
  plugins: [ssamGit()],
});
