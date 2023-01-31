import { resizeCanvas } from "@daeinc/canvas";
import { Wrap } from ".";
import { prepareCanvas } from "./canvas";
import { saveCanvasFrame } from "./recorders/export-frame";
import type {
  BaseProps,
  P5Props,
  SketchProps,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "./types/types";
import type p5 from "p5";

type CanvasProps = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  p5: p5;
  width: number;
  height: number;
  pixelRatio: number;
};

export const createProps = ({
  wrap,
  userSettings,
  settings,
  states,
  p5Methods,
  renderProp,
  resizeProp,
}: {
  wrap: Wrap;
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  states: SketchStates;
  p5Methods: any; // TODO: proper typing
  // TODO: proper typing. should i move this to createFunctionProps()?
  renderProp: () => void;
  resizeProp: () => void;
}): SketchProps | WebGLProps | P5Props => {
  const { canvas, context, gl, width, height, pixelRatio } = prepareCanvas(
    userSettings,
    settings,
    states
  ) as CanvasProps;

  let props: SketchProps | WebGLProps | P5Props;

  // function props
  const { exportFrame, update, togglePlay } = createFunctionProps({
    canvas,
    settings,
    states,
    // FIX: undefined
    props,
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
    resize: resizeProp,
    update,
  };

  if (settings.mode === "p5") {
    // special case for p5
    // use p5.drawingContext and p5.drawingContext.canvas

    let preloadDone = false;
    let p5Canvas: HTMLCanvasElement;
    let p5Context: CanvasRenderingContext2D;

    const setupP5 = (props: P5Props) => {
      const p5Constructor = userSettings.p5!;
      const p5Sketch = (p: p5) => {
        p.preload = () => {
          p5Methods.preload(props);
        };
        p.setup = () => {
          preloadDone = true;
          const cnv = p.createCanvas(
            settings.dimensions[0],
            settings.dimensions[1],
            p.P2D
          );
          p.pixelDensity(settings.pixelRatio);
          // p.setAttributes() // only for p.WEBGL mode
          p.noLoop();

          p5Context = p.drawingContext;
          p5Canvas = p5Context.canvas;
          // p5Context = cnv.elt.drawingContext;
          // console.log({ cnv });
          // console.log({ p5Canvas });

          update({
            canvas: p5Canvas,
          });

          p5Methods.init(props);
          // REVIEW: what else to init?
        };
        p.draw = () => {
          p5Methods.render(props);
        };
        p.windowResized = () => {
          // TODO: p5 window resized checks for "window", but Sssam checks for "canvas"
          p5Methods.resize(props);
        };
      };
      return new p5Constructor(p5Sketch);
    };

    // REVIEW: type error
    //@ts-ignore
    const p5Object = setupP5(props);

    // REVIEW: type error
    //@ts-ignore
    props = {
      ...baseProps,
      p5: p5Object,
    };
    return props;
  }

  if (settings.mode === "webgl") {
    props = {
      ...baseProps,
      gl: gl as WebGLRenderingContext,
    } as WebGLProps;
  } else if (settings.mode === "webgl2") {
    // webgl2
    props = {
      ...baseProps,
      gl: gl as WebGL2RenderingContext,
    } as WebGLProps;
  } else {
    // 2d (default)
    props = {
      ...baseProps,
      context: context as CanvasRenderingContext2D,
    } as SketchProps;
  }

  return props;
};

const createFunctionProps = ({
  canvas,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: SketchProps | WebGLProps | P5Props;
}) => {
  return {
    exportFrame: createExportFrameProp({ canvas, settings, states }),
    // REVIEW: is it ok to expose internal settings like this?
    update: createUpdateProp({
      canvas,
      prevSettings: settings,
      props,
      resizeCanvas,
    }),
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
  props,
  resizeCanvas,
}: {
  canvas: HTMLCanvasElement;
  prevSettings: SketchSettingsInternal;
  props: SketchProps | WebGLProps | P5Props;
  resizeCanvas: any;
}) => {
  return (options: any) => {
    console.log("update() prop is not yet implemented.");

    if (options.canvas) {
      prevSettings.canvas = options.canvas;
      console.log({ props });
      // props.canvas = options.canvas;
    }
    if (
      (prevSettings.mode === "2d" || prevSettings.mode === "p5") &&
      options.context
    ) {
      (props as SketchProps | P5Props).context = options.context;
    }

    // return Object.assign(prevSettings, options);

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
