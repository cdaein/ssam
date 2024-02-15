import { resizeCanvas } from "@daeinc/canvas";
import { fitCanvasToParent } from "../canvas";
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

    // when fullscreen (either new canvas or existing one)
    if (userSettings.dimensions === undefined) {
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
        pixelated: settings.pixelated,
        scaleContext: settings.scaleContext,
      }));

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

    // FIX: used to check for "centered", now it's gone,
    // check for scaleCanvas?
    // if (settings.centered) {
    fitCanvasToParent({
      userSettings,
      settings,
      props,
    });
    // }

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
