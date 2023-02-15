import {
  GIFEncoder,
  quantize,
  applyPalette,
  nearestColorIndex,
  snapColorsToPalette,
} from "gifenc";
import type { Encoder } from "gifenc";
import { downloadBlob } from "../helpers";
import {
  BaseProps,
  SketchSettingsInternal,
  SketchStates,
} from "../types/types";

let gif: Encoder;

export const setupGifAnimRecord = ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
}) => {
  const format = "gif";

  gif = GIFEncoder();

  canvas.style.outline = `3px solid red`;
  canvas.style.outlineOffset = `-3px`;

  console.log(`recording (${format}) started`);
};

export const exportGifAnim = ({
  canvas,
  context,
  settings,
  states,
  props,
}: {
  canvas: HTMLCanvasElement;
  context:
    | CanvasRenderingContext2D
    | WebGLRenderingContext
    | WebGL2RenderingContext;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps;
}) => {
  if (!states.captureDone) {
    // record frame
    let data: Uint8ClampedArray;
    if (settings.mode === "2d") {
      data = (context as CanvasRenderingContext2D).getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      const palette =
        settings.gifOptions.palette ||
        quantize(data, settings.gifOptions.maxColors || 256);
      const index = applyPalette(data, palette);
      // const index = getIndexedFrame(data, palette);

      const fpsInterval = 1 / settings.exportFps;
      const delay = fpsInterval * 1000;
      gif.writeFrame(index, canvas.width, canvas.height, { palette, delay });
    } else {
      // REVIEW: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
      let gl: WebGLRenderingContext | WebGL2RenderingContext;
      if (settings.mode === "webgl") {
        gl = context as WebGLRenderingContext;
      } else {
        // webgl2
        gl = context as WebGL2RenderingContext;
      }
      const pixels = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4
      );
      //prettier-ignore
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 
                    gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      const palette =
        settings.gifOptions.palette ||
        quantize(pixels, settings.gifOptions.maxColors || 256);
      const index = applyPalette(pixels, palette);
      // const index = getIndexedFrame(pixels, palette);

      const fpsInterval = 1 / settings.exportFps;
      const delay = fpsInterval * 1000;
      gif.writeFrame(index, canvas.width, canvas.height, { palette, delay });
    }
  }

  // TODO: where to put this warning?
  //       should i automatically clamp fps AND duration?
  if (settings.exportFps > 50) {
    console.warn(
      "clamping fps to 50, which is the maximum for GIF. animation duration will be inaccurate."
    );
  }

  // TODO: this should be in settings, states or props
  const totalFrames = Math.floor(
    (settings.exportFps * settings.duration) / 1000
  );
  console.log(`recording (gif) frame... ${props.frame + 1} of ${totalFrames}`);
};

export const endGifAnimRecord = ({
  canvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  settings: SketchSettingsInternal;
}) => {
  const format = "gif";

  gif.finish();
  // REVIEW: buffer type
  const buffer: ArrayBuffer = gif.bytesView();

  downloadBlob(new Blob([buffer], { type: "image/gif" }), settings, format);

  canvas.style.outline = "none";
  canvas.style.outlineOffset = `0 `;

  console.log(`recording (${format}) complete`);
};

/**
 * this solves an occasional flickering issue.
 * REVIEW: this didn't work for 2-color (white, gray) animation. (complete blank screen)
 * by davepagurek from: https://github.com/mattdesl/gifenc/issues/13
 * @param frame
 * @param palette
 * @returns
 */
// const getIndexedFrame = (
//   frame: Uint8Array | Uint8ClampedArray,
//   palette: number[][]
// ) => {
//   const paletteCache: { [key: number]: number } = {};
//   const length = frame.length / 4;
//   const index = new Uint8Array(length);
//   for (let i = 0; i < length; i++) {
//     const key =
//       (frame[i * 4] << 24) |
//       (frame[i * 4 + 1] << 16) |
//       (frame[i * 4 + 2] << 8) |
//       frame[i * 4 + 3];
//     if (paletteCache[key] === undefined) {
//       paletteCache[key] = nearestColorIndex(
//         palette,
//         //@ts-ignore
//         frame.slice(i * 4, (i + 1) * 4)
//       );
//     }
//     index[i] = paletteCache[key];
//   }
//   return index;
// };
