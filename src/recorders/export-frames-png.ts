import { formatFilename } from "../helpers";
import type { SketchSettingsInternal, SketchStates } from "../types/types";
import { saveCanvasFrame } from "./export-frame";

export const setupPngSeqRecord = ({
  settings,
  hash,
}: {
  settings: SketchSettingsInternal;
  hash?: string;
}) => {
  if (import.meta.hot) {
    const {
      filename,
      prefix,
      suffix,
      exportFps,
      dimensions,
      pixelRatio,
      exportTotalFrames,
    } = settings;

    const format = "png";

    let width = window.innerWidth;
    let height = window.innerHeight;
    if (dimensions) {
      width = dimensions[0];
      height = dimensions[1];
    }

    // use it as a sub-folder within outDir
    const foldernameFormatted = formatFilename({
      filename,
      prefix,
      suffix: hash ? `${suffix}-${hash}` : suffix,
    });

    import.meta.hot.send("ssam:ffmpeg", {
      fps: exportFps,
      width: width * pixelRatio,
      height: height * pixelRatio,
      totalFrames: exportTotalFrames,
      filename: foldernameFormatted,
      format: "png",
    });

    // console.log(`recording (${format}) sequence started`);
  } else {
    console.warn(`png sequence recording is only availabe in dev environment`);
    return;
  }
};

export const encodePngSeq = ({
  canvas,
  settings,
  states,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
  states: SketchStates;
}) => {
  //
  if (import.meta.hot) {
    import.meta.hot.send("ssam:ffmpeg-newframe", {
      image: canvas.toDataURL(),
    });

    // console.log(
    //   `recording (png) sequence frame... ${states.recordedFrames} of ${settings.exportTotalFrames}`
    // );
  }
};

export const endPngSeqRecord = () => {
  if (import.meta.hot) {
    import.meta.hot.send("ssam:ffmpeg-done");

    // console.log(`recording (png) sequence complete`);
  }
};
