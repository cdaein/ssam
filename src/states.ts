import { SketchSettingsInternal, SketchStates, States } from "./types/types";

export const createStates = ({
  settings,
}: {
  settings: SketchSettingsInternal;
}): SketchStates => {
  return {
    paused: false,
    playMode: "play",
    savingFrame: false,
    savingFrames: false,
    captureReady: false,
    captureDone: false,
    startTime: 0,
    lastStartTime: 0,
    pausedStartTime: 0,
    pausedDuration: 0,
    timestamp: 0,
    lastTimestamp: 0,
    frameInterval: settings.playFps !== null ? 1000 / settings.playFps : null,
    timeResetted: false,
    firstLoopRender: true,
    firstLoopRenderTime: 0,
    timeNavOffset: 0,
  };
};

// not used at the moment
// TODO: consolidate all wrapper data into a single source of truth
export const states: States = {
  settings: {
    title: "Sketch",
    background: "#333",
    mode: "2d",
    parent: "body",
    canvas: null,
    dimensions: [window.innerWidth, window.innerHeight],
    pixelRatio: 1,
    centered: true,
    scaleContext: true,
    pixelated: false,
    attributes: {},
    animate: true,
    playFps: null,
    exportFps: 60,
    duration: Infinity,
    filename: "",
    prefix: "",
    suffix: "",
    frameFormat: ["png"],
    framesFormat: ["webm"],
    gifOptions: {},
    hotkeys: true,
  },
  internals: {
    paused: false,
    playMode: "play",
    savingFrame: false,
    savingFrames: false,
    captureReady: false,
    captureDone: false,
    startTime: 0,
    lastStartTime: 0,
    pausedStartTime: 0,
    pausedDuration: 0,
    timestamp: 0,
    lastTimestamp: 0,
    frameInterval: null,
    timeResetted: false,
    totalFrames: Infinity, // internal use
    exportTotalFrames: Infinity, // internal use
  },
  props: {
    wrap: null,
    canvas: null,
    context: null,
    gl: null,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: 1,
    animate: true,
    playhead: 0,
    frame: 0,
    time: 0,
    deltaTime: 0,
    duration: 1,
    totalFrames: 0,
    recording: false,
    exportFrame: () => {},
    togglePlay: () => {},
    render: () => {},
    resize: () => {},
    update: () => {},
    p5: null,
  },
};
