import { saveCanvasFrame } from "../recorders/export-frame";
import { getGlobalState, updateGlobalState } from "../store";
import { SketchStates, SketchSettingsInternal } from "../types/types";

export const ssamWarnCallback = (data: any) => {
  console.warn(`${data.msg}`);
};

export const ssamLogCallback = (data: any) => {
  console.log(`${data.msg}`);
};

export const ssamFfmpegReqframeCallback = () => {
  // state that is tied to HMR need to come from global
  updateGlobalState({
    frameRequested: true,
  });
};

// due to gitSuccessCallback relying on this.states and this.settings,
// can't be used directly within listener callback.
// it needs to be wrapped with a function that can take them as arguments.
// returned callback function is a named class method,
// and can be referenced later to be removed in ws listener.
export const ssamGitSuccessCallbackWrapper =
  (states: SketchStates, settings: SketchSettingsInternal) => (data: any) => {
    if (data.format === "mp4") {
      if (!getGlobalState().savingFrames) {
        updateGlobalState({
          savingFrames: true,
          frameRequested: true,
          recordState: "start",
          commitHash: data.hash,
        });
      }
    }
    // REVIEW: should i use internal variable instead?
    const canvas = document.querySelector(`#${data.canvasId}`);
    saveCanvasFrame({
      canvas: canvas as HTMLCanvasElement,
      states,
      settings,
      hash: data.hash,
    });
  };
