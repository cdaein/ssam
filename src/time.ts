/**
 * time keeping
 */

import { getGlobalState, updateGlobalState } from "./store";
import type {
  BaseProps,
  SketchSettingsInternal,
  SketchStates,
} from "./types/types";

export const computeFrameInterval = (
  settings: SketchSettingsInternal,
  states: SketchStates,
) => {
  states.frameInterval =
    settings.playFps !== null ? 1000 / settings.playFps : null;
};

export const computeExportFps = (settings: SketchSettingsInternal) => {
  settings.exportFps = Math.max(Math.floor(settings.exportFps), 1);
};

export const computePlayFps = (settings: SketchSettingsInternal) => {
  if (settings.playFps !== null) {
    settings.playFps = Math.max(Math.floor(settings.playFps), 1);
  }
};

export const computeTotalFrames = (settings: SketchSettingsInternal) => {
  // userSettings doesn't have totalFrames, but internally, both will be computed.
  // when both are Infinity, animation will continue to run,
  // time/frame updates, playhead doesn't.
  if (settings.playFps !== null && settings.duration !== Infinity) {
    // REVIEW: use ceil()?
    settings.totalFrames = Math.floor(
      (settings.playFps * settings.duration) / 1000,
    );
  }
};
export const computeExportTotalFrames = (settings: SketchSettingsInternal) => {
  if (settings.exportFps !== null && settings.duration !== Infinity) {
    settings.exportTotalFrames = Math.floor(
      (settings.exportFps * settings.duration * settings.numLoops) / 1000,
    );
  }
};

export const computePlayhead = ({
  settings,
  props,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  const { duration } = settings;
  props.playhead = duration !== Infinity ? props.time / duration : 0;
};

export const computePrevFrame = ({
  states,
  props,
}: {
  states: SketchStates;
  props: BaseProps;
}) => {
  // call before updating props.frame to a new value
  updateGlobalState({ prevFrame: props.frame });
  states.prevFrame = props.frame;
};

export const computeFrame = ({
  settings,
  states,
  props,
}: {
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps;
}) => {
  let { duration, playFps, exportFps, totalFrames } = settings;
  const fps = getGlobalState().savingFrames ? exportFps : playFps;

  if (getGlobalState().savingFrames) {
    totalFrames = Math.floor((exportFps * duration) / 1000);
  }

  // 4 cases
  if (duration !== Infinity) {
    if (fps !== null) {
      props.frame = Math.floor(props.playhead * totalFrames);
    } else {
      props.frame += 1;
    }
  } else {
    if (fps !== null) {
      props.frame = Math.floor((props.time * fps) / 1000);
    } else {
      props.frame += 1;
    }
  }
};

export const computeLoopCount = ({
  settings,
  props,
}: {
  settings: SketchSettingsInternal;
  props: BaseProps;
}) => {
  const prevFrame = getGlobalState().prevFrame;

  if (settings.numLoops > 1) {
    /**
     * REVIEW: needs improvement
     * the condition to check whether it's a new loop is different for when playing and recording due to (i think):
     * - first play frame is rendered in setup, not in playLoop.
     * - prevFrame===frame (0===0) situation
     * - playLoop and recordLoop has different order of function calls so values are updated in different order.
     * - right after recording, playLoop starts with all values resetted, thus, wrong value for prevFrame.
     */
    // const newLoop = getGlobalState().savingFrames
    //   ? prevFrame > props.frame
    //   : prevFrame >= props.frame;

    // above condition doesn't work: due to time-based counting, some frames are omitted (or same frame value is repeated).
    // ex. { prevFrame: 1, frame: 3} => { prevFrame: 3, frame: 3 } WRONG CONDITION
    // so, just check if frame is resetted to 0.
    const newLoop = props.frame === 0;

    if (prevFrame !== null && newLoop) {
      props.loopCount = (props.loopCount + 1) % settings.numLoops;
      updateGlobalState({ loopCount: props.loopCount }); // do i need this? is globalState.loopCount ever used?
    }
  }
};

export const computeLastTimestamp = ({
  states,
  props,
}: {
  states: SketchStates;
  props: BaseProps;
}) => {
  states.lastTimestamp = states.frameInterval
    ? states.timestamp - (props.deltaTime % states.frameInterval)
    : states.timestamp;
};

// REVIEW: when reset, delta time is always 1 frame duration more (ex. 8ms on 120fps)
export const resetTime = ({
  settings,
  states,
  props,
}: {
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps;
}) => {
  const { playFps, exportFps } = settings;
  const fps = getGlobalState().savingFrames ? exportFps : playFps;

  states.startTime = states.timestamp;
  props.time = 0;
  props.playhead = 0;
  // REVIEW: can't remember why i set this to be -1. 🤷
  // props.frame = playFps ? 0 : -1;
  props.frame = 0;

  // states.lastTimestamp = 0;
  states.lastTimestamp = states.startTime - (fps ? 1000 / fps : 0);

  // console.log(states.timestamp, states.lastTimestamp);

  states.timeResetted = false;
};

// export const advanceFrame = (settings: SketchSettings) => {
// when recording (ie. gif), we only want to record a new frame, not duplicte in case of high refresh rate (exportFps !== playFps)
// (above may not be relevant anymore) but this may have usage in frame-by-frame navigation with array keys
// };
