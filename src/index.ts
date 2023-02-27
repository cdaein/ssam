import { createProps } from "./props";
import { createSettings } from "./settings";
import { createStates } from "./states";
import {
  Sketch,
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
  encodeWebM,
  endWebMRecord,
} from "./recorders/export-frames-webm";
import {
  setupGifAnimRecord,
  encodeGifAnim,
  endGifAnimRecord,
} from "./recorders/export-frames-gif";
import { fitCanvasToWindow } from "./canvas";
import { getGlobalState, updateGlobalState } from "./store";
import { saveCanvasFrame } from "./recorders/export-frame";
import {
  endMp4Record,
  encodeMp4,
  setupMp4Record,
} from "./recorders/export-frames-mp4";
import { outlineElement } from "./helpers";

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

// ws event listeners keep adding up, so if it's already added, don't add duplicates
// I wish Vite provides a way to turn it off
// this will mark if first hotReloaded was done or not
let hotReloaded = false;

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
  unload?: (props: SketchProps | WebGLProps) => void;
  private raf!: number;
  globalState!: Record<string, any>;
  count!: number;
  loop!: (timestamp: number) => void;

  constructor() {
    // use ssam() function for interfacing with user. (class constructor can't use async)
    // use class to hoist render function and to make it available within init

    if (import.meta.hot) {
      // add listeners only on first load, but not on hot reloads
      // there's no way to turn off socket listeners, so they have to be added only once
      if (!hotReloaded) {
        import.meta.hot.on("ssam:warn", (data) => {
          console.warn(`${data.msg}`);
        });
        import.meta.hot.on("ssam:log", (data) => {
          console.log(`${data.msg}`);
        });

        import.meta.hot.on("ssam:git-success", (data) => {
          if (data.format === "mp4") {
            if (!getGlobalState().savingFrames) {
              updateGlobalState({
                savingFrames: true,
                frameRequested: true,
                recordState: "start",
                // FIX: reset commitHash after video snapshot.
                //      otherwise, it remains for subsequent mp4 export
                commitHash: data.hash,
              });
            }
          }
          const canvas = document.querySelector(`#${data.canvasId}`);
          saveCanvasFrame({
            canvas: canvas as HTMLCanvasElement,
            states: this.states,
            settings: this.settings,
            hash: data.hash,
          });
        });

        import.meta.hot.on("ssam:ffmpeg-reqframe", () => {
          // state that is tied to HMR need to come from global
          updateGlobalState({
            frameRequested: true,
          });
        });
      }
    }

    return this;
  }

  async setup(sketch: Sketch, userSettings: SketchSettings) {
    this.userSettings = userSettings;

    // for manual counting when recording (use only for recording)
    this.raf = 0;

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
    // this breaks the this.states reference and togglePlay() won't work
    // this.states = {
    //   ...this.states,
    //   // set time values from globalState
    // };

    this.globalState = getGlobalState();

    // REVIEW: some of these may not need to be stored globally
    this.states.startTime = this.globalState.startTime;
    this.states.lastStartTime = this.globalState.lastStartTime;
    this.states.pausedStartTime = this.globalState.pausedStartTime;
    this.states.pausedDuration = this.globalState.pausedDuration;
    this.states.timestamp = this.globalState.timestamp;
    this.states.lastTimestamp = this.globalState.lastTimestamp;
    //frameInterval: null // REVIEW
    this.states.firstLoopRender = this.globalState.firstLoopRender;
    this.states.firstLoopRenderTime = this.globalState.firstLoopRenderTime;

    // props are just a collection of internally tracked data
    this.props = {
      ...this.props,
      playhead: this.globalState.playhead,
      frame: this.globalState.frame,
      time: this.globalState.time,
      deltaTime: this.globalState.deltaTime,
    };

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

    const { add: addKeydown, remove: removeKeydown } = keydownHandler({
      props: this.props,
      states: this.states,
    });

    addResize();
    if (this.settings.hotkeys) {
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
    this.resize(this.props);
    this.render(this.props);

    return;
  }

  hotReload() {
    this.unloadCombined();
  }

  private unloadCombined() {
    // cancel queued animation frame
    window.cancelAnimationFrame(this.raf);
    // remove event listeners
    this.removeResize();
    this.removeKeydown();
    // remove canvas
    // REVIEW: when there's a code error, sometimes, it ends up with multiple canvases with same id
    // const oldCanvases = document.querySelectorAll(`#${this.settings.id}`);
    // oldCanvases.forEach((canvas) => canvas.remove());
    this.props.canvas.remove();
    // user clean-up (remove any side effects)
    this.unload && this.unload(this.props);
  }

  dispose() {
    hotReloaded = true;

    // store current values to globalState right before HMR
    updateGlobalState({
      // from states
      startTime: this.states.startTime,
      lastStartTime: this.states.lastStartTime,
      pausedStartTime: this.states.pausedStartTime,
      pausedDuration: this.states.pausedDuration,
      timestamp: this.states.timestamp,
      lastTimestamp: this.states.lastTimestamp,
      // frameInterval: null, // REVIEW
      firstLoopRender: this.states.firstLoopRender,
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

      if (getGlobalState().savingFrames === false) {
        this.playLoop(timestamp);
      } else {
        this.recordLoop();
      }
    };
    if (this.settings.animate)
      this.raf = window.requestAnimationFrame(this.loop);
  }

  async playLoop(timestamp: number) {
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
    // this.props.time = (this.states.timestamp - this.states.startTime) % this.props.duration;
    // 2. full reset each loop. but, dt is one-frame (8 or 16ms) off
    this.props.time =
      this.states.timestamp - this.states.startTime + this.states.timeNavOffset;

    if (this.props.time >= this.props.duration) {
      resetTime({
        settings: this.settings,
        states: this.states,
        props: this.props,
      });
    }
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
    if (this.settings.framesFormat.length === 0) {
      this.resetAfterRecord();
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // when mp4 recording, if not frameRequested, wait for next frame
    if (
      this.settings.framesFormat.includes("mp4") &&
      !getGlobalState().frameRequested
    ) {
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // respond to current recordState
    if (getGlobalState().recordState === "start") {
      if (this.props.duration) {
        resetTime({
          settings: this.settings,
          states: this.states,
          props: this.props,
        });
      }

      outlineElement(this.props.canvas, true);

      // set up recording
      for (const format of this.settings.framesFormat) {
        if (format === "gif") {
          setupGifAnimRecord();
        } else if (format === "mp4") {
          setupMp4Record({
            settings: this.settings,
            hash: getGlobalState().commitHash,
          });
        } else if (format === "webm") {
          setupWebMRecord({
            settings: this.settings,
            props: this.props,
          });
        }
      }
      // update relevant props
      this.props.recording = true;
      // move to next recordState
      updateGlobalState({ recordState: "in-progress" });
    }
    if (getGlobalState().recordState === "in-progress") {
      // render frame
      try {
        await this.render(this.props);
      } catch (err: any) {
        console.error(err);
        return null;
      }
      this.raf = window.requestAnimationFrame(this.loop);

      // update frame count (before encoding due to mp4 frame request logic)
      this.props.frame += 1;

      // encode frame
      for (let i = 0; i < this.settings.framesFormat.length; i++) {
        const format = this.settings.framesFormat[i];

        if (
          this.settings.framesFormat.includes("mp4") &&
          !getGlobalState().frameRequested
        ) {
          continue;
        }

        if (format === "gif") {
          encodeGifAnim({
            context:
              this.settings.mode === "2d"
                ? (this.props as SketchProps).context
                : (this.props as WebGLProps).gl,
            settings: this.settings,
            props: this.props,
          });
        } else if (format === "mp4") {
          // send a new frame to server only when requested
          // plugin needs some time to process incoming frame
          if (getGlobalState().frameRequested) {
            encodeMp4({ canvas: this.props.canvas });
          }
        } else if (format === "webm") {
          encodeWebM({
            canvas: this.props.canvas,
            settings: this.settings,
            props: this.props,
          });
        }
      }
      // if requested and sent already, set it to false and wait for next frame
      getGlobalState().frameRequested &&
        updateGlobalState({ frameRequested: false });

      // update time variables
      this.props.deltaTime = 1000 / this.settings.exportFps;
      this.props.time = this.props.frame * this.props.deltaTime;
      computePlayhead({
        settings: this.settings,
        props: this.props,
      });
      computeLastTimestamp({ states: this.states, props: this.props });

      if (this.props.frame >= this.settings.exportTotalFrames) {
        updateGlobalState({ recordState: "end" });
      }
    }
    if (getGlobalState().recordState === "end") {
      // finish recording
      this.settings.framesFormat.forEach((format) => {
        if (format === "gif") {
          endGifAnimRecord({ settings: this.settings });
        } else if (format === "mp4") {
          endMp4Record();
        } else if (format === "webm") {
          endWebMRecord({ settings: this.settings });
        }
      });

      // culprit
      // this.raf = window.requestAnimationFrame(this.loop);

      // reset recording states
      // TODO: reset only if duration is set
      this.resetAfterRecord();

      outlineElement(this.props.canvas, false);
    }

    return;
  }

  resetAfterRecord() {
    updateGlobalState({ savingFrames: false, recordState: "inactive" });
    this.states.timeResetted = true; // playLoop should start fresh

    this.props.frame = 0;
    this.props.recording = false;
  }

  handleResize() {
    // b/c of typescript undefined warning, include empty method here..
  }

  // REVIEW: does this have to be async method?
  render(_props: SketchProps | WebGLProps): void | Promise<void> {
    // this will be overwritten in sketch by wrap.render()
    // without this declaration, TS thinks it doesn't exist. (sketch closure)
    return Promise.resolve();
  }

  resize(_props: SketchProps | WebGLProps) {
    // same as this.render()
  }

  // helper method. same as { animate: false }
  noLoop() {
    // TODO: need this.settings first
    // settings.animate = false;
  }
}
