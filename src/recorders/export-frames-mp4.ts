/**
 * mp4 recording will only work when
 * 1. dev mode (import.meta.hot)
 * 2. ffmpeg is available on local machine
 */

import { formatFilename } from "../helpers";
import type { SketchSettingsInternal } from "../types/types";

export const setupMp4Record = ({
  settings,
}: {
  settings: SketchSettingsInternal;
}) => {
  if (import.meta.hot) {
    const {
      filename,
      prefix,
      suffix,
      exportFps,
      dimensions,
      exportTotalFrames,
    } = settings;

    // TODO: this is repeated in other places. refactor it.
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (dimensions) {
      width = dimensions[0];
      height = dimensions[1];
    }

    import.meta.hot.send("ssam:ffmpeg", {
      fps: exportFps,
      width,
      height,
      totalFrames: exportTotalFrames,
      filename: formatFilename({ filename, prefix, suffix }),
      format: "mp4",
    });
  } else {
    console.warn(`mp4 recording is only availabe in dev environment`);
    return;
  }
};

export const exportMp4 = async ({ canvas }: { canvas: HTMLCanvasElement }) => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  if (import.meta.hot) {
    import.meta.hot.send("ssam:ffmpeg-newframe", {
      image: canvas.toDataURL(),
    });
  }
};

export const endMp4Record = async () => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  if (import.meta.hot) {
    import.meta.hot.send("ssam:ffmpeg-done");
  }
};
