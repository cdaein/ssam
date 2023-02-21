import { formatFilename } from "../helpers";
import type {
  SketchLoop,
  SketchProps,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "../types/types";

export default ({
  settings,
  props,
  states,
}: {
  settings: SketchSettingsInternal;
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
      if (!states.savingFrames) {
        states.savingFrames = true;
        states.recordState = "start";
      } else {
        states.recordState = "end";

        // should ask to update savingFrames but not here
        // b/c need to endRecord() first
        // states.savingFrames = false;
      }
    } else if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "k") {
      if (import.meta.hot) {
        // git commit snapshot (image)
        const { filename, prefix, suffix } = settings;
        const filenameFormatted = `${formatFilename({
          filename,
          prefix,
          suffix,
        })}`;
        import.meta.hot.send("ssam:git", {
          commitMessage: filenameFormatted,
          canvasId: props.canvas.id,
          format: "png",
        });
      }
    } else if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key === "k") {
      if (import.meta.hot) {
        // git commit snapshot (video)
        const { filename, prefix, suffix } = settings;
        const filenameFormatted = `${formatFilename({
          filename,
          prefix,
          suffix,
        })}`;
        import.meta.hot.send("ssam:git", {
          commitMessage: filenameFormatted,
          canvasId: props.canvas.id,
          format: "webm",
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
