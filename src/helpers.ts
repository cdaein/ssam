import { FramesFormat, SketchSettingsInternal } from "./types/types";

// TODO: not using it yet.
//       check all included formats.
//       give warning and remove anything not supported and update props.framesFormat
// do it once when sketch is loaded, and set a flag to completely skip recordLoop()
// - if multiple formats, remove unsupported formats. if none supported, skip recordLoop(). default to webm?
// - dev environment or production? (ffmpeg/mp4, node/sequence not available)
export const checkSupportedFormats = (formats: FramesFormat[]) => {
  const supported: FramesFormat[] = [];

  for (const format of formats) {
    if (format === "gif") {
      // gif is supported
      supported.push("gif");
    } else if (format === "mp4") {
      if (import.meta.hot) {
        // only in dev server
        // - dev environment or production? (ffmpeg/mp4, node/sequence not available)
        // ffmpeg must be present - need to check message "ssam:ffmpeg-nosupport"
        supported.push("mp4");
      }
    } else if (format === "webm") {
      if ("VideoEncoder" in window) {
        // only in supported browser
        supported.push("webm");
      }
    } else {
      // not supported
    }
  }
  return supported;
};

export const downloadBlob = (
  blob: Blob,
  settings: SketchSettingsInternal,
  format: FramesFormat
) => {
  const { filename, prefix, suffix } = settings;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${formatFilename({
    filename,
    prefix,
    suffix,
  })}.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * format complete filename (excl. extension)
 *
 * @param param0
 * @returns
 */
export const formatFilename = ({
  filename,
  prefix = "",
  suffix = "",
}: {
  filename?: string;
  prefix?: string;
  suffix?: string;
}) => {
  return filename === undefined || filename === ""
    ? `${prefix}${formatDatetime(new Date())}${suffix}`.trim()
    : `${prefix}${filename}${suffix}`.trim();
};

/**
 * get current local datetime
 *
 * @param date
 * @returns formatted string ex. "2022.12.29-14.22.34"
 */
export const formatDatetime = (date: Date) => {
  const isoString = date.toISOString();
  const [, yyyy, mo, dd, hh, mm, ss] = isoString.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  )!;
  return `${yyyy}.${mo}.${dd}-${hh}.${mm}.${ss}`;
};

export const outlineElement = (el: HTMLElement, on: boolean) => {
  if (on) {
    el.style.outline = `3px solid red`;
    el.style.outlineOffset = `-3px`;
  } else {
    el.style.outline = "none";
    el.style.outlineOffset = `0`;
  }
};

export const toArray = (value: any) => {
  // convert to array format
  if (!Array.isArray(value)) {
    return [value];
  }
  return value;
};
