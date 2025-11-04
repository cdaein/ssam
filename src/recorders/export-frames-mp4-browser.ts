/*
 * mp4 recording in browser
 */

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
} from "mediabunny";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { downloadBlob, isObject } from "../helpers";
import type {
  BaseProps,
  FramesFormatObj,
  SketchMode,
  SketchSettingsInternal,
  SketchStates,
} from "../types/types";

let output: Output<Mp4OutputFormat, BufferTarget> | null = null;
let canvasSource: CanvasSource | null = null;

let lastKeyframe = -Infinity;

export const setupMp4BrowserRecord = async <Mode extends SketchMode>({
  settings,
  states,
  props,
}: {
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps<Mode>;
}) => {
  if (!("VideoEncoder" in window)) {
    console.warn("The browser does not support WebCodecs");
    return;
  }

  // framesFormat is converted to array
  const framesFormat = settings
    .framesFormat[0] as FramesFormatObj<"mp4-browser">;

  const format = "mp4-browser";

  // default values (supports 2k resolution)
  // safer option?: "avc1.42001f", // doesn't support 2k
  const codecStrings: ["avc" | "hevc" | "vp8" | "vp9" | "av1", string] = [
    "avc",
    "avc1.4d002a",
  ];
  if (isObject(framesFormat)) {
    codecStrings[0] = framesFormat.codecStrings[0];
    codecStrings[1] = framesFormat.codecStrings[1];
  }

  output = new Output({
    format: new Mp4OutputFormat({
      fastStart: "in-memory",
    }),
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

  // https://jakearchibald.com/2022/html-codecs-parameter-for-av1/
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#basic_syntax
  // https://www.w3.org/TR/webcodecs-avc-codec-registration/#fully-qualified-codec-strings
  // https://github.com/Vanilagy/mp4-muxer/issues/10#issuecomment-1644404829
  // ['avc1.420033','avc1.42001E','avc1.4D401E','hvc1.2.4.L153','vp8','vp9','vp09.00.10.08','avc1.640033','hvc1.1.6.H150.90','hev1.1.6.L120.90','av01.0.01M.08','av01.0.15M.10','hev1.1.6.L93.B0','hev1.2.4.L93.B0','hvc1.3.E.L93.B0','hvc1.4.10.L93.B0'];

  lastKeyframe = -Infinity;

  console.log(`recording (${format}) started`);
};

export const encodeMp4Browser = <Mode extends SketchMode>({
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
    `recording (mp4-browser) frame... ${states.recordedFrames + 1} of ${
      settings.exportTotalFrames
    }`,
  );
};

export const endMp4BrowserRecord = async ({
  settings,
}: {
  settings: SketchSettingsInternal;
}) => {
  if (!("VideoEncoder" in window)) {
    return;
  }

  const format = "mp4";

  await output?.finalize(); // Resolves once the output is finalized

  // buffer contains final mp4
  const buffer = output?.target.buffer; // => Uint8Array

  if (buffer) {
    downloadBlob(new Blob([buffer]), settings, format);
  }

  output = null;
  canvasSource = null;

  console.log(`recording (mp4-browser) complete`);
};
