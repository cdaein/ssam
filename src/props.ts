import { resizeCanvas } from "@daeinc/canvas";
import { toHTMLElement } from "@daeinc/dom";
import { Wrap } from ".";
import { createCanvas } from "./canvas";
import { toArray } from "./helpers";
import { saveCanvasFrame } from "./recorders/export-frame";
import {
  computeExportFps,
  computeExportTotalFrames,
  computeFrameInterval,
  computePlayFps,
  computeTotalFrames,
} from "./time";
import type {
  BaseProps,
  SketchProps,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "./types/types";

type CanvasProps = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  width: number;
  height: number;
  pixelRatio: number;
};

export const createProps = ({
  wrap,
  settings,
  states,
  renderProp,
  resizeProp,
}: {
  wrap: Wrap;
  settings: SketchSettingsInternal;
  states: SketchStates;
  renderProp: () => void;
  resizeProp: () => void;
}) => {
  const { canvas, context, gl, width, height, pixelRatio } = createCanvas(
    settings
  ) as CanvasProps;

  // function props
  const { exportFrame, togglePlay } = createFunctionProps({
    canvas,
    settings,
    states,
  });

  const baseProps: BaseProps = {
    wrap,
    // canvas
    canvas,
    width,
    height,
    pixelRatio,
    // animation
    playhead: 0,
    frame: 0,
    time: 0,
    deltaTime: 0,
    duration: settings.duration,
    totalFrames: settings.totalFrames,
    playFps: settings.playFps,
    exportFps: settings.exportFps,
    recording: false,
    exportFrame,
    togglePlay,
    render: renderProp,
    resize: resizeProp,
    update: () => {}, // TODO: create updateProp type
    data: settings.data,
  };

  let props: SketchProps | WebGLProps;

  if (settings.mode === "2d") {
    props = {
      ...baseProps,
      context: context as CanvasRenderingContext2D,
    } as SketchProps;
  } else if (settings.mode === "webgl") {
    props = {
      ...baseProps,
      gl: gl as WebGLRenderingContext,
    } as WebGLProps;
  } else {
    // webgl2
    props = {
      ...baseProps,
      gl: gl as WebGL2RenderingContext,
    } as WebGLProps;
  }

  props.update = createUpdateProp({
    canvas,
    settings,
    states,
    props,
  });

  return props;
};

const createFunctionProps = ({
  canvas,
  settings,
  states,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
}) => {
  return {
    exportFrame: createExportFrameProp({ canvas, settings, states }),
    // update: createUpdateProp({
    //   canvas,
    //   settings,
    //   states,
    //   props,
    //   resizeCanvas,
    // }),
    togglePlay: createTogglePlay(states),
  };
};

const createExportFrameProp = ({
  canvas,
  settings,
  states,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
}) => {
  return () => {
    states.savingFrame = true;
    states.playMode = "record";
    saveCanvasFrame({
      canvas,
      settings,
      states,
    });
  };
};

const createTogglePlay = (states: SketchStates) => {
  return () => {
    states.paused = !states.paused;
    if (states.paused) {
      // when paused
      states.pausedStartTime = states.timestamp;
    }
  };
};

// TODO: create UpdatableKeys type - and move to constants?
export const updatableKeys = [
  // DOM
  "parent",
  "title",
  "background",
  // canvas
  "dimensions",
  "width",
  "height",
  "pixelRatio",
  "pixelated",
  // animation
  // "frame", // TODO: for frame-by-frame navigation
  "duration",
  "playFps",
  "exportFps",
  // file export
  "filename",
  "prefix",
  "suffix",
  // REVIEW: will need to check browser/env support when updating these.
  "frameFormat",
  "framesFormat",
];

export const createUpdateProp = ({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: SketchProps | WebGLProps;
}) => {
  return (options: Record<string, any>) => {
    // check if options only include updatableKeys
    let invalidKey: string | null = null;
    for (const key in options) {
      if (!updatableKeys.includes(key)) {
        invalidKey = key;
        throw new Error(`${invalidKey} is not updatable`);
      }
    }

    for (const key in options) {
      // DOM
      if (key === "parent") {
        if (
          typeof options[key] === "string" ||
          options[key] instanceof Element
        ) {
          toHTMLElement(options[key]).appendChild(canvas);
        } else {
          throw new Error(`${options[key]} must be either string or Element`);
        }
      } else if (key === "title") {
        document.title = options[key];
      } else if (key === "background") {
        document.body.style.background = options[key];
      }
      // canvas
      // REVIEW: don't directly use resizeCanvas() dep,
      //      but use resize handler so it will also render right after
      else if (
        key === "dimensions" ||
        key === "width" ||
        key === "height" ||
        key === "pixelRatio"
      ) {
        const { width, height } = resizeCanvas({
          canvas,
          context: settings.mode,
          width:
            key === "dimensions"
              ? options[key][0]
              : key === "width"
              ? options[key]
              : props.width,
          height:
            key === "dimensions"
              ? options[key][1]
              : key === "height"
              ? options[key]
              : props.height,
          pixelRatio: key === "pixelRatio" ? options[key] : props.pixelRatio,
          scaleContext: settings.scaleContext,
          attributes: settings.attributes,
        });
        props.width = width;
        props.height = height;
        props.pixelRatio =
          key === "pixelRatio" ? options[key] : props.pixelRatio;

        // render right after, otherwise, canvas may disappear at low fps or paused
        props.render();
      } else if (key === "pixelated") {
        if (options[key] === true) {
          canvas.style.imageRendering = "pixelated";
          if (settings.mode === "2d") {
            (props as SketchProps).context.imageSmoothingEnabled = false;
          }
        } else {
          canvas.style.imageRendering = "auto";
          if (settings.mode === "2d") {
            (props as SketchProps).context.imageSmoothingEnabled = true;
          }
        }
      }
      // animation
      else if (key === "frame") {
        // TODO: when paused, playLoop() returns early, so these commands don't register
        //       also, computePlayhead() uses props.time / duration
        //       so any value update here will be overridden inside loop
        //       props.time needs +/-offset for this to work
        // states.timeNavOffset = props.deltaTime;
        // props.frame = options[key] % props.totalFrames;
      } else if (key === "duration") {
        settings.duration = options[key];
        computeTotalFrames(settings);
        computeExportTotalFrames(settings);
        props.duration = options[key];
        props.totalFrames = settings.totalFrames;
      } else if (key === "playFps") {
        settings.playFps = options[key];
        computePlayFps(settings);
        computeTotalFrames(settings);
        props.playFps = settings.playFps;
        props.totalFrames = settings.totalFrames;
        computeFrameInterval(settings, states);
      } else if (key === "exportFps") {
        settings[key] = options[key];
        computeExportFps(settings);
        computeExportTotalFrames(settings);
        props.exportFps = settings.exportFps;
      }
      // file export
      else if (key === "filename" || key === "prefix" || key === "suffix") {
        settings[key] = options[key];
      } else if (key === "frameFormat" || key === "framesFormat") {
        settings[key] = toArray(options[key]);
      }
    }

    // check if it's trying to update both duration & totalFrames at the same time

    // if (settings.pixelRatio) {
    //   resizeCanvas({
    //     canvas,
    //     width: prevSettings.dimensions[0],
    //     height: prevSettings.dimensions[1],
    //     pixelRatio: settings.pixelRatio,
    //   });
    // }
  };
};
