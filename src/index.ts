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
import { getGlobalState, updateGlobalState } from "./store";

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

let wrap: Wrap | null;

export const ssam = async (sketch: Sketch, settings: SketchSettings) => {
  const wrap = new Wrap();
  try {
    await wrap.setup(sketch, settings);
    wrap.run();
  } catch (err) {
    console.error(err);
    return null;
  }
  return;
};

export class Wrap {
  userSettings!: SketchSettings;
  settings!: SketchSettingsInternal;
  states!: SketchStates;
  props!: SketchProps | WebGLProps;
  removeResize!: () => void;
  removeKeydown!: () => void;
  unload?: () => void;
  private _frameCount!: number;
  private raf!: number;
  globalState!: Record<string, any>;
  count!: number;
  loop!: (timestamp: number) => void;

  constructor() {
    // use ssam() function for interfacing with user. (class constructor can't use async)
    // use class to hoist render function and to make it available within init
    return this;
  }

  async setup(sketch: Sketch, userSettings: SketchSettings) {
    this.userSettings = userSettings;

    // for manual counting when recording (use only for recording)
    this._frameCount = 0;
    this.raf = 0;

    this.globalState = getGlobalState();

    // combine settings; a few may have null or undefined values (ex. canvas)
    this.settings = createSettings({
      main: userSettings,
    }) as SketchSettingsInternal;
    this.states = <SketchStates>createStates({ settings: this.settings });
    this.props = createProps({
      wrap: this,
      settings: this.settings,
      states: this.states,
      renderProp: () => this.render(this.props as SketchProps | WebGLProps),
      resizeProp: () => this.resize(this.props as SketchProps | WebGLProps),
    });

    // this step is transitory
    this.states = {
      ...this.states,
      startTime: this.globalState.startTime,
      lastStartTime: this.globalState.lastStartTime,
      pausedStartTime: this.globalState.pausedStartTime,
      pausedDuration: this.globalState.pausedDuration,
      timestamp: this.globalState.timestamp,
      lastTimestamp: this.globalState.lastTimestamp,
      // frameInterval: null, // REVIEW
      firstLoopRender: this.globalState.firstLoopRender, // REVIEW
      firstLoopRenderTime: this.globalState.firstLoopRenderTime,
    };

    // props are just a collection of internally tracked data
    this.props = {
      ...this.props,
      playhead: this.globalState.playhead,
      frame: this.globalState.frame,
      time: this.globalState.time,
      // deltaTime: this.globalState.deltaTime,
    };

    try {
      await sketch(this.props);
    } catch (err: any) {
      console.error("Error at sketch init:", err);
      return null;
    }

    const { add: addResize, remove: removeResize } = resizeHandler({
      wrap: this,
      props: this.props,
      userSettings,
      settings: this.settings,
      render: this.render,
      resize: this.resize,
    });

    const { add: addKeydown, remove: removeKeydown } = keydownHandler({
      props: this.props,
      states: this.states,
    });

    if (this.settings.hotkeys) {
      addResize();
      addKeydown();
    }
    // REVIEW: bind(this)?
    this.removeResize = removeResize;
    this.removeKeydown = removeKeydown;

    fitCanvasToWindow({
      userSettings,
      settings: this.settings,
      props: this.props,
    });

    // render at least once
    this.render(this.props);

    return;
  }

  hotReload() {
    this.unloadCombined();
  }

  private unloadCombined() {
    // cancel any ongoing animation
    window.cancelAnimationFrame(this.raf);

    // remove event listeners
    this.removeResize();
    this.removeKeydown();

    // remove canvas so it can be re-created after hot-reload
    this.props.canvas.width = 0;
    this.props.canvas.height = 0;
    this.props.canvas.remove();

    // user clean-up (remove any side deffects)
    this.unload && this.unload();
  }

  dispose() {
    updateGlobalState({
      // from states
      startTime: this.states.startTime,
      lastStartTime: this.states.lastStartTime,
      pausedStartTime: this.states.pausedStartTime,
      pausedDuration: this.states.pausedDuration,
      timestamp: this.states.timestamp,
      lastTimestamp: this.states.lastTimestamp,
      // frameInterval: null, // REVIEW
      // firstLoopRender: this.states.firstLoopRender, // REVIEW
      firstLoopRenderTime: this.states.firstLoopRenderTime,
      // from props
      playhead: this.props.playhead,
      frame: this.props.frame,
      time: this.props.time,
      deltaTime: this.props.deltaTime,
    });
  }

  run() {
    // animation render loop
    this.loop = (timestamp: number) => {
      // there's time delay between first render in handleResize() and first loop render, resulting in animatiom jump. this compesates for that delay
      if (this.states.firstLoopRender) {
        this.states.firstLoopRenderTime = timestamp;
        this.states.firstLoopRender = false;
        this.raf = window.requestAnimationFrame(this.loop);
        return;
      }

      this.states.timestamp =
        timestamp -
        this.states.firstLoopRenderTime -
        this.states.pausedDuration;

      if (!this.states.savingFrames) {
        this.playLoop({ timestamp });
      } else {
        this.recordLoop();
      }
    };
    if (this.settings.animate)
      this.raf = window.requestAnimationFrame(this.loop);
  }

  async playLoop({ timestamp }: { timestamp: number }) {
    timestamp = timestamp - this.states.firstLoopRenderTime;

    // when paused, accumulate pausedDuration
    if (this.states.paused) {
      this.states.pausedDuration = timestamp - this.states.pausedStartTime;
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    if (this.states.timeResetted) {
      resetTime({
        settings: this.settings,
        states: this.states,
        props: this.props,
      });
    }

    // time
    // 1. better dt handling
    // props.time = (states.timestamp - states.startTime) % props.duration;
    // 2. full reset each loop. but, dt is one-frame (8 or 16ms) off
    this.props.time =
      this.states.timestamp - this.states.startTime + this.states.timeNavOffset;

    // FIX: props.time is negative after hot-reload. at hot-reload,
    //      props.time = props.time - states.timestamp
    //      props.time resets itself each loop
    //      states.timestamp continues to increase
    // =>   firstLoopRender-related, i think..
    console.log(this.props.time, this.states.timestamp, this.states.startTime);

    if (this.props.time >= this.props.duration) {
      resetTime({
        settings: this.settings,
        states: this.states,
        props: this.props,
      });
    }
    // deltaTime
    this.props.deltaTime = this.states.timestamp - this.states.lastTimestamp;

    // throttle frame rate
    if (this.states.frameInterval !== null) {
      if (this.props.deltaTime < this.states.frameInterval) {
        this.raf = window.requestAnimationFrame(this.loop);
        return;
      }
    }

    computePlayhead({
      settings: this.settings,
      props: this.props,
    });
    computeFrame({
      settings: this.settings,
      states: this.states,
      props: this.props,
    });
    // update lastTimestamp for deltaTime calculation
    computeLastTimestamp({ states: this.states, props: this.props });

    try {
      await this.render(this.props);
    } catch (err: any) {
      console.error(err);
      return null;
    }
    this.raf = window.requestAnimationFrame(this.loop);

    return;
  }

  async recordLoop() {
    // TODO: what if duration is not set?
    if (!this.states.captureReady) {
      // reset time only if looping (duration set)
      // REVIEW: whether to resetTime() needs more testing
      if (this.props.duration)
        resetTime({
          settings: this.settings,
          states: this.states,
          props: this.props,
        });

      this.settings.framesFormat.forEach((format) => {
        if (format !== "webm" && format !== "gif") {
          throw new Error(`${format} export is not supported`);
        }
        if (format === "webm") {
          setupWebMRecord({
            canvas: this.props.canvas,
            settings: this.settings,
          });
        } else if (format === "gif") {
          setupGifAnimRecord({
            canvas: this.props.canvas,
            settings: this.settings,
          });
        }
      });

      this.states.captureReady = true;
      this.props.recording = true;
    }

    // deltaTime
    this.props.deltaTime = 1000 / this.settings.exportFps;
    // time
    this.props.time = this._frameCount * this.props.deltaTime;

    computePlayhead({
      settings: this.settings,
      props: this.props,
    });
    this.props.frame = this._frameCount;
    computeLastTimestamp({ states: this.states, props: this.props });

    try {
      await this.render(this.props);
    } catch (err: any) {
      console.error(err);
      return null;
    }
    this.raf = window.requestAnimationFrame(this.loop);

    this._frameCount += 1;

    // save frames
    this.settings.framesFormat.forEach((format) => {
      if (format === "webm") {
        exportWebM({
          canvas: this.props.canvas,
          settings: this.settings,
          states: this.states,
          props: this.props,
        });
      } else if (format === "gif") {
        {
          let context: any; // REVIEW
          if (this.settings.mode === "2d") {
            context = (this.props as SketchProps).context;
          } else if (
            this.settings.mode === "webgl" ||
            this.settings.mode === "webgl2"
          ) {
            context = (this.props as WebGLProps).gl;
          }
          exportGifAnim({
            canvas: this.props.canvas,
            context,
            settings: this.settings,
            states: this.states,
            props: this.props,
          });
        }
      }
    });

    if (this.props.frame >= this.settings.exportTotalFrames - 1) {
      this.states.captureDone = true;
    }

    if (this.states.captureDone) {
      this.settings.framesFormat.forEach((format) => {
        if (format === "webm") {
          endWebMRecord({ canvas: this.props.canvas, settings: this.settings });
        } else if (format === "gif") {
          endGifAnimRecord({
            canvas: this.props.canvas,
            settings: this.settings,
          });
        }
      });

      this.states.captureReady = false;
      this.states.captureDone = false;
      this.states.savingFrames = false;
      this.states.timeResetted = true; // playLoop should start fresh

      this.props.recording = false;

      this._frameCount = 0; // reset local frameCount for next recording
    }
    return;
  }

  handleResize() {
    // b/c of typescript undefined warning, include empty method here..
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
