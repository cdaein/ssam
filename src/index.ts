import { createProps } from "./props";
import { createSettings } from "./settings";
import { createStates } from "./states";
import {
  Sketch,
  SketchContext,
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
  computeLoopCount,
  computePlayhead,
  computePrevFrame,
  resetTime,
} from "./time";
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
  preExport?: () => void;
  postExport?: () => void;
  setupGifAnimRecord!: () => Promise<void>;
  encodeGifAnim!: ({
    context,
    settings,
    states,
    props,
  }: {
    context: SketchContext;
    settings: SketchSettingsInternal;
    states: SketchStates;
    props: SketchProps | WebGLProps;
  }) => void;
  endGifAnimRecord!: ({
    settings,
  }: {
    settings: SketchSettingsInternal;
  }) => void;
  setupWebMRecord!: ({
    settings,
    props,
  }: {
    settings: SketchSettingsInternal;
    props: SketchProps | WebGLProps;
  }) => void;
  encodeWebM!: ({
    canvas,
    settings,
    states,
    props,
  }: {
    canvas: HTMLCanvasElement;
    settings: SketchSettingsInternal;
    states: SketchStates;
    props: SketchProps | WebGLProps;
  }) => Promise<void>;
  endWebMRecord!: ({
    settings,
  }: {
    settings: SketchSettingsInternal;
  }) => Promise<void>;

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

    // dynamic import of export libraries
    if (this.settings.framesFormat.includes("gif")) {
      const { setupGifAnimRecord, encodeGifAnim, endGifAnimRecord } =
        await import("./recorders/export-frames-gif");
      this.setupGifAnimRecord = setupGifAnimRecord;
      this.encodeGifAnim = encodeGifAnim;
      this.endGifAnimRecord = endGifAnimRecord;
    }
    if (this.settings.framesFormat.includes("webm")) {
      const { setupWebMRecord, encodeWebM, endWebMRecord } = await import(
        "./recorders/export-frames-webm"
      );
      this.setupWebMRecord = setupWebMRecord;
      this.encodeWebM = encodeWebM;
      this.endWebMRecord = endWebMRecord;
    }

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
    this.states.prevFrame = this.globalState.prevFrame;

    this.props.playhead = this.globalState.playhead;
    this.props.frame = this.globalState.frame;
    this.props.time = this.globalState.time;
    this.props.deltaTime = this.globalState.deltaTime;
    this.props.loopCount = this.globalState.loopCount;

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

    // render at least once. this is the first frame.
    // REVIEW: loop() render doesn't run the first frame b/c of frame throttling code.
    //         user should be okay, but handling/updating data from very first frame is a bit tricky.
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
    // REVIEW: when there's a code error, sometimes, it ends up with multiple canvases with same id but removing all old canvases will also remove new one
    this.props.canvas.remove();
    // user clean-up (remove any side effects)
    this.unload && this.unload(this.props);
  }

  dispose() {
    const { states, props } = this;

    hotReloaded = true;

    // REVIEW: after hot reloading and new canvas is created,
    //         if multiple, remove all but one to ensure one active canvas is always present
    const canvases = document.querySelectorAll(`#${this.settings.id}`);
    if (canvases.length > 1) {
      for (let i = 0; i < canvases.length - 1; i++) {
        canvases[i].remove();
      }
    }

    // store current values to globalState right before HMR
    updateGlobalState({
      // from states
      startTime: states.startTime,
      lastStartTime: states.lastStartTime,
      pausedStartTime: states.pausedStartTime,
      pausedDuration: states.pausedDuration,
      timestamp: states.timestamp,
      lastTimestamp: states.lastTimestamp,
      // frameInterval: null, // REVIEW
      firstLoopRender: states.firstLoopRender,
      firstLoopRenderTime: states.firstLoopRenderTime,
      prevFrame: states.prevFrame,
      // from props
      playhead: props.playhead,
      frame: props.frame,
      time: props.time,
      deltaTime: props.deltaTime,
      loopCount: props.loopCount,
    });
  }

  run() {
    const { states } = this;

    // animation render loop
    this.loop = (timestamp: number) => {
      // there's time delay between first render in handleResize() and first loop render, resulting in animation jump. this compensates for that delay
      if (states.firstLoopRender) {
        states.firstLoopRenderTime = timestamp;
        states.firstLoopRender = false;
        this.raf = window.requestAnimationFrame(this.loop);
        return;
      }

      states.timestamp =
        timestamp - states.firstLoopRenderTime - states.pausedDuration;

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
    const { settings, states, props } = this;

    timestamp = timestamp - states.firstLoopRenderTime;

    // when paused, accumulate pausedDuration
    if (states.paused) {
      states.pausedDuration = timestamp - states.pausedStartTime;
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    if (this.states.timeResetted) {
      resetTime({ settings, states, props });
    }

    // update prevFrame before resetTime() call. otherwise, prevFrame & frame both becomes 0
    computePrevFrame({ states, props });

    // time
    // 1. better dt handling
    // this.props.time = (this.states.timestamp - this.states.startTime) % this.props.duration;
    // 2. full reset each loop. but, dt is one-frame (8 or 16ms) off
    props.time = states.timestamp - states.startTime + states.timeNavOffset;

    if (props.time >= props.duration) {
      resetTime({ settings, states, props });
    }
    props.deltaTime = states.timestamp - states.lastTimestamp;

    // throttle frame rate
    if (states.frameInterval !== null) {
      if (props.deltaTime < states.frameInterval) {
        this.raf = window.requestAnimationFrame(this.loop);
        return;
      }
    }

    // the calling order matters
    computePlayhead({ settings, props });
    computeFrame({ settings, states, props });
    computeLoopCount({ settings, props });
    // update lastTimestamp for deltaTime calculation
    computeLastTimestamp({ states, props });

    try {
      await this.render(props);
    } catch (err: any) {
      console.error(err);
      return null;
    }
    this.raf = window.requestAnimationFrame(this.loop);

    return;
  }

  async recordLoop() {
    const { settings, states, props } = this;

    if (settings.framesFormat.length === 0) {
      this.resetAfterRecord();
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // when mp4 recording, if not frameRequested, wait for next frame
    if (
      settings.framesFormat.includes("mp4") &&
      !getGlobalState().frameRequested
    ) {
      // REVIEW: while recording, around frame 100, there's a very long delay hiccup
      //         improve server-side data handling/processing
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // respond to current recordState
    if (getGlobalState().recordState === "start") {
      if (props.duration) {
        // TODO: give an option not to reset time at record start.
        //       structure is there now w/ states.recordedFrames.
        //       but first frame may be off in computing time (record vs play)
        //       instead of directly rendering first frame, need to adjust time
        //       so data will snap based on exportFps and current closest value
        resetTime({ settings, states, props });
        // REVIEW: include below to resetTime()?
        updateGlobalState({ prevFrame: null });
        states.prevFrame = null;
        props.loopCount = 0;
      }

      this.preExportCombined();

      outlineElement(props.canvas, true);

      // set up recording
      for (const format of settings.framesFormat) {
        if (format === "gif") {
          this.setupGifAnimRecord();
        } else if (format === "mp4") {
          setupMp4Record({
            settings,
            hash: getGlobalState().commitHash,
          });
        } else if (format === "webm") {
          this.setupWebMRecord({ settings, props });
        }
      }
      // update relevant props
      props.recording = true;
      // move to next recordState
      updateGlobalState({ recordState: "in-progress" });
    }
    if (getGlobalState().recordState === "in-progress") {
      // render frame
      try {
        await this.render(props);
      } catch (err: any) {
        console.error(err);
        return null;
      }
      this.raf = window.requestAnimationFrame(this.loop);

      // encode frame
      for (let i = 0; i < settings.framesFormat.length; i++) {
        const format = settings.framesFormat[i];

        if (
          settings.framesFormat.includes("mp4") &&
          !getGlobalState().frameRequested
        ) {
          continue;
        }

        if (format === "gif") {
          this.encodeGifAnim({
            context:
              settings.mode === "2d"
                ? (props as SketchProps).context
                : (props as WebGLProps).gl,
            settings,
            states,
            props,
          });
        } else if (format === "mp4") {
          // send a new frame to server only when requested
          // plugin needs some time to process incoming frame
          if (getGlobalState().frameRequested) {
            encodeMp4({ canvas: props.canvas });
          }
        } else if (format === "webm") {
          this.encodeWebM({
            canvas: props.canvas,
            settings,
            states,
            props,
          });
        }
      }
      // if requested and sent already, set it to false and wait for next frame
      getGlobalState().frameRequested &&
        updateGlobalState({ frameRequested: false });

      // NOTE: had to move the section below after encoding due to incorrect counting in webm encoding.
      // update prevFrame before resetTime() call. otherwise, prevFrame & frame both becomes 0
      computePrevFrame({ states, props });

      // update frame count (before encoding due to mp4 frame request logic)
      props.frame += 1;
      props.frame %= props.totalFrames;
      // this.props.frame =
      // (this.props.frame + 1) % this.settings.exportTotalFrames;
      states.recordedFrames += 1;

      const prevFrame = getGlobalState().prevFrame;
      // console.log(prevFrame, this.props.frame); //TEST

      computeLoopCount({ settings, props });

      // update time variables
      props.deltaTime = 1000 / settings.exportFps;
      props.time = props.frame * props.deltaTime;
      computePlayhead({ settings, props });
      computeLastTimestamp({ states, props });

      // if (this.props.frame >= this.settings.exportTotalFrames) {
      // updateGlobalState({ recordState: "end" });
      // }

      if (states.recordedFrames >= settings.exportTotalFrames) {
        updateGlobalState({ recordState: "end" });
      }
    }
    if (getGlobalState().recordState === "end") {
      // finish recording
      settings.framesFormat.forEach((format) => {
        if (format === "gif") {
          this.endGifAnimRecord({ settings });
        } else if (format === "mp4") {
          endMp4Record();
        } else if (format === "webm") {
          this.endWebMRecord({ settings });
        }
      });

      // culprit
      window.cancelAnimationFrame(this.raf);
      this.raf = window.requestAnimationFrame(this.loop);

      // reset recording states
      this.resetAfterRecord();

      this.postExportCombined();

      outlineElement(props.canvas, false);
    }

    return;
  }

  resetAfterRecord() {
    updateGlobalState({
      savingFrames: false,
      recordState: "inactive",
      commitHash: "",
    });
    // TODO: reset time/frame only if duration is set
    this.states.timeResetted = true; // playLoop should start fresh
    this.states.recordedFrames = 0;
    this.props.frame = 0;
    this.props.recording = false;
  }

  handleResize() {
    // b/c of typescript undefined warning, include empty method here..
  }

  preExportCombined() {
    // run right before export starts
    this.preExport && this.preExport();
  }

  postExportCombined() {
    // run right after export finished
    this.postExport && this.postExport();
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
