/**
 * TODO: maybe convert functions into a single class??
 * WebM Muxer: https://github.com/Vanilagy/webm-muxer/blob/main/demo/script.js
 */

import type {
  SketchStates,
  SketchSettingsInternal,
  BaseProps,
} from "../types/types";
import WebMMuxer from "webm-muxer";
import { downloadBlob } from "../helpers";

let muxer: WebMMuxer | null = null;
let videoEncoder: VideoEncoder | null = null;
let lastKeyframe: number | null = null;

export const setupWebMRecord = ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
}) => {
  if (!("VideoEncoder" in window)) {
    console.warn("The browser does not support WebCodecs");
    return;
  }

  // const { framesFormat: format } = settings;
  const format = "webm";

  muxer = new WebMMuxer({
    target: "buffer",
    video: {
      codec: "V_VP9", // TODO: check for codec support
      width: canvas.width,
      height: canvas.height,
      frameRate: settings.exportFps,
    },
  });

  videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer?.addVideoChunk(chunk, meta),
    error: (e) => console.error(`WebMMuxer error: ${e}`),
  });

  videoEncoder.configure({
    codec: "vp09.00.10.08", // TODO: look at other codecs
    width: canvas.width,
    height: canvas.height,
    bitrate: 10_000_000, // REVIEW: 1e7 = 10 Mbps (keep high. needs mp4 convert again)
  });

  lastKeyframe = -Infinity;

  canvas.style.outline = `3px solid red`;
  canvas.style.outlineOffset = `-3px`;

  console.log(`recording (${format}) started`);
};

export const exportWebM = async ({
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
  if (!("VideoEncoder" in window)) {
    return;
  }

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
  // timestamp unit is micro-seconds!!
  const frame = new VideoFrame(canvas, { timestamp: props.time * 1000 });

  // add video keyframe every 2 seconds (2000ms)
  const needsKeyframe = props.time - lastKeyframe! >= 2000;
  if (needsKeyframe) lastKeyframe = props.time;

  videoEncoder?.encode(frame, { keyFrame: needsKeyframe });
  frame.close();

  // TODO: this should be in settings, states or props
  const totalFrames = Math.floor(
    (settings.exportFps * settings.duration) / 1000
  );
  console.log(`recording (webm) frame... ${props.frame + 1} of ${totalFrames}`);
};

export const endWebMRecord = async ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
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

  canvas.style.outline = "none";
  canvas.style.outlineOffset = `0 `;

  console.log(`recording (${format}) complete`);
};
