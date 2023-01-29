import { resizeCanvas } from "@daeinc/canvas";
import type {
  SketchProps,
  SketchRender,
  SketchResize,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "../types/types";

// window resize event
// REVIEW: do i need to separate window resize and canvas resize?
// canvas style change: window resize
// resize() return: canvas resize
export default ({
  canvas,
  props,
  userSettings,
  settings,
  render,
  resize,
}: {
  canvas: HTMLCanvasElement;
  props: SketchProps | WebGLProps;
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  render: SketchRender;
  resize: SketchResize;
}) => {
  const handleResize = () => {
    // when fullscreen & new canvas
    if (
      userSettings.dimensions === undefined &&
      userSettings.canvas === undefined
    ) {
      // REVIEW: how to handle if canvas parent is not 100% of window?
      //  1. instead of always window.innerWidth, use parent's 100%?
      //  2. if parent, don't go into fullscreen at all.
      //  3. inline-styling will override anyways...

      ({ width: props.width, height: props.height } = resizeCanvas({
        canvas,
        context: settings.mode,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: Math.max(settings.pixelRatio, 1),
        scaleContext: settings.scaleContext,
      }));
      // call only when canvas size has changed (ie. fullscreen)
      resize(props);
    }
    // render when resized
    render(props);

    // resizing canvas style (when !fullscreen & centered)
    // REVIEW: this should be better done with CSS class rules.
    if (userSettings.dimensions !== undefined && settings.centered) {
      const margin = 50; // px // TODO: add to settings
      const canvasParent = canvas.parentElement!;
      const parentWidth = canvasParent.clientWidth;
      const parentHeight = canvasParent.clientHeight;
      const scale = Math.min(
        1,
        Math.min(
          (parentWidth - margin * 2) / props.width,
          (parentHeight - margin * 2) / props.height
        )
      );
      canvas.style.transform = `scale(${scale})`;
    }
  };

  const add = () => {
    window.addEventListener("resize", handleResize);
  };

  const remove = () => {
    window.removeEventListener("resize", handleResize);
  };

  return { add, remove, handleResize };
};
