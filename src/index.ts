import { createProps } from "./props";
import { createSettings } from "./settings";
import { createStates } from "./states";
import {
  FinalProps,
  FramesFormatObj,
  Sketch,
  SketchContext,
  SketchMode,
  SketchProps,
  SketchSettings,
  SketchSettingsInternal,
  SketchStates,
  VideoEncodeParams,
  WebGL2Props,
  WebGLProps,
  WebGPUProps,
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
import { fitCanvasToParent } from "./canvas";
import { getGlobalState, updateGlobalState } from "./store";
import { saveCanvasFrame } from "./recorders/export-frame";
import {
  endMp4Record,
  encodeMp4,
  setupMp4Record,
} from "./recorders/export-frames-mp4";
import { isObject, outlineElement } from "./helpers";
import {
  encodePngSeq,
  endPngSeqRecord,
  setupPngSeqRecord,
} from "./recorders/export-frames-png";
import {
  ssamWarnCallback,
  ssamLogCallback,
  ssamFfmpegReqframeCallback,
  ssamGitSuccessCallbackWrapper,
} from "./events/ws";

export type {
  FrameFormat,
  FramesFormat,
  GifOptions,
  Sketch,
  SketchMode,
  SketchLoop,
  SketchProps,
  SketchRender,
  SketchResize,
  SketchSettings,
  WebGLProps,
  WebGL2Props,
  FinalProps,
} from "./types/types";

export const ssam = async <Mode extends SketchMode>(
  sketch: Sketch<Mode>,
  settings: SketchSettings,
) => {
  try {
    const wrap = await Wrap.create(sketch, settings);
    wrap.run();
    return wrap;
  } catch (err) {
    console.error(err);
    return;
  }
};

export class Wrap<Mode extends SketchMode> {
  sketch: Sketch<Mode>;
  userSettings: SketchSettings;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: FinalProps<Mode>;
  removeResize: () => void;
  removeKeydown: () => void;
  unload?: (props: FinalProps<Mode>) => void;
  private raf: number;
  globalState: Record<string, any>;
  count!: number;
  loop!: (timestamp: number) => void;
  /** Runs right before export. Useful if some values need to reset for exporting. */
  preExport?: () => void;
  /** Runs right after export. */
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
    props: FinalProps<Mode>;
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
    props: FinalProps<Mode>;
  }) => void;
  encodeWebM!: (params: VideoEncodeParams<Mode>) => Promise<void>;
  endWebMRecord!: ({
    settings,
  }: {
    settings: SketchSettingsInternal;
  }) => Promise<void>;
  setupMp4BrowserRecord!: ({
    settings,
    states,
    props,
  }: {
    settings: SketchSettingsInternal;
    states: SketchStates;
    props: FinalProps<Mode>;
  }) => void;
  encodeMp4Browser!: (params: VideoEncodeParams<Mode>) => void;
  endMp4BrowserRecord!: ({
    settings,
  }: {
    settings: SketchSettingsInternal;
  }) => Promise<void>;
  // TEST:
  gitCb!: (data: any) => void;

  // render?: SketchRender<Mode>;
  // resize?: SketchResize<Mode>;

  // this is kinda ugly..
  // because this function relies on this.states and this.settings,
  // and also need to be referenced when hot.off() removal,
  // i cannot move it to another file(module)
  ssamGitSuccessCallback(data: any) {
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
      states: this.states,
      settings: this.settings,
      hash: data.hash,
    });
  }

  static async create<Mode extends SketchMode>(
    sketch: Sketch<Mode>,
    userSettings: SketchSettings,
  ): Promise<Wrap<Mode>> {
    const wrap = new Wrap(sketch, userSettings);
    try {
      await wrap.setup();
      return wrap;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // use ssam() function for interfacing with user. (class constructor can't use async)
  // use class to hoist render function and to make it available within init
  constructor(sketch: Sketch<Mode>, userSettings: SketchSettings) {
    this.sketch = sketch;
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
      renderProp: () => this.render(this.props),
      resizeProp: () => this.resize(this.props),
    });

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

    fitCanvasToParent({
      userSettings,
      settings: this.settings,
      props: this.props,
    });

    return this;
  }

  async setup() {
    // dynamic import of export libraries
    if (this.settings.framesFormat.includes("gif")) {
      const { setupGifAnimRecord, encodeGifAnim, endGifAnimRecord } =
        await import("./recorders/export-frames-gif");
      this.setupGifAnimRecord = setupGifAnimRecord;
      this.encodeGifAnim = encodeGifAnim;
      this.endGifAnimRecord = endGifAnimRecord;
    }
    if (
      this.settings.framesFormat.includes("webm") ||
      this.settings.framesFormat.find(
        (v) => isObject(v) && (v as FramesFormatObj<"webm">).format === "webm",
      )
    ) {
      const { setupWebMRecord, encodeWebM, endWebMRecord } = await import(
        "./recorders/export-frames-webm"
      );
      this.setupWebMRecord = setupWebMRecord;
      this.encodeWebM = encodeWebM;
      this.endWebMRecord = endWebMRecord;
    }
    if (
      this.settings.framesFormat.includes("mp4-browser") ||
      this.settings.framesFormat.find(
        (v) =>
          isObject(v) &&
          (v as FramesFormatObj<"mp4-browser">).format === "mp4-browser",
      )
    ) {
      const { setupMp4BrowserRecord, encodeMp4Browser, endMp4BrowserRecord } =
        await import("./recorders/export-frames-mp4-browser");
      this.setupMp4BrowserRecord = setupMp4BrowserRecord;
      this.encodeMp4Browser = encodeMp4Browser;
      this.endMp4BrowserRecord = endMp4BrowserRecord;
    }

    // set up web socket listeners (to communicate with vite dev server, plugins)
    if (import.meta.hot) {
      import.meta.hot.on("ssam:warn", ssamWarnCallback);
      import.meta.hot.on("ssam:log", ssamLogCallback);
      import.meta.hot.on("ssam:ffmpeg-reqframe", ssamFfmpegReqframeCallback);
      import.meta.hot.on(
        "ssam:git-success",
        (this.gitCb = ssamGitSuccessCallbackWrapper(
          this.states,
          this.settings,
        )),
      );
    }

    try {
      await this.sketch(this.props);
    } catch (err: any) {
      console.error("Error at sketch init:", err);
      return null;
    }

    // render at least once. this is the first frame.
    // REVIEW: loop() render doesn't run the first frame b/c of frame throttling code.
    //         user should be okay, but handling/updating data from very first frame is a bit tricky.
    this.resize(this.props);
    this.render(this.props);

    return;
  }

  // REVIEW: why 2 steps - dispose and then unloadCombined?
  // NOTES: where to call methods (hotReload, unloadCombined, dispose) is a bit arbitrary..
  //  need a structure for use in Frameworks (React) and independently.

  /**
   * Calls `this.unloadCombined()` and remove canvas
   */
  hotReload() {
    this.unloadCombined();
    // remove canvas
    // below is moved to here due to cleaning up of React component also removed the canvas. need to separate these operations.
    this.props.canvas.remove();
  }

  /**
   * Cancel animation frame, remove listeners (resize, keydown) and calls `this.unload()`
   */
  unloadCombined() {
    // cancel queued animation frame
    window.cancelAnimationFrame(this.raf);
    // remove event listeners
    this.removeResize && this.removeResize();
    this.removeKeydown && this.removeKeydown();
    // user clean-up (remove any side effects)
    this.unload && this.unload(this.props);
  }

  /**
   * Turn off socket listeners (for plugins)
   */
  dispose() {
    const { states, props } = this;

    // each hot reload, turn off websocket listeners.
    // they are added back with new Wrap constructor call
    if (import.meta.hot) {
      import.meta.hot.off("ssam:warn", ssamWarnCallback);
      import.meta.hot.off("ssam:log", ssamLogCallback);
      import.meta.hot.off("ssam:ffmpeg-reqframe", ssamFfmpegReqframeCallback);
      import.meta.hot.off("ssam:git-success", this.gitCb);

      // keep only a single canvas and remove all the other old ones.
      // REVIEW: doesn't seem to do anything now?

      // const canvases = document.querySelectorAll(`#${this.settings.id}`);
      // if (canvases.length > 1) {
      //   for (let i = 0; i < canvases.length - 1; i++) {
      //     canvases[i].remove();
      //   }
      // }
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
        // this return causes 1fr time duration (8/16ms) added to timestamp at the beginning.
        // by not returning `states.timestamp` starts from 0.
        // this.raf = window.requestAnimationFrame(this.loop);
        // return;
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

    // timestamp continues to increase
    timestamp = timestamp - states.firstLoopRenderTime;

    // when paused, accumulate pausedDuration
    if (states.paused) {
      states.pausedDuration = timestamp - states.pausedStartTime;
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // recording completed
    if (this.states.timeResetted) {
      resetTime({ settings, states, props });
    }

    // time
    // 1. better dt handling (doesn't work with resetTime)
    // props.time = (states.timestamp - states.startTime) % props.duration;

    // 2. full reset each loop. but, dt is one-frame (8 or 16ms) off
    props.time = states.timestamp - states.startTime + states.timeNavOffset;

    if (props.time >= props.duration) {
      resetTime({ settings, states, props });
    }

    props.deltaTime =
      states.timestamp - states.lastTimestamp - states.deltaRemainder;

    // throttle frame rate
    if (states.frameInterval !== null) {
      if (props.deltaTime < states.frameInterval) {
        this.raf = window.requestAnimationFrame(this.loop);
        return;
      }
    }

    states.deltaRemainder = states.frameInterval
      ? props.deltaTime % states.frameInterval
      : 0;

    // the calling order matters
    computePlayhead({ settings, props });
    computeFrame({ settings, states, props });
    // computeLoopCount({ settings, props });

    // update lastTimestamp for deltaTime calculation
    computeLastTimestamp({ states, props });

    // update prevFrame before resetTime() call. otherwise, prevFrame & frame both becomes 0
    // NOTE: when playLoop() starts right after recording, prevFrame===frame===0, which is not ideal.
    computePrevFrame({ states, props });

    try {
      await this.render(props);
    } catch (err: any) {
      console.error(err);
      return null;
    }

    // NOTE: moving here from computeFrame() due to frame resetting to 1, not 0.
    if (settings.duration !== Infinity) {
      if (settings.playFps === null) {
        props.frame += 1;
      }
    }

    this.raf = window.requestAnimationFrame(this.loop);

    return;
  }

  async recordLoop() {
    const {
      settings,
      states,
      props,
      props: { canvas },
    } = this;

    if (settings.framesFormat.length === 0) {
      console.warn(`no framesFormat found.`);
      this.resetAfterRecord();
      this.raf = window.requestAnimationFrame(this.loop);
      return;
    }

    // when mp4 recording, if not frameRequested, wait for next frame
    if (
      (settings.framesFormat.includes("mp4") ||
        settings.framesFormat.includes("png")) &&
      !getGlobalState().frameRequested
    ) {
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

      outlineElement(canvas, true);

      // set up recording
      // REVIEW: this test is getting too long
      for (const format of settings.framesFormat) {
        if (format === "gif") {
          this.setupGifAnimRecord();
        } else if (format === "mp4") {
          setupMp4Record({
            settings,
            props,
            hash: getGlobalState().commitHash,
          });
        } else if (format === "mp4-browser") {
          this.setupMp4BrowserRecord({ settings, states, props });
        } else if (format === "webm") {
          this.setupWebMRecord({ settings, props });
        } else if (format === "png") {
          setupPngSeqRecord({ settings, hash: getGlobalState().commitHash });
        } else if (isObject(format)) {
          if (format.format === "mp4-browser") {
            this.setupMp4BrowserRecord({ settings, states, props });
          } else if (format.format === "webm") {
            this.setupWebMRecord({ settings, props });
          }
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

        // if (
        //   settings.framesFormat.includes("mp4") &&
        //   !getGlobalState().frameRequested
        // ) {
        //   // this never runs
        //   console.log("========== frame is NOT requested so continue");
        //   // continue;
        // }

        if (format === "gif") {
          this.encodeGifAnim({
            context:
              settings.mode === "2d"
                ? (props as SketchProps).context
                : settings.mode === "webgpu"
                  ? (props as WebGPUProps).context
                  : (props as WebGLProps | WebGL2Props).gl,
            settings,
            states,
            props,
          });
        } else if (format === "mp4") {
          // send a new frame to server only when requested.
          // plugin needs some time to process incoming frame
          if (getGlobalState().frameRequested) {
            encodeMp4({ canvas });
          }
        } else if (format === "mp4-browser") {
          this.encodeMp4Browser({ canvas, settings, states, props });
        } else if (format === "webm") {
          this.encodeWebM({ canvas, settings, states, props });
        } else if (format === "png") {
          encodePngSeq({ canvas, settings, states });
        } else if (isObject(format)) {
          if (format.format === "mp4-browser") {
            this.encodeMp4Browser({ canvas, settings, states, props });
          } else if (format.format === "webm") {
            this.encodeWebM({ canvas, settings, states, props });
          }
        }
      }
      // if requested and sent already, set it to false and wait for next frame
      getGlobalState().frameRequested &&
        updateGlobalState({ frameRequested: false });

      // update frame count (before encoding due to mp4 frame request logic)
      props.frame += 1;
      // compute export total frames per loop
      props.frame %= Math.floor(settings.exportTotalFrames / settings.numLoops);
      states.recordedFrames += 1;

      computeLoopCount({ settings, props });

      // update time variables
      props.deltaTime = 1000 / settings.exportFps;
      props.time = props.frame * props.deltaTime;
      computePlayhead({ settings, props });
      computeLastTimestamp({ states, props });

      // NOTE: had to move the section below after encoding due to incorrect counting in webm encoding.
      // update prevFrame before resetTime() call. otherwise, prevFrame & frame both becomes 0
      computePrevFrame({ states, props });

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
        } else if (format === "mp4-browser") {
          this.endMp4BrowserRecord({ settings });
        } else if (format === "webm") {
          this.endWebMRecord({ settings });
        } else if (format === "png") {
          endPngSeqRecord();
        } else if (isObject(format)) {
          if (format.format === "mp4-browser") {
            this.endMp4BrowserRecord({ settings });
          } else if (format.format === "webm") {
            this.endWebMRecord({ settings });
          }
        }
      });

      // culprit
      window.cancelAnimationFrame(this.raf);
      this.raf = window.requestAnimationFrame(this.loop);

      // reset recording states
      this.resetAfterRecord();

      this.postExportCombined();

      outlineElement(canvas, false);
    }

    return;
  }

  resetAfterRecord() {
    updateGlobalState({
      savingFrames: false,
      recordState: "inactive",
      commitHash: "",
      prevFrame: null,
      loopCount: 0,
    });
    // TODO: reset time/frame only if duration is set
    this.states.timeResetted = true; // playLoop should start fresh
    this.states.recordedFrames = 0;
    this.props.frame = 0;
    this.props.recording = false;
    // doesn't do anything, because playLoop() updates prevFrame anyways
    this.states.prevFrame = null;
    this.props.loopCount = 0;
  }

  /**
   * `wrap.render(props)` handles animation loop.
   * Place any code you want updated each frame.
   */
  render(props: FinalProps<Mode>): Promise<void> | void {
    // this will be overwritten in sketch by wrap.render()
    // without this declaration, TS thinks it doesn't exist. (sketch closure)
    return Promise.resolve();
  }

  /**
   * `wrap.resize(props)` is called when the canvas is resized.
   * You can get the updated dimensions with `props.width` and `props.height`.
   */
  resize(props: FinalProps<Mode>) {
    //
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

  // helper method. same as { animate: false }
  noLoop() {
    // TODO: need this.settings first
    // settings.animate = false;
  }
}
