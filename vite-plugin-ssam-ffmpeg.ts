/**
 * git commit snapshot
 *
 * - ssam: CMD+K
 *   - sends a ssam:snapshot message to Vite.
 *   - include { filename, prefix, suffix, format }
 * - vite:
 *   - receive the message
 *   - check if git is already init'ed
 *     - if not, send message to ssam with error (console log it in both places)
 *   - git add . && git commit with { date }
 *   - get commit hash
 *   - send back success message and { hash } to ssam
 * - ssam:
 *   - if commit success, exportFrame and log message
 */

import { ViteDevServer } from "vite";
import ffmpeg from "ffmpeg.js";

export const ffmpegExport = () => ({
  name: "ffmpeg-export",
  configureServer(server: ViteDevServer) {
    server.ws.on("ssam:ffmpeg", (data) => {
      console.log(data);

      ffmpeg({
        arguments: ["-version"],
      });
    });
  },
});
