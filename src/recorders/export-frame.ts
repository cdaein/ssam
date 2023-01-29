import type { SketchStates, SketchSettingsInternal } from "../types/types";
import { formatFilename } from "../helpers";

/**
 * save a single frame of canvas
 *
 * TODO: support other file formats - png(default), jpg/jpeg, webp, gif
 *
 * REVIEW: to keep everything all in one function,
 * there's a bit awkward early return when initing recorder.
 * if this becomes an issue in other part of program,
 * consider separating init and recording, and place init
 * on top of draw() in index/loop()
 */
export const saveCanvasFrame = ({
  canvas,
  states,
  settings,
}: {
  canvas: HTMLCanvasElement;
  states: SketchStates;
  settings: SketchSettingsInternal;
}) => {
  let { filename, prefix, suffix, frameFormat } = settings;

  frameFormat.forEach((format) => {
    if (format === "jpg") format = "jpeg";
    // may add additional quality to string, but will leave at default for now
    const dataURL = canvas.toDataURL(`image/${format}`);
    const link = document.createElement("a");
    link.download = `${formatFilename({
      filename,
      prefix,
      suffix,
    })}.${format}`;
    link.href = dataURL;
    link.click();
  });

  states.savingFrame = false;
  states.playMode = "play";
};
