import { resizeCanvas } from "@daeinc/canvas";
import { Wrap } from ".";
import { prepareCanvas } from "./canvas";
import { saveCanvasFrame } from "./recorders/export-frame";
import type {
  BaseProps,
  SketchProps,
  SketchSettings,
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
}: {
  wrap: Wrap;
  settings: SketchSettingsInternal;
  states: SketchStates;
  renderProp: () => void; // TODO: proper typing. should i move this to createFunctionProps()?
}) => {
  const { canvas, context, gl, width, height, pixelRatio } = prepareCanvas(
    settings
  ) as CanvasProps;

  // function props
  const { exportFrame, update, togglePlay } = createFunctionProps({
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
    recording: false,
    exportFrame,
    togglePlay,
    render: renderProp,
    update,
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
    // REVIEW: is it ok to expose internal settings like this?
    update: createUpdateProp({ canvas, prevSettings: settings, resizeCanvas }),
    togglePlay: createTogglePlay({ states }),
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

const createTogglePlay = ({ states }: { states: SketchStates }) => {
  return () => {
    states.paused = !states.paused;
    if (states.paused) {
      // when paused
      states.pausedStartTime = states.timestamp;
    }
  };
};

// FIX: screen flicker, doesn't work when paused
const createUpdateProp = ({
  canvas,
  prevSettings,
  resizeCanvas,
}: {
  canvas: HTMLCanvasElement;
  prevSettings: SketchSettingsInternal;
  resizeCanvas: any;
}) => {
  return (settings: SketchSettings) => {
    console.log("update() prop is not yet implemented.");

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
