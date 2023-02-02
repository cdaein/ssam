import type {
  SketchLoop,
  SketchProps,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "../types/types";

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
      if (!states.savingFrames) {
        states.savingFrames = true;
      } else {
        states.captureDone = true;
      }
    } else if ((ev.metaKey || ev.ctrlKey) && ev.key === "k") {
      console.log("git commit is not yet implemented");
      // TODO: if in dev server, send the message to the server to git-commit.
    } else if (ev.key === "ArrowRight") {
      // a frame forward
      if (states.paused) {
        // TODO
        // REVIEW: frame needs to wrap totalFrames
        props.update({ frame: props.frame + 1 });
      }
    } else if (ev.key === "ArrowLeft") {
      if (states.paused) {
        // TODO
        props.update({ frame: props.frame - 1 });
      }
    } else if (ev.key === "t") {
      // TEST
      states.timeResetted = true;
    }
  };

  const add = () => {
    window.addEventListener("keydown", handleKeydown);
  };

  const remove = () => {
    window.removeEventListener("keydown", handleKeydown);
  };

  return { add, remove };
};
