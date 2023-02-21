import type { SketchStates, SketchSettingsInternal } from "../types/types";
import { formatFilename } from "../helpers";

/**
 * save a single frame of canvas
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
  hash,
}: {
  canvas: HTMLCanvasElement;
  states: SketchStates;
  settings: SketchSettingsInternal;
  hash?: string;
}) => {
  let { filename, prefix, suffix, frameFormat } = settings;

  frameFormat.forEach((format) => {
    if (format === "jpg") format = "jpeg";
    // may add additional quality to string, but will leave at default for now
    const dataURL = canvas.toDataURL(`image/${format}`);

    if (import.meta.hot) {
      // in dev environment, use node:fs to export
      import.meta.hot.send("ssam:export", {
        image: dataURL,
        filename: `${formatFilename({
          filename,
          prefix,
          suffix: hash ? `${suffix}-${hash}` : suffix,
        })}`,
        format,
      });
    } else {
      // in browser environment
      const link = document.createElement("a");
      link.download = `${formatFilename({
        filename,
        prefix,
        suffix: hash ? `${suffix}-${hash}` : suffix,
      })}.${format}`;
      link.href = dataURL;
      link.click();
    }
  });

  states.savingFrame = false;
  states.playMode = "play";
};
