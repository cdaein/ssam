/**
 * time keeping
 */

import type {
  BaseProps,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
} from "./types/types";

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

// REVIEW: when reset delta time is always 1 frame duration more (ex. 8ms on 120fps)
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
  props.frame = playFps ? 0 : -1;

  // states.lastTimestamp = 0;
  states.lastTimestamp = states.startTime - (fps ? 1000 / fps : 0);

  // console.log(states.timestamp, states.lastTimestamp);

  states.timeResetted = false;
};

//---------- unused below

/**
 *  REVIEW: props.deltaTime is 0 at start. to calculate a value, set it BEFORE draw(props) in loop(), but for now, this will do.
 *
 * @param param0
 */
// export const advanceTime = ({
//   props,
//   settings,
//   states,
// }: {
//   props: BaseProps;
//   settings: SketchSettingsInternal;
//   states: SketchStates;
// }) => {
//   const { duration } = settings;
//   // const fps = states.savingFrames ? exportFps : playFps;

//   // REVIEW: set inital value to null, instead of 0?
//   // clean start again (this is to avoid calling performance.now again which adds slight discrepancy)
//   // if (states.startTime === 0) {
//   //   states.startTime = states.timestamp;
//   //   states.lastStartTime = states.startTime;
//   //   states.lastTimestamp = states.timestamp;
//   // }

//   // time
//   props.time = (states.timestamp - states.startTime) % duration;

//   // deltaTime
//   props.deltaTime = states.timestamp - states.lastTimestamp;

//   // old
//   // props.playhead = props.playhead + props.deltaTime / duration

//   // current
//   props.playhead = duration !== Infinity ? props.time / duration : 0;

//   // trying
//   // if (duration === Infinity) {
//   //   // FIX: fps throttle doesn't work when using "time", instead of "playhead"
//   //   //      also, snapping is not accurate representation of time at any moment
//   //   //      as it adds or subtracts from current time
//   //   //      maybe, useful for recording for precise time advance,
//   //   //      but users can do it on their end.
//   //   props.playhead = states.frameInterval !== null ? 0 : 0;
//   // } else {
//   //   props.playhead =
//   //     states.frameInterval !== null
//   //       ? snapFloorBy(props.time / duration, states.frameInterval / duration)
//   //       : props.time / duration;
//   // }

//   computeFrame({ settings, props });
// };

export const advanceFrame = (settings: SketchSettings) => {
  // when recording (ie. gif), we only want to record a new frame, not duplicte in case of high refresh rate (exportFps !== playFps)
};

//==================================================
// below is copied from index.ts
// two other ideas i explored for time keeping. leaving them here for reference just in case.

// animation loop (2nd method)
// {
//   let startTimeInMillis: number | undefined;
//   let previousTimeInMillis = 0;

//   let lastTime = 0;
//   let elapsedTimeInMillis = 0;

//   const loop = (timestamp: number) => {
//     if (startTimeInMillis === undefined) {
//       startTimeInMillis = timestamp;
//     }
//     // compute time
//     elapsedTimeInMillis = timestamp - startTimeInMillis;
//     props.playhead = props.duration
//       ? elapsedTimeInMillis / durationInMillis
//       : 0;
//     props.time = elapsedTimeInMillis;
//     props.deltaTime = elapsedTimeInMillis - previousTimeInMillis;
//     props.frame = props.duration
//       ? Math.floor(props.playhead * totalFrames)
//       : Math.floor(props.time * exportFps);

//     // const currentTime = timestamp;
//     // const deltaTime = currentTime - lastTime;
//     // console.log({ deltaTime });
//     // lastTime = currentTime;

//     // console.log(props.deltaTime);

//     // update time
//     previousTimeInMillis = elapsedTimeInMillis;

//     // if (props.frame >= totalFrames) {
//     if (props.playhead >= 1) {
//       startTimeInMillis = timestamp;
//       props.playhead = 0;
//       // props.time = 0;
//     } else {
//       draw(props);
//     }

//     // console.log(props.playhead);

//     window.requestAnimationFrame(loop);
//   };
//   // window.requestAnimationFrame(loop);
// }

// // animation loop
// {
//   let startTimeInMillis = performance.now();
//   let previousTimeInMillis = startTimeInMillis;

//   const loop = (timestamp: number) => {
//     // draw(props);

//     // time management
//     // REVIEW
//     const elapsedTimeInMillis = performance.now() - startTimeInMillis;

//     // FIX: goes slightly over 1
//     //      one solution is Math.min(val, 1)
//     props.playhead = props.duration
//       ? elapsedTimeInMillis / durationInMillis
//       : 0;
//     // FIX: goes over duration
//     props.time = elapsedTimeInMillis;
//     props.deltaTime = elapsedTimeInMillis - previousTimeInMillis;
//     props.frame = props.duration
//       ? Math.floor(props.playhead * totalFrames)
//       : Math.floor(props.time * exportFps);

//     // update time
//     previousTimeInMillis = elapsedTimeInMillis;
//     if (props.playhead >= 1) {
//       startTimeInMillis = performance.now();
//     } else {
//       draw(props);
//     }
//   };
//   // loop(startTimeInMillis);
// }
