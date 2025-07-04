import { checkSupportedFramesFormats, toArray } from "./helpers";
import {
  computeExportFps,
  computeExportTotalFrames,
  computePlayFps,
  computeTotalFrames,
} from "./time";
import { Hotkeys, SketchSettings, SketchSettingsInternal } from "./types/types";

/**
 * Set all properties of `hotkeys` to `val`
 * @param val -
 */
const createHotkeysObj = (val: boolean) => ({
  togglePlay: val,
  exportFrame: val,
  exportFrames: val,
  git: val,
  // arrowKeys: val, // not implemented yet
});

/**
 * combine settings. use base object (defaultSettings) as starting point and override with main object (userSettings).
 * if any value from main object is undefined, use base object value instead.
 * null values may pass through.
 *
 * @param param0
 * @returns
 */
export const createSettings = ({
  main,
}: {
  // REVIEW: or NonNullable<SketchSettings>
  main: Exclude<SketchSettings, undefined>;
}) => {
  // data flow: userSettings + defaultSettings => settings => states (mutable) => props => sketch()
  // default settings
  const defaultSettings: SketchSettingsInternal = {
    // document
    title: "",
    // background: "#333",
    // canvas
    // id: "ssam-canvas-" + Math.floor(Math.random() * 100000).toString(),
    id: "ssam-canvas",
    parent: "body",
    canvas: null,
    dimensions: null,
    pixelRatio: 1,
    scaleToParent: true,
    scaleContext: true,
    pixelated: false,
    // animation
    animate: true,
    playFps: null,
    exportFps: 60,
    duration: Infinity,
    totalFrames: Infinity,
    exportTotalFrames: Infinity,
    numLoops: 1,
    // file
    filename: "",
    prefix: "",
    suffix: "",
    frameFormat: ["png"],
    framesFormat: [],
    gifOptions: {},
    // sketch
    hotkeys: createHotkeysObj(true),
    mode: "2d",
    data: {},
  };

  const combined = Object.assign({}, defaultSettings, main);

  // if main has undefined value, use value from base
  for (const [key, value] of Object.entries(combined)) {
    if (value === undefined) {
      // FIX: i'm out of ideas on how to fix this TS error.
      //      i'm pretty sure it works as intended w/o type check.
      //      adding [key:string]:any to SketchSettings type will solve it,
      //      but it will disable safety check
      //      when user provided non-existing key to settings object.
      //@ts-ignore
      combined[key] = defaultSettings[key as keyof SketchSettings];
    }
  }
  if (Object.values(combined).some((value) => value === undefined)) {
    throw new Error("settings object cannot have undefined values");
  }

  // document
  if (combined.title.length !== 0) {
    document.title = combined.title;
  }
  // FIX: don't set body background all the time.
  // - better to handle with css (or only set parent bg color)
  // document.body.style.background = combined.background;

  // canvas
  // pixelated is handle at canvas creation

  // time
  computePlayFps(combined);
  computeExportFps(combined);
  computeTotalFrames(combined);
  computeExportTotalFrames(combined);

  if (combined.numLoops <= 0) {
    console.warn(`settings.numLoops cannot be 0 or less. it is now set to 1.`);
    combined.numLoops = 1;
  }

  // convert to array format
  combined.frameFormat = toArray(combined.frameFormat);
  combined.framesFormat = checkSupportedFramesFormats(
    toArray(combined.framesFormat),
  );

  if (typeof combined.hotkeys === "boolean") {
    const val = combined.hotkeys as boolean;
    combined.hotkeys = createHotkeysObj(val);
  } else if (typeof combined.hotkeys === "object") {
    combined.hotkeys = {
      ...createHotkeysObj(true),
      ...(combined.hotkeys || {}),
    };
  }

  return combined;
};
