/**
 * mp4 recording will only work when
 * 1. dev mode (import.meta.hot)
 * 2. ffmpeg is available on local machine
 */

import { formatFilename } from "../helpers";
import type { BaseProps, SketchSettingsInternal } from "../types/types";

export const setupMp4Record = ({
  settings,
  props,
  hash,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps;
  hash?: string;
}) => {
  if (import.meta.hot) {
    const {
      filename,
      prefix,
      suffix,
      exportFps,
      dimensions,
      pixelRatio,
      exportTotalFrames,
    } = settings;

    // NOTES: this is fixed by using props.canvas.width. delete after some real use. (Feb.16,2024)
    // let width = window.innerWidth;
    // let height = window.innerHeight;
    // if (dimensions) {
    //   [width, height] = dimensions;
    // }

    import.meta.hot.send("ssam:ffmpeg", {
      fps: exportFps,
      width: props.canvas.width, // this already takes into account pixelRatio
      height: props.canvas.height,
      totalFrames: exportTotalFrames,
      filename: formatFilename({
        filename,
        prefix,
        suffix: hash ? `${suffix}-${hash}` : suffix,
      }),
      format: "mp4",
    });
  } else {
    console.warn(`mp4 export is only availabe in dev environment`);
    return;
  }
};

export const encodeMp4 = async ({ canvas }: { canvas: HTMLCanvasElement }) => {
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
