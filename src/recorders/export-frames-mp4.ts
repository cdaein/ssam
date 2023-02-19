/**
 * mp4 recording will only work when
 * 1. dev mode (import.meta.hot)
 * 2. ffmpeg is available on local machine
 */

import { formatFilename } from "../helpers";
import type {
  SketchStates,
  SketchSettingsInternal,
  BaseProps,
} from "../types/types";

export const setupMp4Record = ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
}) => {
  if (import.meta.hot) {
    const { filename, prefix, suffix } = settings;
    const format = "mp4";

    import.meta.hot.send("ssam:ffmpeg", {
      filename: formatFilename({ filename, prefix, suffix }),
      format,
      fps: settings.exportFps,
    });

    canvas.style.outline = `3px solid red`;
    canvas.style.outlineOffset = `-3px`;
  } else {
    console.warn(`mp4 recording is only availabe on dev environment`);
    return;
  }
};

export const exportMp4 = async ({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  states: SketchStates;
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  // TODO: use promise(await) to make sure it's okay to move to next frame

  if (!states.captureDone) {
    // record frame
    encodeVideoFrame({ canvas, settings, states, props });
  }
};

export const encodeVideoFrame = ({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps;
}) => {
  if (import.meta.hot) {
    // TODO: this should be in settings, states or props
    const totalFrames = Math.floor(
      (settings.exportFps * settings.duration) / 1000
    );
    const msg = `recording (mp4) frame... ${props.frame + 1} of ${totalFrames}`;
    import.meta.hot.send("ssam:ffmpeg-newframe", {
      image: canvas.toDataURL(),
      msg,
    });
  }
};

export const endMp4Record = async ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
}) => {
  // if (!("VideoEncoder" in window)) {
  //   return;
  // }

  if (import.meta.hot) {
    const format = "mp4";

    canvas.style.outline = "none";
    canvas.style.outlineOffset = `0 `;

    const msg = `recording (${format}) complete`;
    // console.log(msg);
    import.meta.hot.send("ssam:ffmpeg-done", {
      msg,
    });
  }
};
