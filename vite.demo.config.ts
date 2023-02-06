import { defineConfig } from "vite";
import type { ViteDevServer } from "vite";
import { exec } from "child_process";

const gitSnapshot = () => ({
  name: "git-snapshot",
  configureServer(server: ViteDevServer) {
    server.ws.on("ssam:snapshot", (data, client) => {
      console.log("git commit snapshot request received", data);

      // TODO: should come from ssam with { filename, prefix, ... }
      const commitMessage = Math.floor(Math.random() * 10000);

      exec(
        `git add . && git commit -m ${commitMessage}`,
        (err, stdout, stderr) => {
          console.log(stdout);
        }
      );
    });
  },
});

export default defineConfig({
  plugins: [gitSnapshot()],
});
