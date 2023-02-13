/**
 * git commit snapshot
 *
 * - ssam: CMD+K
 *   - sends a ssam:git message to Vite dev server.
 *   - include { canvasId, filename }
 * - vite: receive the message
 *   - check if git is already init'ed
 *     - if not, send message to ssam with error (console log it in both places)
 *   - git add . && git commit with { filename }
 *   - get commit hash
 *   - send back success message and { canvasId, hash } to ssam
 * - ssam:
 *   - if commit success, exportFrame and log message
 */

import { ViteDevServer } from "vite";

import { exec } from "child_process";
import kleur from "kleur";

const { gray, green, yellow } = kleur;

const execPromise = (cmd: string) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

export const gitSnapshot = () => ({
  name: "git-snapshot",
  configureServer(server: ViteDevServer) {
    server.ws.on("ssam:git", (data, client) => {
      const prefix = `${gray(new Date().toLocaleTimeString())} ${green(
        `[ssam]`
      )}`;

      const { canvasId, filename, format } = data;

      // TODO: depending on the format received, export png or webm

      // 1. check if "git init"ed
      execPromise(`git status --porcelain`)
        .then((value) => {
          // REVIEW: can commit message contain its own hash?
          // 2. add all changes and commit
          return execPromise(`git add . && git commit -am ${filename}`);
        })
        .then((value) => {
          {
            // 3. log git commit message
            const msg = `${prefix} ${value}`;
            client.send("ssam:log", { msg });
            console.log(`${prefix} ${value}`);
          }

          return execPromise(`git rev-parse --short HEAD`);
        })
        .then((hash) => {
          {
            // 4. send commit hash back to ssam
            client.send("ssam:git-success", {
              canvasId,
              hash: (hash as string).trim(),
            });
          }
        })
        .catch((err) => {
          if (!err) {
            // err is empty so create a custom one
            // REVIEW: empty check is enough? or look at "git diff" length?
            const msg = `${prefix} nothing to commit, working tree clean`;
            client.send("ssam:warn", { msg });
            console.warn(`${msg}`);
          } else {
            const msg = `${prefix} ${err}`;
            client.send("ssam:warn", { msg });
            console.error(`${prefix} ${yellow(`${err}`)}`);
          }
        });
    });
  },
});
