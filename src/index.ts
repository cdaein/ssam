/**
 * - class cannot have async constructor
 * - function can't handle hoisting for render() method
 */

import { createProps } from "./props";
import { createSettings } from "./settings";
import { createStates } from "./states";
import {
  Sketch,
  SketchLoop,
  SketchProps,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
  WebGLProps,
} from "./types/types";
import resizeHandler from "./events/resize";
import keydownHandler from "./events/keydown";
import {
  computeFrame,
  computeLastTimestamp,
  computePlayhead,
  resetTime,
} from "./time";
import {
  setupWebMRecord,
  exportWebM,
  endWebMRecord,
} from "./recorders/export-frames.webm";
import {
  setupGifAnimRecord,
  exportGifAnim,
  endGifAnimRecord,
} from "./recorders/export-frames-gif";
import { fitCanvasToWindow } from "./canvas";

export type {
  FrameFormat,
  FramesFormat,
  GifOptions,
  Sketch,
  SketchLoop,
  SketchProps,
  SketchRender,
  SketchResize,
  SketchSettings,
  WebGLProps,
} from "./types/types";

export const ssam = async (sketch: Sketch, settings: SketchSettings) => {
  const wrap = new Wrap();
  try {
    await wrap.run(sketch, settings);
  } catch (err: any) {
    console.error("Error:", err); // this is more descriptive
    return null;
  }
  return;
};

export class Wrap {
  // render!: SketchRender;
  constructor() {
    // use ssam() function for interfacing with user. (class constructor can't use async)
    // use class to hoist render function and to make it available within init
  }

  async run(sketch: Sketch, userSettings: SketchSettings) {
    // combine settings; a few may have null or undefined values (ex. canvas)
    const settings = createSettings({
      main: userSettings,
    }) as SketchSettingsInternal;

    // TODO: now with class structure, use class methods
    const states = createStates({ settings });

    const props = createProps({
      wrap: this,
      settings,
      states,
      renderProp: () => this.render(props),
      resizeProp: () => this.resize(props),
    });

    try {
      await sketch(props);
    } catch (err: any) {
      console.error("Error at sketch init:", err);
      return null;
    }

    const { add: addResize } = resizeHandler({
      props,
      userSettings,
      settings,
      render: this.render,
      resize: this.resize,
    });
    const { add: addKeydown } = keydownHandler({
      props,
      states,
    });

    fitCanvasToWindow({
      userSettings,
      settings,
      props,
    });

    // render at least once
    this.render(props);

    // animation render loop

    // there's time delay between first render in handleResize() and first loop render, resulting in animatiom jump. this compesates for that delay
    let firstLoopRender = true;
    let firstLoopRenderTime = 0;

    const loop: SketchLoop = (timestamp: number) => {
      if (firstLoopRender) {
        firstLoopRenderTime = timestamp;
        firstLoopRender = false;
        window.requestAnimationFrame(loop);
        return;
      }

      states.timestamp =
        timestamp - firstLoopRenderTime - states.pausedDuration;

      if (!states.savingFrames) {
        playLoop({
          timestamp: timestamp - firstLoopRenderTime,
          settings,
          states,
          props,
        });
      } else {
        recordLoop({ canvas: props.canvas, settings, states, props });
      }
    };
    if (settings.animate) window.requestAnimationFrame(loop);

    if (settings.hotkeys) {
      addResize();
      addKeydown();
    }

    const playLoop = async ({
      timestamp,
      settings,
      states,
      props,
    }: {
      timestamp: number;
      settings: SketchSettingsInternal;
      states: SketchStates;
      props: SketchProps | WebGLProps;
    }) => {
      // when paused, accumulate pausedDuration
      if (states.paused) {
        states.pausedDuration = timestamp - states.pausedStartTime;
        window.requestAnimationFrame(loop);
        return;
      }

      if (states.timeResetted) {
        resetTime({ settings, states, props });
      }

      // time
      // 1. better dt handling
      // props.time = (states.timestamp - states.startTime) % props.duration;
      // 2. full reset each loop. but, dt is one-frame (8 or 16ms) off
      props.time = states.timestamp - states.startTime;

      if (props.time >= props.duration) {
        resetTime({ settings, states, props });
      }
      // deltaTime
      props.deltaTime = states.timestamp - states.lastTimestamp;

      // throttle frame rate
      if (states.frameInterval !== null) {
        if (props.deltaTime < states.frameInterval) {
          window.requestAnimationFrame(loop);
          return;
        }
      }

      computePlayhead({
        settings,
        props,
      });
      computeFrame({ settings, states, props });
      // update lastTimestamp for deltaTime calculation
      computeLastTimestamp({ states, props });

      try {
        await this.render(props);
      } catch (err: any) {
        console.error(err);
        return null;
      }
      window.requestAnimationFrame(loop);

      return;
    };

    // for manual counting when recording (use only for recording)
    let _frameCount = 0;

    const recordLoop = async ({
      canvas,
      settings,
      states,
      props,
    }: {
      canvas: HTMLCanvasElement;
      settings: SketchSettingsInternal;
      states: SketchStates;
      props: SketchProps | WebGLProps;
    }) => {
      // TODO: what if duration is not set?
      if (!states.captureReady) {
        // reset time only if looping (duration set)
        // REVIEW: whether to resetTime() needs more testing
        if (props.duration) resetTime({ settings, states, props });

        settings.framesFormat.forEach((format) => {
          if (format !== "webm" && format !== "gif") {
            throw new Error(`${format} export is not supported`);
          }
          if (format === "webm") {
            setupWebMRecord({ canvas, settings });
          } else if (format === "gif") {
            setupGifAnimRecord({ canvas, settings });
          }
        });

        states.captureReady = true;
        props.recording = true;
      }

      // deltaTime
      props.deltaTime = 1000 / settings.exportFps;
      // time
      props.time = _frameCount * props.deltaTime;

      computePlayhead({
        settings,
        props,
      });
      props.frame = _frameCount;
      computeLastTimestamp({ states, props });

      try {
        await this.render(props);
      } catch (err: any) {
        console.error(err);
        return null;
      }
      window.requestAnimationFrame(loop);

      _frameCount += 1;

      // save frames
      settings.framesFormat.forEach((format) => {
        if (format === "webm") {
          exportWebM({ canvas, settings, states, props });
        } else if (format === "gif") {
          {
            let context: any; // REVIEW
            if (settings.mode === "2d") {
              context = (props as SketchProps).context;
            } else if (
              settings.mode === "webgl" ||
              settings.mode === "webgl2"
            ) {
              context = (props as WebGLProps).gl;
            }
            exportGifAnim({ canvas, context, settings, states, props });
          }
        }
      });

      if (props.frame >= settings.exportTotalFrames - 1) {
        states.captureDone = true;
      }

      if (states.captureDone) {
        settings.framesFormat.forEach((format) => {
          if (format === "webm") {
            endWebMRecord({ canvas, settings });
          } else if (format === "gif") {
            endGifAnimRecord({ canvas, settings });
          }
        });

        states.captureReady = false;
        states.captureDone = false;
        states.savingFrames = false;
        states.timeResetted = true; // playLoop should start fresh

        props.recording = false;

        _frameCount = 0; // reset local frameCount for next recording
      }
      return;
    };
    return;
  }

  // REVIEW: does this have to by async method?
  render(props: SketchProps | WebGLProps): void | Promise<void> {
    // this will be overwritten in sketch by wrap.render()
    // without this declaration, TS thinks it doesn't exist. (sketch closure)
    return Promise.resolve();
  }

  resize(props: SketchProps | WebGLProps) {
    // same as this.render()
  }

  // helper method. same as { animate: false }
  noLoop() {
    // TODO: need this.settings first
    // settings.animate = false;
  }
}
