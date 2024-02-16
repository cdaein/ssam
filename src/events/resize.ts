import { resizeCanvas } from "@daeinc/canvas";
import { fitCanvasToParent } from "../canvas";
import type {
  FinalProps,
  SketchMode,
  SketchRender,
  SketchResize,
  SketchSettings,
  SketchSettingsInternal,
} from "../types/types";

// window resize event
// REVIEW: do i need to separate window resize and canvas resize?
// canvas style change: window resize
// resize() return: canvas resize
export default <Mode extends SketchMode>({
  props,
  userSettings,
  settings,
  render,
  resize,
}: {
  props: FinalProps<Mode>;
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  render: SketchRender<Mode>;
  resize: SketchResize<Mode>;
}) => {
  const { canvas } = props;
  // check if canvas size changed

  const handleResize = () => {
    // TODO: for fullscreen canvas,
    // - what if parent has padding? how to handle transform scaling and positioning?
    //  - or, admit this is limitation, and just wrap the parent within another <div> and handle spacing there,
    //    so, ssam can keep 100% size.
    // - this may be related to the fitCanvasToParent used below.

    // when fullscreen (either new canvas or existing one)
    if (userSettings.dimensions === undefined) {
      // the event is attached to the window, so no need to check for now
      // const doResize =
      //   canvas.width !== canvas.clientWidth ||
      //   canvas.height !== canvas.clientHeight;

      const parentElement = canvas.parentElement || document.body;

      // console.log(parentElement.clientWidth, window.innerWidth);
      // console.log(parentElement.clientHeight, window.innerHeight);

      ({ width: props.width, height: props.height } = resizeCanvas({
        canvas,
        context: settings.mode,
        width: parentElement.clientWidth,
        height: parentElement.clientHeight,
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
