/**
 * time keeping
 */

import type {
  BaseProps,
  SketchSettingsInternal,
  SketchStates,
} from "./types/types";

export const computeFrameInterval = (
  settings: SketchSettingsInternal,
  states: SketchStates
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
  // REVIEW: use ceil()?
  if (settings.playFps !== null && settings.duration !== Infinity) {
    settings.totalFrames = Math.floor(
      (settings.playFps * settings.duration) / 1000
    );
  }
};
export const computeExportTotalFrames = (settings: SketchSettingsInternal) => {
  if (settings.exportFps !== null && settings.duration !== Infinity) {
    settings.exportTotalFrames = Math.floor(
      (settings.exportFps * settings.duration) / 1000
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
  const fps = states.savingFrames ? exportFps : playFps;

  if (states.savingFrames) {
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
  const fps = states.savingFrames ? exportFps : playFps;

  states.startTime = states.timestamp;
  props.time = 0;
  props.playhead = 0;
  // REVIEW: why -1 ?
  props.frame = playFps ? 0 : -1;

  // states.lastTimestamp = 0;
  states.lastTimestamp = states.startTime - (fps ? 1000 / fps : 0);

  // console.log(states.timestamp, states.lastTimestamp);

  states.timeResetted = false;
};

// export const advanceFrame = (settings: SketchSettings) => {
// when recording (ie. gif), we only want to record a new frame, not duplicte in case of high refresh rate (exportFps !== playFps)
// (above may not be relevant anymore) but this may have usage in frame-by-frame navigation with array keys
// };
