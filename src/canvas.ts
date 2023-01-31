import {
  BaseProps,
  SketchMode,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
} from "./types/types";
import { createCanvas as create, resizeCanvas as resize } from "@daeinc/canvas";
import { toHTMLElement } from "@daeinc/dom";

export const destroyCanvas = (canvas: HTMLCanvasElement) => {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
    canvas.remove();
  }

  // TODO
  // also remove any reference to canvas
};

export const prepareCanvas = (
  settings: SketchSettingsInternal,
  states: SketchStates
): {
  canvas: HTMLCanvasElement;
  context?:
    | CanvasRenderingContext2D
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | undefined;
  gl?: WebGLRenderingContext | WebGL2RenderingContext | undefined;
  width: number;
  height: number;
  pixelRatio: number;
} => {
  if (settings.canvas !== null && settings.canvas !== undefined) {
    if (settings.canvas.nodeName.toLowerCase() !== "canvas") {
      throw new Error("provided canvas must be an HTMLCanvasElement");
    }
  }
  return createCanvas(settings);
};

export const createCanvas = (settings: SketchSettingsInternal) => {
  let canvas: HTMLCanvasElement;
  let context:
    | CanvasRenderingContext2D
    | WebGLRenderingContext
    | WebGL2RenderingContext;
  let gl: WebGLRenderingContext | WebGL2RenderingContext | undefined;
  let [width, height] = settings.dimensions;
  const pixelRatio = Math.max(settings.pixelRatio, 1);

  let ctxString: "2d" | "webgl" | "webgl2";
  if (settings.mode === "p5") {
    ctxString = "2d";
  } else {
    ctxString = settings.mode;
  }

  if (settings.canvas === undefined || settings.canvas === null) {
    // create new canvas
    ({ canvas, context, gl, width, height } = create({
      parent: settings.parent,
      context: ctxString,
      width,
      height,
      pixelRatio,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    }));
  } else {
    // use existing canvas
    canvas = settings.canvas;
    if (settings.parent) {
      toHTMLElement(settings.parent).appendChild(canvas);
    }

    ({ context, gl, width, height } = resize({
      canvas,
      context: ctxString,
      width,
      height,
      pixelRatio,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    }));
  }

  // canvas centering
  // TODO: needs extra scaling of style.width & height to fit window/container
  // REVIEW: this is probably be better done in index.html <style>
  //         but, for now, this module doesn't provide html file, so...
  if (settings.centered === true) {
    const canvasContainer = canvas.parentElement!;
    canvasContainer.style.width = "100vw";
    canvasContainer.style.height = "100vh";
    canvasContainer.style.display = "flex";
    canvasContainer.style.justifyContent = "center";
    canvasContainer.style.alignItems = "center";

    if (settings.scaleContext === false) {
      // TODO: centering does not work at pixelRatio=2
    }
  } else {
    // scale canvas even when not centered.
    canvas.style.width = 100 + "%";
    canvas.style.height = 100 + "%";
    canvas.style.maxWidth = `${settings.dimensions[0]}px`;
    canvas.style.maxHeight = `${settings.dimensions[1]}px`;
  }

  return { canvas, context, gl, width, height, pixelRatio };
};

export const fitCanvasToWindow = ({
  userSettings,
  settings,
  props,
}: {
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  // resizing canvas style (when !fullscreen & centered)
  // REVIEW: this should be better done with CSS class rules.
  if (userSettings.dimensions !== undefined && settings.centered) {
    const margin = 50; // px // TODO: add to settings
    const canvasParent = props.canvas.parentElement!;
    const parentWidth = canvasParent.clientWidth;
    const parentHeight = canvasParent.clientHeight;
    const scale = Math.min(
      1,
      Math.min(
        (parentWidth - margin * 2) / props.width,
        (parentHeight - margin * 2) / props.height
      )
    );
    props.canvas.style.transform = `scale(${scale})`;
  }
};
