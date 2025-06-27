import { getGlobalState, updateGlobalState } from "../store";
import type {
  Hotkeys,
  SketchProps,
  SketchStates,
  WebGL2Props,
  WebGLProps,
  WebGPUProps,
} from "../types/types";

export default ({
  props,
  states,
}: {
  states: SketchStates;
  props: SketchProps | WebGLProps | WebGL2Props | WebGPUProps;
}) => {
  let boundListener: ((ev: KeyboardEvent) => void) | null = null;

  const createKeydownHandler = (hotkeys: Hotkeys) => {
    return (ev: KeyboardEvent) => {
      if (ev.key === " ") {
        if (!hotkeys.togglePlay) return;
        ev.preventDefault();
        props.togglePlay();
      } else if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "s") {
        if (!hotkeys.exportFrame) return;
        ev.preventDefault();
        // save frame (still)
        props.exportFrame();
      } else if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key === "s") {
        if (!hotkeys.exportFrames) return;
        ev.preventDefault();
        // save frames (video)
        props.exportFrames();
      } else if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "k") {
        if (!hotkeys.git) return;
        if (import.meta.hot) {
          // git commit snapshot (image)
          import.meta.hot.send("ssam:git", {
            canvasId: props.canvas.id,
            format: "png",
          });
        }
      } else if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key === "k") {
        if (!hotkeys.git) return;
        if (import.meta.hot) {
          // git commit snapshot (video)
          // 1. send git message with "mp4" format.
          // 2. on "git-success" received, start mp4 recording
          import.meta.hot.send("ssam:git", {
            canvasId: props.canvas.id,
            format: "mp4",
          });
        }
      } else if (ev.key === "ArrowRight") {
        // a frame forward
        if (states.paused) {
          // TODO
          // REVIEW: frame needs to wrap around totalFrames
          // props.update({ frame: (props.frame + 1) % props.totalFrames });
        }
      } else if (ev.key === "ArrowLeft") {
        if (states.paused) {
          // TODO
          // props.update({ frame: props.frame - 1 });
        }
      }
      // else if (ev.key === "t") {
      // TEST
      // states.timeResetted = true;
      // }
    };
  };

  const add = (hotkeys: Hotkeys) => {
    if (boundListener) {
      window.removeEventListener("keydown", boundListener);
    }
    boundListener = createKeydownHandler(hotkeys);
    window.addEventListener("keydown", boundListener);
  };

  const remove = () => {
    if (boundListener) {
      window.removeEventListener("keydown", boundListener);
      boundListener = null;
    }
  };

  return { add, remove };
};
