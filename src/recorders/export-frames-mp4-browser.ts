/*
 * mp4 recording in browser
 */

import type {
  SketchSettingsInternal,
  BaseProps,
  SketchStates,
  FramesFormatObj,
} from "../types/types";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { downloadBlob, isObject } from "../helpers";

let muxer: Muxer<ArrayBufferTarget> | null = null;
let videoEncoder: VideoEncoder | null = null;
let lastKeyframe: number | null = null;

export const setupMp4BrowserRecord = ({
  settings,
  states,
  props,
}: {
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps;
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
  const codecStrings: ["avc" | "av1", string] = ["avc", "avc1.4d002a"];
  if (isObject(framesFormat)) {
    codecStrings[0] = framesFormat.codecStrings[0];
    codecStrings[1] = framesFormat.codecStrings[1];
  }

  muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      // codec: 'avc' | 'hevc' | 'vp9' | 'av1',
      codec: codecStrings[0],
      width: props.canvas.width,
      height: props.canvas.height,
    },
    fastStart: "in-memory",
  });

  videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer!.addVideoChunk(chunk, meta!),
    error: (e) => console.error(`Mp4Muxer error: ${e}`),
  });

  // https://jakearchibald.com/2022/html-codecs-parameter-for-av1/
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#basic_syntax
  // https://www.w3.org/TR/webcodecs-avc-codec-registration/#fully-qualified-codec-strings
  // https://github.com/Vanilagy/mp4-muxer/issues/10#issuecomment-1644404829
  // ['avc1.420033','avc1.42001E','avc1.4D401E','hvc1.2.4.L153','vp8','vp9','vp09.00.10.08','avc1.640033','hvc1.1.6.H150.90','hev1.1.6.L120.90','av01.0.01M.08','av01.0.15M.10','hev1.1.6.L93.B0','hev1.2.4.L93.B0','hvc1.3.E.L93.B0','hvc1.4.10.L93.B0'];

  videoEncoder.configure({
    codec: codecStrings[1],
    // codec: "av01.0.05M.10", // supports 4k but can't play on M1 Mac (no hardware decoder) :(
    width: props.canvas.width,
    height: props.canvas.height,
    bitrate: 1e7, // 1e7 = 10 Mbps
    framerate: settings.exportFps,
  });

  lastKeyframe = -Infinity;

  console.log(`recording (${format}) started`);
};

export const encodeMp4Browser = ({
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
    timestamp: props.time * 1000 + props.loopCount * 1e6,
    duration: 1e6 / props.exportFps, // this ensures the last frame duration & correct fps
  });

  // add video keyframe every 2 seconds (2000ms)
  const needsKeyframe = props.time - lastKeyframe! >= 500;
  if (needsKeyframe) lastKeyframe = props.time;

  videoEncoder?.encode(frame, { keyFrame: needsKeyframe });
  frame.close();

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

  await videoEncoder?.flush();
  muxer?.finalize();

  const { buffer } = muxer?.target as ArrayBufferTarget; // Buffer contains final mp4

  downloadBlob(new Blob([buffer!]), settings, format);

  muxer = null;
  videoEncoder = null;

  console.log(`recording (mp4-browser) complete`);
};
