import { defineConfig } from "vite";
import { ssamGit } from "vite-plugin-ssam-git";
import { ssamFfmpeg } from "vite-plugin-ssam-ffmpeg";

export default defineConfig({
  plugins: [ssamGit(), ssamFfmpeg()],
});
