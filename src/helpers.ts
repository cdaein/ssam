import { FramesFormat, SketchSettingsInternal } from "./types/types";

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
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);

  const isoString = date.toISOString();
  const [full, yyyy, mo, dd, hh, mm, ss] = isoString.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  )!;

  // localeString: 12/29/2022, 2:39:37 PM
  // const str = localeString.match(
  //   /(\d{1,2})\/(\d{1,2})\/(\d{4}),\s(\d{1,2}):(\d{1,2}):(\d{1,2})\s(AM|PM)/
  // );

  const formatted = `${yyyy}.${mo}.${dd}-${hh}.${mm}.${ss}`;

  return formatted;
};

export const toArray = (value: any) => {
  // convert to array format
  if (!Array.isArray(value)) {
    return [value];
  }
  return value;
};
