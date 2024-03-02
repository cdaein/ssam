import { Wrap } from "..";
import { Format as GifFormat } from "gifenc";

export type Sketch<Mode extends SketchMode> = (
  props: FinalProps<Mode>,
) => Promise<void> | void;

// just aliases to make typings simpler. same as using Sketch<Mode>
// export type Sketch2D = Sketch<"2d">;
// export type SketchWebGL = Sketch<"webgl" | "webgl2">;

export type SketchRender<Mode extends SketchMode> = (
  props: FinalProps<Mode>,
) => Promise<void> | void;

export type SketchResize<Mode extends SketchMode> = (
  props: FinalProps<Mode>,
) => void;

export type SketchLoop = (timestamp: number) => void;

/*
 * "2d", "webgl" or "webgl2"
 */
export type SketchMode = "2d" | "webgl" | "webgl2";

// gif is not supported by default
export type FrameFormat = "png" | "jpg" | "jpeg" | "webp";

// if mp4-browser or webm, it can pass codec string
export type FramesFormatObj<Format> = Format extends "mp4-browser"
  ? {
      /**
       * Render mp4 video in browser using WebCodecs API. Browser support varies.
       */
      format: Format;
      /**
       * Specify which codec to use.
       * See [Mp4-Muxer](https://github.com/Vanilagy/mp4-muxer) for options
       *
       * @default
       * ["avc", "avc1.4d002a"]
       */
      codecStrings: ["avc" | "av1", string];
    }
  : {
      format: Format;
      /**
       * Specity which codec to use.
       * See [WebM-Muxer](https://github.com/Vanilagy/webm-muxer) for options.
       * @default
       * ["V_VP9", "vp09.00.10.08"]
       */
      codecStrings: ["V_VP9", string];
    };

export type FramesFormatStr = "gif" | "mp4" | "mp4-browser" | "webm" | "png";

/*
 * Video or image sequence format
 */
export type FramesFormat =
  | FramesFormatStr
  | FramesFormatObj<"mp4-browser" | "webm">;

/** GIF encoding options */
export type GifOptions = {
  /**
   * Max number of colors to use for quantizing each frame
   * @default 256
   */
  maxColors?: number;
  /**
   * "rgb565" (default), "rgb444", or "rgba4444"
   * @default "rgb565"
   */
  format?: GifFormat;
  /** use a palette instead of quantizing */
  palette?: number[][];
  // knownColors?: string[]
};

export type RecordState = "inactive" | "start" | "in-progress" | "end";

/**
 * User provided settings. Any properties not defined by user will be merged internally with default settings.
 */
export type SketchSettings = {
  /** Set HTML webpage title. it replaces the `<title>` tag and is displayed on top of browser window */
  title?: string;
  /**
   * Set background color of HTML page. uses CSS color string. ex. `"#aaa"`
   * @default "#333"
   */
  // background?: string;
  /** Set sketch mode to use for either 2d or 3d sketches. */
  mode?: SketchMode;
  /** Set the HTML5 Canvas element's id attribute. */
  id?: string;
  /**
   * Set canvas parent either as `HTMLElement` object or string selector. ex. `div#app`
   * If Ssam uses an existing canvas element, this setting is ignored and Ssam will use the existing DOM tree.
   * @default "body"
   */
  parent?: HTMLElement | string;
  /** Set it to use an existing canvas instead of using one provided by Ssam. */
  canvas?: HTMLCanvasElement;
  /** Set the dimensions of canvas: `[width, height]`. Set it to `null` or `undefined` to use fullscreen canvas. */
  dimensions?: [number, number] | null;
  /** Set pixel ratio */
  pixelRatio?: number;
  /**
   * Apply inline CSS transform to scale canvas to its parent.
   * @default true
   */
  scaleToParent?: boolean;
  /** Scale context to account for pixelRatio */
  scaleContext?: boolean;
  /**
   * When `true`, it sets the following options:
   * ```javascript
   * canvas.style.imageRendering = "pixelated";
   * ctx.imageSmoothingEnabled = false;
   * ```
   */
  pixelated?: boolean;
  /** You can add context attributes for 2d or webgl canvas */
  attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
  /**
   * Set to `false` for static sketches
   * @default true
   */
  animate?: boolean;
  /** Set plackback frame rate */
  playFps?: number;
  /**
   * Set export frame rate for videos.
   * @default 60
   */
  exportFps?: number;
  /** Set animation loop duration in milliseconds */
  duration?: number;
  /**
   * How many times to loop (repeat). All time-related props except `loopCount` are reset each loop.
   * @default 1
   */
  numLoops?: number;
  /** Set export file name. By default, Ssam uses datetime string */
  filename?: string;
  /** Set prefix to file name */
  prefix?: string;
  /** Set suffix to file name */
  suffix?: string;
  /** Set file format for image export (ie. `png`, `jpg`). you can also use an array to export multiple formats at the same time. ex. `["webp", "png"]` */
  frameFormat?: FrameFormat | FrameFormat[];
  /** Set file format for video/sequence export (ie. `webm`, `gif`, `mp4-browser`). you can also use an array to export multiple formats at the same time. ex. `["gif", "webm"]` */
  framesFormat?: FramesFormat | FramesFormat[];
  /** GIF export options. */
  gifOptions?: GifOptions;
  /** Set to `false` to not use Ssam-provided hot keys (ex. `CMD+S` for image export) */
  hotkeys?: boolean;
  /** Send extra data to the sketch. it is accessible via `props.data` */
  data?: Record<string, any>;
};

/**
 * Settings that are used internally for development and not exposed to users. ie. exportTotalFrames
 */
export interface SketchSettingsInternal {
  // document
  title: string;
  mode: SketchMode;
  id: string;
  /** The default parent is `body` */
  parent: HTMLElement | string;
  /** If `null`, a new canvas is created */
  canvas: HTMLCanvasElement | null;
  dimensions: [number, number] | null;
  pixelRatio: number;
  scaleToParent: boolean;
  scaleContext: boolean;
  pixelated: boolean;
  attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
  // animation
  animate: boolean;
  /** If null, will use display's maximum fps */
  playFps: number | null;
  exportFps: number;
  duration: number;
  totalFrames: number;
  exportTotalFrames: number;
  numLoops: number;
  // out file
  filename: string;
  prefix: string;
  suffix: string;
  frameFormat: FrameFormat[];
  framesFormat: FramesFormat[];
  gifOptions: GifOptions;
  // sketch
  hotkeys: boolean;
  data: Record<string, any>;
}

export interface SketchStates {
  /** Regardless, time keeps updating */
  paused: boolean;
  playMode: "play" | "record";
  savingFrame: boolean;
  /** REVIEW: I don't think this is being used anymore? */
  // hotReloaded: boolean;
  startTime: number;
  lastStartTime: number;
  pausedStartTime: number;
  pausedDuration: number;
  timestamp: number;
  lastTimestamp: number;
  frameInterval: number | null;
  deltaRemainder: number;
  timeResetted: boolean;
  firstLoopRender: boolean;
  firstLoopRenderTime: number;
  /** not being used atm. */
  timeNavOffset: number;
  recordedFrames: number;
  /** First frame doesn't have `prevFrame`, so it's set to `null` */
  prevFrame: number | null;
}

/** props that are shared by all sketch modes */
// export interface BaseProps {
export type BaseProps<Mode extends SketchMode> = {
  wrap: Wrap<Mode>;
  /** `HTMLCanvasElement` */
  canvas: HTMLCanvasElement;
  /** Canvas width. may be different from `canvas.width` due to `pixelRatio` scaling */
  width: number;
  /** Canvas height. may be different from `canvas.height` due to `pixelRatio` scaling */
  height: number;
  /** Try `window.devicePixelRatio` to get the high resolution if your display supports */
  pixelRatio: number;
  /**
   * When `settings.duration` is set, `playhead` will repeat 0..1 over duration. If no duration, it will always be `0`.
   */
  playhead: number;
  /**
   * Frame count. starts at `0`. To keep up with time, some frames may skip and it may not increment by `1` all the time.
   */
  frame: number;
  /**
   * Elapsed time. when it reaches `duration`, it will reset to `0`
   */
  time: number;
  /** Time it took between renders in milliseconds */
  deltaTime: number;
  /** Animation duration in milliseconds. when it reaches the end, it will loop back to the beginning */
  duration: number;
  /** Number of total frames over duration */
  totalFrames: number;
  /** The current loop count. it is based on `numLoop` in the settings. it increases by `1` and resets back to `0`. `duration` setting is required. */
  loopCount: number;
  /**
   * The number of loops to repeat in the sketch that is defined in `settings.numLoops`
   * It may have been updated by `update()` function prop.
   */
  numLoops: number;
  /** Playback frame rate. Ssam throttles the rendering frequency but the exact fps is not guaranteed. */
  playFps: number | null;
  /**
   * Export frame rate. You can use very high frame rate, but GIF format is capped at 50fps.
   */
  exportFps: number;
  /** `true` if recording is in progress */
  recording: boolean;
  /** Call to export canvas as image in the format(s) specified in `settings.frameFormat`*/
  exportFrame: () => void;
  /**
   * Call to export canvas as frames or video in the format(s) specified in `settings.framesFormat`.
   * Calling it again while recording will end the current recording.
   */
  exportFrames: () => void;
  /** Call to play or pause sketch */
  togglePlay: () => void;
  /** Call without any props for rendering-on-demand. it will call sketch's returned function. good for manually advancing animation frame-by-frame. */
  render: () => void;
  resize: () => void;
  /**
   * Some sketch settings can be updated within sketch by calling `update()` with key/value pair.
   * @example
   * update({ duration: 4_000 })
   */
  update: (options: Record<string, any>) => void;
  /** Extra data sent from `settings.data`. */
  data: Record<string, any>;
};

// REVIEW: separate updatable/writable props (during life of a sketch), and fixed/readable props

export type SketchContext =
  | CanvasRenderingContext2D
  | WebGLRenderingContext
  | WebGL2RenderingContext;

/**
 * to use with canvas with 2d sketches
 */
export interface SketchProps extends BaseProps<"2d"> {
  context: CanvasRenderingContext2D;
}

/**
 * props type specific to `webgl` or `webgl2` mode
 */
export interface WebGLProps extends BaseProps<"webgl"> {
  /** webgl context */
  gl: WebGLRenderingContext;
}

export interface WebGL2Props extends BaseProps<"webgl2"> {
  /** webgl context */
  gl: WebGL2RenderingContext;
}

// export interface P5Props extends BaseProps {
//   p5: p5;
// }

// Don't like the name but for now, let's call it Final Props
// - SsamProps?

export type FinalProps<Mode extends SketchMode> = Mode extends "2d"
  ? SketchProps
  : Mode extends "webgl"
    ? WebGLProps
    : WebGL2Props;

// export interface States {
//   settings: {
//     // document
//     title: string;
//     // background: string;
//     // canvas
//     mode: SketchMode;
//     parent: HTMLElement | string;
//     canvas: HTMLCanvasElement | null; // if null, new canvas will be created
//     dimensions: [number, number];
//     pixelRatio: number;
//     scaleToParent: boolean;
//     scaleContext: boolean;
//     pixelated: boolean;
//     attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
//     // animation
//     animate: boolean;
//     playFps: number | null; // if null, will use display's maximum fps
//     exportFps: number;
//     duration: number;
//     // out file
//     filename: string;
//     prefix: string;
//     suffix: string;
//     frameFormat: FrameFormat[];
//     framesFormat: FramesFormat[];
//     gifOptions: GifOptions;
//     // sketch
//     hotkeys: boolean;
//   };
//   internals: {
//     paused: boolean; // regardless of playMode, time is updating
//     playMode: "play" | "record";
//     savingFrame: boolean;
//     savingFrames: boolean;
//     // captureReady: boolean;
//     // captureDone: boolean;
//     startTime: number;
//     lastStartTime: number;
//     pausedStartTime: number;
//     pausedDuration: number;
//     timestamp: number;
//     lastTimestamp: number;
//     frameInterval: number | null;
//     timeResetted: boolean;
//     totalFrames: number;
//     exportTotalFrames: number;
//   };
//   props: {
//     wrap: Wrap<SketchMode> | null;
//     /** `HTMLCanvasElement` */
//     canvas: HTMLCanvasElement | null;
//     /** canvas 2d context */
//     context: CanvasRenderingContext2D | null;
//     /** canvas WebGL or WebGL2 context */
//     gl: WebGLRenderingContext | WebGL2RenderingContext | null;
//     /** canvas width. may be different from canvas.width due to pixel ratio scaling */
//     width: number;
//     /** canvas height. may be different from canvas.height due to pixel ratio scaling */
//     height: number;
//     /** try `window.devicePixelRatio` to get the high resolution if your display supports */
//     pixelRatio: number;
//     // animation
//     /** enable or disable animation */
//     animate: boolean;
//     /** when `settings.duration` is set, playhead will repeat 0..1 over duration */
//     playhead: number;
//     /** frame count. starting at `0` */
//     frame: number;
//     /** elapsed time. when it reaches `duration`, it will reset to `0` */
//     time: number;
//     /** time it took between renders in milliseconds */
//     deltaTime: number;
//     /** animation duration in milliseconds. when it reaches the end, it will loop back to the beginning */
//     duration: number;
//     /** number of total frames over duration */
//     totalFrames: number;
//     /** true if recording in progress */
//     recording: boolean;
//     /** call to export canvas as image */
//     exportFrame: () => void;
//     /** call to play or pause sketch */
//     togglePlay: () => void;
//     /** call without any props for rendering-on-demand. it will call sketch's returned function. good for manually advancing animation frame-by-frame. */
//     render: () => void;
//     resize: () => void;
//     update: (settings: SketchSettings) => void;
//     p5: p5 | null;
//   };
// }
