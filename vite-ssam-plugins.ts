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
    server.ws.on("vite:beforeUpdate", (data, client) => {
      client.socket.removeAllListeners();
      client.send("ssam:add");
    });

    server.ws.on("ssam:git", (data, client) => {
      const prefix = `${gray(new Date().toLocaleTimeString())} ${green(
        `[ssam]`
      )}`;

      const { filename, format } = data;

      // 1. check if "git init"ed
      execPromise(`git status --porcelain`)
        .then((value) => {
          // TODO: get datetime from ssam
          // 2. add all changes and commit
          // return execPromise(`git add . && git commit -am ${filename}`);
          return execPromise(`git add .`);
        })
        .then((value) => {
          {
            // 3. log commit message
            const msg = `${prefix} ${value}`;
            client.send("ssam:log", { msg });
            console.log(`${prefix} ${value}`);
          }

          return execPromise(`git rev-parse --short HEAD`);
        })
        .then((hash) => {
          {
            // 4. send commit hash back to ssam
            const msg = `${filename}-${(hash as string).trim()}.${format}`;
            client.send("ssam:git-success", { msg });
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
