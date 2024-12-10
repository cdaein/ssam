import {
  applyPalette,
  GIFEncoder,
  quantize,
  // nearestColorIndex,
  // snapColorsToPalette,
} from "gifenc";
import type { Encoder } from "gifenc";
import { downloadBlob } from "../helpers";
import {
  BaseProps,
  SketchContext,
  SketchMode,
  SketchSettingsInternal,
  SketchStates,
} from "../types/types";

let gif: Encoder;
// let quantize: any;
// let applyPalette: any;

export const setupGifAnimRecord = async () => {
  const format = "gif";

  // const gifenc = await import("gifenc");
  // gif = gifenc.GIFEncoder();
  // quantize = gifenc.quantize;
  // applyPalette = gifenc.applyPalette;

  gif = GIFEncoder();

  console.log(`recording (${format}) started`);
};

export const encodeGifAnim = <Mode extends SketchMode>({
  context,
  settings,
  states,
  props,
}: {
  context: SketchContext;
  settings: SketchSettingsInternal;
  states: SketchStates;
  props: BaseProps<Mode>;
}) => {
  // record frame
  let data: Uint8ClampedArray;
  if (settings.mode === "2d") {
    data = (context as CanvasRenderingContext2D).getImageData(
      0,
      0,
      props.canvas.width,
      props.canvas.height,
    ).data;

    const palette =
      settings.gifOptions.palette ||
      quantize(data, settings.gifOptions.maxColors || 256);
    const index = applyPalette(data, palette);
    // const index = getIndexedFrame(data, palette);

    const fpsInterval = 1 / settings.exportFps;
    const delay = fpsInterval * 1000;
    gif.writeFrame(index, props.canvas.width, props.canvas.height, {
      palette,
      delay,
    });
  } else if (settings.mode === "webgpu") {
    // if (context.constructor.name !== "GPUCanvasContext") {
    //   console.warn("Not using GPUCanvasContext");
    //   return;
    // }

    // NOTE:
    // creating a temporary canvas is slow. also, using canvas.toBlob() was much faster
    // but the result was erratic with random frames in-between.
    // ideally, i can use context and buffer to get uint array but it was getting complicated so
    // will need to come back later
    const canvas = props.canvas;
    const dataURL = canvas.toDataURL("image/png");
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
      );
      data = imageData.data;
      const palette =
        settings.gifOptions.palette ||
        quantize(data, settings.gifOptions.maxColors || 256);
      const index = applyPalette(data, palette);
      // const index = getIndexedFrame(data, palette);

      const fpsInterval = 1 / settings.exportFps;
      const delay = fpsInterval * 1000;
      gif.writeFrame(index, props.canvas.width, props.canvas.height, {
        palette,
        delay,
      });
    };
  } else {
    // REVIEW: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
    const gl = context as WebGLRenderingContext | WebGL2RenderingContext;
    const pixels = new Uint8Array(
      gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
    );
    //prettier-ignore
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );

    const palette =
      settings.gifOptions.palette ||
      quantize(pixels, settings.gifOptions.maxColors || 256);
    const index = applyPalette(pixels, palette);
    // const index = getIndexedFrame(pixels, palette);

    const fpsInterval = 1 / settings.exportFps;
    const delay = fpsInterval * 1000;
    gif.writeFrame(index, props.canvas.width, props.canvas.height, {
      palette,
      delay,
    });
  }

  // TODO: where to put this warning?
  //       should i automatically clamp fps AND duration?
  if (settings.exportFps > 50) {
    console.warn(
      "clamping fps to 50, which is the maximum for GIF. animation duration will be inaccurate.",
    );
  }

  console.log(
    `recording (gif) frame... ${states.recordedFrames + 1} of ${
      settings.exportTotalFrames
    }`,
  );
};

export const endGifAnimRecord = ({
  settings,
}: {
  settings: SketchSettingsInternal;
}) => {
  const format = "gif";

  gif.finish();

  const buffer = gif.bytesView();

  downloadBlob(new Blob([buffer], { type: "image/gif" }), settings, format);

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
