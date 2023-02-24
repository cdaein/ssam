import { getGlobalState, updateGlobalState } from "../store";
import type { SketchProps, SketchStates, WebGLProps } from "../types/types";

export default ({
  props,
  states,
}: {
  props: SketchProps | WebGLProps;
  states: SketchStates;
}) => {
  const handleKeydown = (ev: KeyboardEvent) => {
    if (ev.key === " ") {
      ev.preventDefault();
      props.togglePlay();
    } else if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "s") {
      ev.preventDefault();
      // save frame (still)
      props.exportFrame();
    } else if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key === "s") {
      ev.preventDefault();
      // save frames (video)
      if (!getGlobalState().savingFrames) {
        updateGlobalState({
          savingFrames: true,
          frameRequested: true,
          recordState: "start",
        });
      } else {
        updateGlobalState({ recordState: "end" });
      }
    } else if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "k") {
      if (import.meta.hot) {
        // git commit snapshot (image)
        import.meta.hot.send("ssam:git", {
          canvasId: props.canvas.id,
          format: "png",
        });
      }
    } else if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key === "k") {
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

  const add = () => {
    window.addEventListener("keydown", handleKeydown);
  };

  const remove = () => {
    window.removeEventListener("keydown", handleKeydown);
  };

  return { add, remove };
};
