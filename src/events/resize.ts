import { resizeCanvas } from "@daeinc/canvas";
import { fitCanvasToWindow } from "../canvas";
import type {
  SketchProps,
  SketchRender,
  SketchResize,
  SketchSettings,
  SketchSettingsInternal,
  WebGLProps,
} from "../types/types";

// window resize event
// REVIEW: do i need to separate window resize and canvas resize?
// canvas style change: window resize
// resize() return: canvas resize
export default ({
  props,
  userSettings,
  settings,
  render,
  resize,
}: {
  props: SketchProps | WebGLProps;
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  render: SketchRender;
  resize: SketchResize;
}) => {
  const { canvas } = props;
  // check if canvas size changed

  const handleResize = () => {
    // REVIEW: how to handle if canvas parent is not 100% of window?
    //  1. instead of always window.innerWidth, use parent's 100%?
    //  2. if parent, don't go into fullscreen at all.
    //  3. inline-styling will override anyways...

    // when fullscreen & new canvas
    if (
      userSettings.dimensions === undefined &&
      userSettings.canvas === undefined
    ) {
      // console.log("handle resize");
      // the event is attached to the window, so no need to check for now
      // const doResize =
      //   canvas.width !== canvas.clientWidth ||
      //   canvas.height !== canvas.clientHeight;

      ({ width: props.width, height: props.height } = resizeCanvas({
        canvas,
        context: settings.mode,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: Math.max(settings.pixelRatio, 1),
        scaleContext: settings.scaleContext,
      }));

      if (settings.pixelated) {
        canvas.style.imageRendering = "pixelated";
        if (settings.mode === "2d")
          (props as SketchProps).context.imageSmoothingEnabled = false;
      }

      // if (doResize) {
      try {
        resize(props);
        render(props);
      } catch (err: any) {
        console.error("Error at resize/render", err);
        return null;
      }
      // }
    }

    if (settings.centered) {
      fitCanvasToWindow({
        userSettings,
        settings,
        props,
      });
    }

    return;
  };

  const add = () => {
    window.addEventListener("resize", handleResize);
  };

  const remove = () => {
    window.removeEventListener("resize", handleResize);
  };

  return { add, remove };
};
