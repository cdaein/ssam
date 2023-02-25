import { defineConfig } from "vite";
import { ssamExport } from "vite-plugin-ssam-export";
import { ssamFfmpeg } from "vite-plugin-ssam-ffmpeg";

export default defineConfig({
  plugins: [ssamFfmpeg(), ssamExport()],
});
