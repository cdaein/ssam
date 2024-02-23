import {
  BaseProps,
  SketchSettings,
  SketchSettingsInternal,
} from "./types/types";
import { createCanvas as create, resizeCanvas } from "@daeinc/canvas";

export const createCanvas = (settings: SketchSettingsInternal) => {
  if (settings.canvas !== null && settings.canvas !== undefined) {
    if (settings.canvas.nodeName.toLowerCase() !== "canvas") {
      throw new Error("Pass an HTMLCanvasElement");
    }
  }

  // 1. use settings dimensions.
  // 2. if no settings.dimensions, and if existing canvas, use parent dimensions. (or body)
  // 3. else, use window dimensions
  const [width, height] =
    settings.dimensions || settings.canvas
      ? [
          (settings.canvas?.parentElement || document.body).clientWidth,
          (settings.canvas?.parentElement || document.body).clientHeight,
        ]
      : [window.innerWidth, window.innerHeight];
  const pixelRatio = Math.max(settings.pixelRatio, 1);

  if (settings.canvas === undefined || settings.canvas === null) {
    // create new canvas
    // use settings.parent or body (default)
    const canvasObj = create({
      parent: settings.parent,
      context: settings.mode,
      width,
      height,
      pixelRatio,
      pixelated: settings.pixelated,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    });
    canvasObj.canvas.id = settings.id;
    return { ...canvasObj, pixelRatio };
  } else {
    // use existing canvas (use existing DOM tree)
    // ignore settings.parent and use existing canvas parent (or should i switch parent?)
    const canvasObj = resizeCanvas({
      canvas: settings.canvas,
      context: settings.mode,
      width,
      height,
      pixelRatio,
      pixelated: settings.pixelated,
      scaleContext: settings.scaleContext,
      attributes: settings.attributes,
    });
    canvasObj.canvas.id = settings.id;
    return { ...canvasObj, pixelRatio };
  }
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
  props: BaseProps<"2d" | "webgl" | "webgl2">;
}) => {
  // resizing canvas style when !fullscreen
  if (userSettings.dimensions && settings.scaleToParent) {
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
