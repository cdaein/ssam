import {
  BaseProps,
  SketchSettings,
  SketchSettingsInternal,
} from "./types/types";
import { createCanvas as create, resizeCanvas as resize } from "@daeinc/canvas";
import { toHTMLElement } from "@daeinc/dom";

export const createCanvas = (settings: SketchSettingsInternal) => {
  if (settings.canvas !== null && settings.canvas !== undefined) {
    if (settings.canvas.nodeName.toLowerCase() !== "canvas") {
      throw new Error("canvas must be an HTMLCanvasElement");
    }
  }

  let canvas: HTMLCanvasElement;
  let context:
    | CanvasRenderingContext2D
    | WebGLRenderingContext
    | WebGL2RenderingContext;
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
      context: settings.mode,
      width,
      height,
      pixelRatio,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    }));
  }

  canvas.id = settings.id;

  if (settings.pixelated) {
    canvas.style.imageRendering = "pixelated";
    if (settings.mode === "2d")
      (context as CanvasRenderingContext2D).imageSmoothingEnabled = false;
  }

  centerCanvasToWindow(canvas, settings);

  return { canvas, context, gl, width, height, pixelRatio };
};

export const destroyCanvas = (canvas: HTMLCanvasElement) => {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
    canvas.remove();
  }
  // TODO
  // also remove any reference to canvas
};

export const centerCanvasToWindow = (
  canvas: HTMLCanvasElement,
  settings: SketchSettingsInternal
) => {
  // canvas centering
  // TODO: needs extra scaling of style.width & height to fit window/container
  // REVIEW: this is probably be better done in index.html <style>
  //         but, for now, this module doesn't provide html file, so...
  if (settings.centered) {
    if (canvas.parentElement) {
      const canvasContainer = canvas.parentElement;
      // canvasContainer.style.width = "100vw";
      // canvasContainer.style.height = "100vh";
      canvasContainer.style.display = "flex";
      canvasContainer.style.justifyContent = "center";
      canvasContainer.style.alignItems = "center";

      if (!settings.scaleContext) {
        // TODO: centering does not work at pixelRatio=2
      }
    }
  } else {
    // scale canvas even when not centered.
    // canvas.style.width = 100 + "%";
    // canvas.style.height = 100 + "%";
    // canvas.style.maxWidth = `${settings.dimensions[0]}px`;
    // canvas.style.maxHeight = `${settings.dimensions[1]}px`;
  }
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
  if (userSettings.dimensions && settings.centered) {
    const margin = 50; // px // TODO: add to settings.sketchMargin ? canvasMargin
    const canvasParent = props.canvas.parentElement!;

    if (canvasParent.nodeName.toLowerCase() === "body") {
      // if canvas is child of body
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
    } else {
      // TODO: when custom parent & centered, weird scaling issue.
      //       how should it respond?
      // if (settings.centered) return;

      // scale canvas style to its parent
      const scaledDimension = Math.min(
        canvasParent.clientWidth,
        canvasParent.clientHeight
      );
      props.canvas.style.width = `${scaledDimension}px`;
      props.canvas.style.height = `${scaledDimension}px`;

      // scale canvas parent to its grand parent
      const canvasGrandParent = canvasParent.parentElement!;
      const grandParentWidth = canvasGrandParent.clientWidth;
      const grandParentHeight = canvasGrandParent.clientHeight;
      const scale = Math.min(
        1,
        Math.min(
          (grandParentWidth - margin * 2) / canvasParent.clientWidth,
          (grandParentHeight - margin * 2) / canvasParent.clientHeight
        )
      );
      canvasParent.style.transform = `scale(${scale})`;
    }
  }
};
