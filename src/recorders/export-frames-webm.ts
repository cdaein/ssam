/**
 * TODO: maybe convert functions into a single class??
 * WebM Muxer: https://github.com/Vanilagy/webm-muxer/blob/main/demo/script.js
 */

import type {
  SketchSettingsInternal,
  BaseProps,
  SketchStates,
  FramesFormatObj,
} from "../types/types";
import { ArrayBufferTarget, Muxer } from "webm-muxer";
import { downloadBlob, isObject } from "../helpers";

let muxer: Muxer<ArrayBufferTarget> | null = null;
let videoEncoder: VideoEncoder | null = null;
let lastKeyframe: number | null = null;

export const setupWebMRecord = ({
  settings,
  props,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps<"2d" | "webgl" | "webgl2">;
}) => {
  if (!("VideoEncoder" in window)) {
    console.warn("The browser does not support WebCodecs");
    return;
  }

  const framesFormat = settings.framesFormat[0] as FramesFormatObj<"webm">;
  const format = "webm";

  // default values
  // TODO: support more codecs
  const codecStrings: ["V_VP9", string] = ["V_VP9", "vp09.00.10.08"];
  if (isObject(framesFormat)) {
    codecStrings[0] = framesFormat.codecStrings[0];
    codecStrings[1] = framesFormat.codecStrings[1];
  }

  // TODO: output dimensions must be multiples of 2.
  //       how to crop canvas for recording?
  //       webm still plays, but it can't be converted to mp4
  muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: codecStrings[0],
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
    codec: codecStrings[1],
    width: props.canvas.width,
    height: props.canvas.height,
    bitrate: 10_000_000, // 1e7 = 10 Mbps (keep high. needs mp4 convert again)
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
  props: BaseProps<"2d" | "webgl" | "webgl2">;
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
  props: BaseProps<"2d" | "webgl" | "webgl2">;
}) => {
  // NOTE: timestamp unit is in micro-seconds!!
  const frame = new VideoFrame(canvas, {
    timestamp: props.time * 1e3 + props.duration * props.loopCount * 1e3,
    // duration: 1e6 / props.exportFps, // this ensures the last frame duration & correct fps
    // duration: props.deltaTime * 1e3, // keep it as a fallback option just in case
  });

  // add video keyframe every 2 seconds (2000ms)
  const needsKeyframe = props.time - lastKeyframe! >= 2000;
  if (needsKeyframe) lastKeyframe = props.time;

  videoEncoder?.encode(frame, { keyFrame: needsKeyframe });
  frame.close();

  console.log(
    `recording (webm) frame... ${states.recordedFrames + 1} of ${
      settings.exportTotalFrames
    }`,
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
  muxer?.finalize();

  const { buffer } = muxer?.target as ArrayBufferTarget; // Buffer contains final WebM

  downloadBlob(new Blob([buffer!], { type: "video/webm" }), settings, format);

  muxer = null;
  videoEncoder = null;

  console.log(`recording (${format}) complete`);
};
