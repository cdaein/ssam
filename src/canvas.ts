import {
  BaseProps,
  SketchContext,
  SketchSettings,
  SketchSettingsInternal,
} from "./types/types";
import { createCanvas as create, resizeCanvas } from "@daeinc/canvas";
import { toHTMLElement } from "@daeinc/dom";

export const createCanvas = (settings: SketchSettingsInternal) => {
  if (settings.canvas !== null && settings.canvas !== undefined) {
    if (settings.canvas.nodeName.toLowerCase() !== "canvas") {
      throw new Error("Pass an HTMLCanvasElement");
    }
  }

  let canvas: HTMLCanvasElement;
  let context: SketchContext;
  let gl: WebGLRenderingContext | WebGL2RenderingContext | undefined;
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (settings.dimensions) {
    [width, height] = settings.dimensions;
  }
  const pixelRatio = Math.max(settings.pixelRatio, 1);

  if (settings.canvas === undefined || settings.canvas === null) {
    // create new canvas
    ({ canvas, context, gl, width, height } = create({
      parent: settings.parent,
      context: settings.mode,
      width,
      height,
      pixelRatio,
      pixelated: settings.pixelated,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    }) as {
      canvas: HTMLCanvasElement;
      context: SketchContext;
      gl?: WebGLRenderingContext | WebGL2RenderingContext;
      width: number;
      height: number;
    });
  } else {
    // use existing canvas
    canvas = settings.canvas;
    if (settings.parent) {
      toHTMLElement(settings.parent).appendChild(canvas);
    }

    ({ context, gl, width, height } = resizeCanvas({
      canvas,
      context: settings.mode,
      width,
      height,
      pixelRatio,
      pixelated: settings.pixelated,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    }) as {
      context: SketchContext;
      gl?: WebGLRenderingContext | WebGL2RenderingContext;
      width: number;
      height: number;
    });
  }

  canvas.id = settings.id;

  return { canvas, context, gl, width, height, pixelRatio };
};

export const destroyCanvas = (canvas: HTMLCanvasElement) => {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
    canvas.remove();
  }
  // TODO:
  // also remove any reference to canvas
};

export const fitCanvasToParent = ({
  userSettings,
  settings,
  props,
}: {
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  // resizing canvas style when !fullscreen
  // TODO: add and check for `scaleCanvas` settings
  if (userSettings.dimensions) {
    // TODO: add to settings.sketchMargin ? canvasMargin
    const margin = 50; // px
    const canvasParent = props.canvas.parentElement!;

    // if canvas is child of body
    const parentWidth = canvasParent.clientWidth;
    const parentHeight = canvasParent.clientHeight;
    const scale = Math.min(
      1,
      Math.min(
        (parentWidth - margin * 2) / props.width,
        (parentHeight - margin * 2) / props.height,
      ),
    );
    props.canvas.style.transform = `scale(${scale})`;
  }
};
