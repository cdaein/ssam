/**
 * TODO: maybe convert functions into a single class??
 * WebM Muxer: https://github.com/Vanilagy/webm-muxer/blob/main/demo/script.js
 */

import type {
  SketchSettingsInternal,
  BaseProps,
  SketchStates,
} from "../types/types";
import WebMMuxer from "webm-muxer";
import { downloadBlob } from "../helpers";

let muxer: WebMMuxer | null = null;
let videoEncoder: VideoEncoder | null = null;
let lastKeyframe: number | null = null;

export const setupWebMRecord = ({
  settings,
  props,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  if (!("VideoEncoder" in window)) {
    console.warn("The browser does not support WebCodecs");
    return;
  }

  // const { framesFormat: format } = settings;
  const format = "webm";

  // TODO: output dimensions must be multiples of 2.
  //       how to crop canvas for recording?
  //       webm still plays, but it can't be converted to mp4
  muxer = new WebMMuxer({
    target: "buffer",
    video: {
      codec: "V_VP9", // TODO: check for codec support
      width: props.canvas.width,
      height: props.canvas.height,
      frameRate: settings.exportFps,
    },
  });

  videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer?.addVideoChunk(chunk, meta!),
    error: (e) => console.error(`WebMMuxer error: ${e}`),
  });

  videoEncoder.configure({
    codec: "vp09.00.10.08", // TODO: look at other codecs
    width: props.canvas.width,
    height: props.canvas.height,
    bitrate: 10_000_000, // REVIEW: 1e7 = 10 Mbps (keep high. needs mp4 convert again)
  });

  lastKeyframe = -Infinity;

  console.log(`recording (${format}) started`);
};

export const encodeWebM = async ({
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
  if (!("VideoEncoder" in window)) {
    return;
  }

  // record frame
  encodeVideoFrame({ canvas, settings, states, props });
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
  // NOTE: timestamp unit is micro-seconds!!
  const frame = new VideoFrame(canvas, {
    timestamp: props.time * 1000 + props.loopCount * 1000 * 1000,
  });

  // add video keyframe every 2 seconds (2000ms)
  const needsKeyframe = props.time - lastKeyframe! >= 2000;
  if (needsKeyframe) lastKeyframe = props.time;

  videoEncoder?.encode(frame, { keyFrame: needsKeyframe });
  frame.close();

  console.log(
    `recording (webm) frame... ${states.recordedFrames} of ${settings.exportTotalFrames}`
  );
};

export const endWebMRecord = async ({
  settings,
}: {
  settings: SketchSettingsInternal;
}) => {
  if (!("VideoEncoder" in window)) {
    return;
  }

  // const { framesFormat: format } = settings;
  const format = "webm";

  await videoEncoder?.flush();
  const buffer = muxer?.finalize();

  downloadBlob(new Blob([buffer!], { type: "video/webm" }), settings, format);

  muxer = null;
  videoEncoder = null;

  console.log(`recording (${format}) complete`);
};
