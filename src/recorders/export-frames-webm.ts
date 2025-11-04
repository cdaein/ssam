/**
 * TODO: maybe convert functions into a single class??
 * WebM Muxer: https://github.com/Vanilagy/webm-muxer/blob/main/demo/script.js
 */

import {
  BufferTarget,
  CanvasSource,
  Output,
  WebMOutputFormat,
} from "mediabunny";
import { downloadBlob, isObject } from "../helpers";
import type {
  BaseProps,
  FramesFormatObj,
  SketchMode,
  SketchSettingsInternal,
  SketchStates,
} from "../types/types";

let output: Output<WebMOutputFormat, BufferTarget> | null = null;
let canvasSource: CanvasSource | null = null;

let lastKeyframe = -Infinity;

export const setupWebMRecord = async <Mode extends SketchMode>({
  settings,
  props,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps<Mode>;
}) => {
  if (!("VideoEncoder" in window)) {
    console.warn("The browser does not support WebCodecs");
    return;
  }

  const framesFormat = settings.framesFormat[0] as FramesFormatObj<"webm">;
  const format = "webm";

  // default values
  const codecStrings: ["vp8" | "vp9" | "av1", string] = [
    "vp9",
    "vp09.00.10.08",
  ];
  // const codecStrings: ["V_VP9", string] = ["V_VP9", "vp09.00.10.08"];
  if (isObject(framesFormat)) {
    codecStrings[0] = framesFormat.codecStrings[0];
    codecStrings[1] = framesFormat.codecStrings[1];
  }

  output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  });

  canvasSource = new CanvasSource(props.canvas, {
    codec: codecStrings[0],
    fullCodecString: codecStrings[1],
    // fullCodecString: "av01.0.05M.10", // supports 4k but can't play on M1 Mac (no hardware decoder) :(
    bitrate: 1e7, // 1e7 = 10 Mbps
  });

  output.addVideoTrack(canvasSource, {
    frameRate: settings.exportFps,
  });

  // after adding all tracks, start output
  await output.start();

  lastKeyframe = -Infinity;

  console.log(`recording (${format}) started`);
};

export const encodeWebM = async <Mode extends SketchMode>({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps<Mode>;
}) => {
  if (!("VideoEncoder" in window)) {
    return;
  }

  // record frame
  encodeVideoFrame({ canvas, settings, states, props });
};

export const encodeVideoFrame = async <Mode extends SketchMode>({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps<Mode>;
}) => {
  const timestampInSecounds =
    (props.time + props.duration * props.loopCount) / 1e3;
  const durationInSeconds = 1 / props.exportFps; // this ensures the last frame duration & correct fps
  // const duration = props.deltaTime * 1e3 // keep it as a fallback option just in case

  // add video keyframe every 2 seconds (2000ms)
  const needsKeyframe = props.time - lastKeyframe >= 500;
  if (needsKeyframe) lastKeyframe = props.time;

  await canvasSource?.add(timestampInSecounds, durationInSeconds, {
    keyFrame: needsKeyframe,
  }); // Timestamp, duration (in seconds)

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

  const format = "webm";

  await output?.finalize(); // Resolves once the output is finalized

  // buffer contains final webm
  const buffer = output?.target.buffer; // => Uint8Array

  if (buffer) {
    downloadBlob(new Blob([buffer], { type: "video/webm" }), settings, format);
  }

  output = null;
  canvasSource = null;

  console.log(`recording (${format}) complete`);
};
