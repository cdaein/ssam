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

if (import.meta.hot) {
  import.meta.hot.accept();
}

export const hotReload = (id: string) => {
  // need to reference id
  const oldCanvas = document.getElementById(id) as HTMLCanvasElement;
  if (oldCanvas) {
    oldCanvas.width = 0;
    oldCanvas.height = 0;
    oldCanvas?.remove();
    console.log("dispose");
  }

  // TODO:
  // no way to prevent ssam from being re-created in sketch.ts
  // best option is to recreate with existing props values
  // getCurrentStates()
  // getCurrentProps()
};

export const ssam = async (sketch: Sketch, settings: SketchSettings) => {
  try {
    if (import.meta.hot) {
      console.log("hot-reloading");

      // get current wrap object
      //

      // get current settings, states and props

      // destory old

      // pass all current data to new Wrap object
    }

    const wrap = new Wrap();
    await wrap.setup(sketch, settings);

    // // console.log(wrap.settings, wrap.states, wrap.props);
    // // send the current wrap object to server
    // if (import.meta.hot) {
    //   import.meta.hot.send("ssam:wrap", {
    //     // wrap: this,
    //     settings: wrap.settings,
    //     states: wrap.states,
    //     // don't include function props ()
    //     props: {
    //       time: wrap.props.time,
    //       playhead: wrap.props.playhead,
    //     },
    //   });
    // }
  } catch (err: any) {
    console.error("Error:", err); // this is more descriptive
    return null;
  }
  return;
};

export class Wrap {
  props!: SketchProps | WebGLProps;
  settings!: SketchSettingsInternal;
  states!: SketchStates;
  removeResize!: () => void;
  removeKeydown!: () => void;
  unload?: () => void;
  firstLoopRender: boolean;
  firstLoopRenderTime: number;
  private _frameCount: number;

  // render!: SketchRender;

  constructor() {
    // use ssam() function for interfacing with user. (class constructor can't use async)
    // use class to hoist render function and to make it available within init

    // there's time delay between first render in handleResize() and first loop render, resulting in animatiom jump. this compesates for that delay
    this.firstLoopRender = true;
    this.firstLoopRenderTime = 0;

    // for manual counting when recording (use only for recording)
    this._frameCount = 0;

    return this;
  }

  destroy() {
    // remove any side deffects
    this.unload && this.unload();
    window.removeEventListener("resize", this.removeResize);
    window.removeEventListener("keydown", this.removeKeydown);
    this.props.canvas.remove();
  }

  async setup(sketch: Sketch, userSettings: SketchSettings) {
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

    try {
      await sketch(this.props);
    } catch (err: any) {
      console.error("Error at sketch init:", err);
      return null;
    }

    const { add: addResize, remove: removeResize } = resizeHandler({
      props: this.props,
      userSettings,
      settings: this.settings,
      render: this.render,
      resize: this.resize,
    });
    this.removeResize = removeResize;
    const { add: addKeydown, remove: removeKeydown } = keydownHandler({
      props: this.props,
      states: this.states,
    });
    this.removeKeydown = removeKeydown;

    fitCanvasToWindow({
      userSettings,
      settings: this.settings,
      props: this.props,
    });

    // render at least once
    this.render(this.props);

    // animation render loop
    const loop = (timestamp: number) => {
      if (this.firstLoopRender) {
        this.firstLoopRenderTime = timestamp;
        this.firstLoopRender = false;
        window.requestAnimationFrame(loop);
        return;
      }

      this.states.timestamp =
        timestamp - this.firstLoopRenderTime - this.states.pausedDuration;

      if (!this.states.savingFrames) {
        this.playLoop({
          loop,
          timestamp: timestamp - this.firstLoopRenderTime,
          settings: this.settings as SketchSettingsInternal,
          states: this.states as SketchStates,
          props: this.props as SketchProps | WebGLProps,
        });
      } else {
        this.recordLoop({
          loop,
          canvas: (this.props as SketchProps | WebGLProps).canvas,
          settings: this.settings as SketchSettingsInternal,
          states: this.states as SketchStates,
          props: this.props as SketchProps | WebGLProps,
        });
      }
    };
    if (this.settings.animate) window.requestAnimationFrame(loop);

    if (this.settings.hotkeys) {
      addResize();
      addKeydown();
    }

    return this;
  }

  async playLoop({
    loop, // TODO
    timestamp,
    settings,
    states,
    props,
  }: {
    loop: any;
    timestamp: number;
    settings: SketchSettingsInternal;
    states: SketchStates;
    props: SketchProps | WebGLProps;
  }) {
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
    props.time = states.timestamp - states.startTime + states.timeNavOffset;

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
  }

  async recordLoop({
    loop,
    canvas,
    settings,
    states,
    props,
  }: {
    loop: any; // TODO
    canvas: HTMLCanvasElement;
    settings: SketchSettingsInternal;
    states: SketchStates;
    props: SketchProps | WebGLProps;
  }) {
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
    props.time = this._frameCount * props.deltaTime;

    computePlayhead({
      settings,
      props,
    });
    props.frame = this._frameCount;
    computeLastTimestamp({ states, props });

    try {
      await this.render(props);
    } catch (err: any) {
      console.error(err);
      return null;
    }
    window.requestAnimationFrame(loop);

    this._frameCount += 1;

    // save frames
    settings.framesFormat.forEach((format) => {
      if (format === "webm") {
        exportWebM({ canvas, settings, states, props });
      } else if (format === "gif") {
        {
          let context: any; // REVIEW
          if (settings.mode === "2d") {
            context = (props as SketchProps).context;
          } else if (settings.mode === "webgl" || settings.mode === "webgl2") {
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

      this._frameCount = 0; // reset local frameCount for next recording
    }
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
