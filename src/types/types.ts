import { Wrap } from "..";
import { Format as GifFormat } from "gifenc";
import type p5 from "p5";

export type Sketch = (props: SketchProps | WebGLProps) => Promise<void> | void;

export type SketchRender = (
  props: SketchProps | WebGLProps
) => Promise<void> | void;

// export type SketchRender =
//   | ((props: SketchProps) => Promise<void> | void)
//   | ((props: WebGLProps) => Promise<void> | void);

export type SketchResize = (props: SketchProps | WebGLProps) => void;

// export type SketchResize =
//   | ((props: SketchProps) => void)
//   | ((props: WebGLProps) => void);

export type SketchLoop = (timestamp: number) => void;

// export type SketchObject = {
//   render: SketchRender;
//   resize: SketchResize;
// };

export type SketchMode = "2d" | "webgl" | "webgl2";

// gif is not supported by default
export type FrameFormat = "png" | "jpg" | "jpeg" | "webp";

// video or image sequence
// export type FramesFormat = "gif" | "jpg" | "jpeg" | "mp4" | "png" | "webm";
export type FramesFormat = "gif" | "mp4" | "webm";

/** GIF encoding options */
export type GifOptions = {
  /** max number of colors to use for quantizing each frame */
  maxColors?: number;
  format?: GifFormat;
  /** use a palette instead of quantizing */
  palette?: number[][];
  // knownColors?: string[]
};

export type RecordState = "inactive" | "start" | "in-progress" | "end";

/**
 * User provided settings. all optional properties must either come from user. If not, it will be filled internally with default settings.
 */
export type SketchSettings = {
  // document
  /** set HTML webpage title. it is placed inside `<title>` tag and displayed on top of browser window */
  title?: string;
  /** set background color of HTML page. uses CSS color string. ex. `#aaa` */
  background?: string;
  // canvas
  /** set sketch mode to use or integrate with other libraries */
  mode?: SketchMode;
  /** canvas id */
  id?: string;
  /** set canvas parent either as `HTMLElement` object or string selector. ex. `div#app` */
  parent?: HTMLElement | string;
  /** set it to use an existing canvas instead of using one provided by sketch-wrapper */
  canvas?: HTMLCanvasElement;
  /** [width, height] */
  dimensions?: [number, number] | null;
  /** set pixel ratio */
  pixelRatio?: number;
  /** center canvas */
  centered?: boolean;
  /** scale context to account for pixelRatio */
  scaleContext?: boolean;
  /** not yet implemented */
  pixelated?: boolean;
  /** context attributes for 2d or webgl canvas */
  attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
  // animation
  /** set to `true` to play animation */
  animate?: boolean;
  /** set plackback frame rate */
  playFps?: number;
  /** set export frame rate for videos. (doesn't work yet) */
  exportFps?: number;
  /** set animation loop duration in milliseconds */
  duration?: number;
  // out file
  /** set export file name. if not set, sketch-wrapper uses datetime string */
  filename?: string;
  /** set prefix to file name */
  prefix?: string;
  /** set suffix to file name */
  suffix?: string;
  /** set file format for image export (ie. png, jpeg). you can also use array to export multiple formats at the same time. ex. ["webp", "png"] */
  frameFormat?: FrameFormat | FrameFormat[];
  /** set file format for video/sequence export (ie. webm, gif). you can also use array to export multiple formats at the same time. ex. ["gif", "webm"] */
  framesFormat?: FramesFormat | FramesFormat[];
  /** GIF export options. */
  gifOptions?: GifOptions;
  // sketch
  /** set to `false` to not use sketch-wrapper provided hot keys (ex. `CMD+S` for image export) */
  hotkeys?: boolean;
  /** extra data to pass to the sketch. it is accessible via props.data */
  data?: Record<string, any>;
};

/**
 * Settings that are used internally for development.
 */
export interface SketchSettingsInternal {
  // document
  title: string;
  background: string;
  // canvas
  mode: SketchMode;
  id: string;
  parent: HTMLElement | string;
  canvas: HTMLCanvasElement | null; // if null, new canvas will be created
  dimensions: [number, number] | null;
  pixelRatio: number;
  centered: boolean;
  scaleContext: boolean;
  pixelated: boolean;
  attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
  // animation
  animate: boolean;
  playFps: number | null; // if null, will use display's maximum fps
  exportFps: number;
  duration: number;
  totalFrames: number;
  exportTotalFrames: number;
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
  paused: boolean; // regardless of playMode, time is updating
  playMode: "play" | "record";
  savingFrame: boolean;
  hotReloaded: boolean;
  startTime: number;
  lastStartTime: number;
  pausedStartTime: number;
  pausedDuration: number;
  timestamp: number;
  lastTimestamp: number;
  frameInterval: number | null;
  timeResetted: boolean;
  firstLoopRender: boolean;
  firstLoopRenderTime: number;
  timeNavOffset: number;
}

/** props that are shared by all sketch modes */
export interface BaseProps {
  wrap: Wrap;
  /** `HTMLCanvasElement` */
  canvas: HTMLCanvasElement;
  /** canvas width. may be different from canvas.width due to pixel ratio scaling */
  width: number;
  /** canvas height. may be different from canvas.height due to pixel ratio scaling */
  height: number;
  /** try `window.devicePixelRatio` to get the high resolution if your display supports */
  pixelRatio: number;
  // animation
  // animate: boolean;
  /** when `settings.duration` is set, playhead will repeat 0..1 over duration */
  playhead: number;
  /** frame count. starting at `0` */
  frame: number;
  /** elapsed time. when it reaches `duration`, it will reset to `0` */
  time: number;
  /** time it took between renders in milliseconds */
  deltaTime: number;
  /** animation duration in milliseconds. when it reaches the end, it will loop back to the beginning */
  duration: number;
  /** number of total frames over duration */
  totalFrames: number;
  /** play fps */
  playFps: number | null;
  /** export fps */
  exportFps: number;
  /** true if recording in progress */
  recording: boolean;
  /** call to export canvas as image */
  exportFrame: () => void;
  /** call to play or pause sketch */
  togglePlay: () => void;
  /** call without any props for rendering-on-demand. it will call sketch's returned function. good for manually advancing animation frame-by-frame. */
  render: () => void;
  resize: () => void;
  /** not yet implemented */
  update: (options: Record<string, any>) => void;
  data: Record<string, any>;
}

// REVIEW: separate updatable/writable props (during life of a sketch), and fixed/readable props

export type SketchContext =
  | CanvasRenderingContext2D
  | WebGLRenderingContext
  | WebGL2RenderingContext;

/**
 * to use with canvas with 2d sketches
 */
export interface SketchProps extends BaseProps {
  context: CanvasRenderingContext2D;
}

/**
 * props type specific to `webgl` or `webgl2` mode
 */
export interface WebGLProps extends BaseProps {
  /** webgl context */
  // context: WebGLRenderingContext;
  gl: WebGLRenderingContext;
}

export interface P5Props extends BaseProps {
  p5: p5;
}

// export interface Props {
//   wrap: Wrap;
//   canvas: HTMLCanvasElement;
//   context: CanvasRenderingContext2D;
//   width: number;
//   height: number;
//   frame: number;
//   render: any;
// }

export interface States {
  settings: {
    // document
    title: string;
    background: string;
    // canvas
    mode: SketchMode;
    parent: HTMLElement | string;
    canvas: HTMLCanvasElement | null; // if null, new canvas will be created
    dimensions: [number, number];
    pixelRatio: number;
    centered: boolean;
    scaleContext: boolean;
    pixelated: boolean;
    attributes?: CanvasRenderingContext2DSettings | WebGLContextAttributes;
    // animation
    animate: boolean;
    playFps: number | null; // if null, will use display's maximum fps
    exportFps: number;
    duration: number;
    // out file
    filename: string;
    prefix: string;
    suffix: string;
    frameFormat: FrameFormat[];
    framesFormat: FramesFormat[];
    gifOptions: GifOptions;
    // sketch
    hotkeys: boolean;
  };
  internals: {
    paused: boolean; // regardless of playMode, time is updating
    playMode: "play" | "record";
    savingFrame: boolean;
    savingFrames: boolean;
    // captureReady: boolean;
    // captureDone: boolean;
    startTime: number;
    lastStartTime: number;
    pausedStartTime: number;
    pausedDuration: number;
    timestamp: number;
    lastTimestamp: number;
    frameInterval: number | null;
    timeResetted: boolean;
    totalFrames: number;
    exportTotalFrames: number;
  };
  props: {
    wrap: Wrap | null;
    /** `HTMLCanvasElement` */
    canvas: HTMLCanvasElement | null;
    /** canvas 2d context */
    context: CanvasRenderingContext2D | null;
    /** canvas WebGL or WebGL2 context */
    gl: WebGLRenderingContext | WebGL2RenderingContext | null;
    /** canvas width. may be different from canvas.width due to pixel ratio scaling */
    width: number;
    /** canvas height. may be different from canvas.height due to pixel ratio scaling */
    height: number;
    /** try `window.devicePixelRatio` to get the high resolution if your display supports */
    pixelRatio: number;
    // animation
    /** enable or disable animation */
    animate: boolean;
    /** when `settings.duration` is set, playhead will repeat 0..1 over duration */
    playhead: number;
    /** frame count. starting at `0` */
    frame: number;
    /** elapsed time. when it reaches `duration`, it will reset to `0` */
    time: number;
    /** time it took between renders in milliseconds */
    deltaTime: number;
    /** animation duration in milliseconds. when it reaches the end, it will loop back to the beginning */
    duration: number;
    /** number of total frames over duration */
    totalFrames: number;
    /** true if recording in progress */
    recording: boolean;
    /** call to export canvas as image */
    exportFrame: () => void;
    /** call to play or pause sketch */
    togglePlay: () => void;
    /** call without any props for rendering-on-demand. it will call sketch's returned function. good for manually advancing animation frame-by-frame. */
    render: () => void;
    resize: () => void;
    /** not yet implemented */
    update: (settings: SketchSettings) => void;
    p5: p5 | null;
  };
}
