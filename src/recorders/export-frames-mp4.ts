/**
 * mp4 recording will only work when
 * 1. dev mode (import.meta.hot)
 * 2. ffmpeg is available on local machine
 */

import { formatFilename } from "../helpers";
import type { SketchSettingsInternal, BaseProps } from "../types/types";

export const setupMp4Record = ({
  settings,
}: {
  settings: SketchSettingsInternal;
}) => {
  if (import.meta.hot) {
    const { filename, prefix, suffix } = settings;

    import.meta.hot.send("ssam:ffmpeg", {
      filename: formatFilename({ filename, prefix, suffix }),
      format: "mp4",
      fps: settings.exportFps,
      totalFrames: settings.exportTotalFrames,
    });
  } else {
    console.warn(`mp4 recording is only availabe in dev environment`);
    return;
  }
};

export const exportMp4 = async ({
  canvas,
  settings,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  encodeVideoFrame({ canvas, settings, props });
};

export const encodeVideoFrame = ({
  canvas,
  settings,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  if (import.meta.hot) {
    const msg = `recording (mp4) frame... ${props.frame} of ${settings.exportTotalFrames}`;
    import.meta.hot.send("ssam:ffmpeg-newframe", {
      image: canvas.toDataURL(),
      msg,
    });
  }
};

export const endMp4Record = async () => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  if (import.meta.hot) {
    const format = "mp4";

    const msg = `recording (${format}) complete`;
    import.meta.hot.send("ssam:ffmpeg-done", {
      msg,
    });
  }
};
