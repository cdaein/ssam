import { SketchSettingsInternal, SketchStates } from "./types/types";

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
  };
};

// not used at the moment
// TODO: consolidate all wrapper data into a single source of truth
export const states = {
  settings: {
    title: "Sketch",
    background: "#333",
    parent: "body",
    mode: "2d",
    canvas: null,
    dimensions: [window.innerWidth, window.innerHeight],
    pixelRatio: 1,
    centered: true,
    scaleContext: true,
    pixelated: false,
    animate: true,
    playFps: null,
    exportFps: 60,
    duration: Infinity,
    totalFrames: Infinity,
    exportTotalFrames: Infinity,
    filename: "",
    prefix: "",
    suffix: "",
    frameFormat: ["png"],
    framesFormat: ["webm"],
    gifOptions: {},
    hotkeys: true,
  },
  states: {
    //
  },
  props: {
    //
  },
};
