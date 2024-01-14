import { FRAMES_FORMATS } from "./constants";
import { FramesFormat, SketchSettingsInternal } from "./types/types";

export const isGifSupported = () => {
  // TODO: how to check?
  return true;
};
export const isMp4Supported = () => {
  // this only checks if ssam runs in dev server
  // whether ffmpeg is installed/available will be checkec in ssam-ffmpeg plugin
  // maybe "ssam:ffmpeg-notsupported"?
  return import.meta.hot ? true : false;
};
export const isSeqSupported = () => {
  // checks for image sequence export
  // checks if running in dev server (node:fs is available)
  return import.meta.hot ? true : false;
};
export const isWebmSupported = () => {
  return "VideoEncoder" in window;
};

// give warning and remove anything not supported and update settings.framesFormat directly
export const checkSupportedFramesFormats = (formats: FramesFormat[]) => {
  let removedFormat = "";

  for (let i = formats.length - 1; i >= 0; i--) {
    // 1. is any of the formats not valid? => warn and remove
    if (!FRAMES_FORMATS.includes(formats[i])) {
      console.warn(`"${formats[i]}" format is not supported and removed`);
      formats.splice(i, 1);
      continue;
    }
    // 2. is any of the formats not supported in browser/environment? => warn and remove
    if (
      (formats[i] === "gif" && !isGifSupported()) ||
      (formats[i] === "mp4" && !isMp4Supported()) ||
      (formats[i] === "webm" && !isWebmSupported()) ||
      (formats[i] === "png" && !isSeqSupported())
    ) {
      removedFormat = formats[i];
      formats.splice(i, 1);
    }
    if (removedFormat.length !== 0) {
      console.warn(
        `"${removedFormat}" format is not supported in the current browser or environment and removed`,
      );
      removedFormat = "";
    }
  }
  return formats;
};

export const downloadBlob = (
  blob: Blob,
  settings: SketchSettingsInternal,
  format: FramesFormat,
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
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  const isoString = date.toISOString();
  const [, yyyy, mo, dd, hh, mm, ss] = isoString.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
  )!;
  return `${yyyy}.${mo}.${dd}-${hh}.${mm}.${ss}`;
};

export const outlineElement = (el: HTMLElement, on: boolean) => {
  if (on) {
    const len =
      Math.min(parseInt(el.style.width, 10), parseInt(el.style.height, 10)) ||
      800;
    el.style.outline = `${len * 0.005}px solid red`;
    el.style.outlineOffset = `-${len * 0.005}px`;
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
