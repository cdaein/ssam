![example gif animation](./docs/example.gif)

# Ssam

Ssam.js (쌈 as in [Korean dish](https://en.wikipedia.org/wiki/Ssam)) wraps your HTML5 Canvas sketches and provides helpful features such as animation props and file exports. It is inspired by [`canvas-sketch`](https://github.com/mattdesl/canvas-sketch/).

> ⚠️ This module is in an early stage of development, and there may be unexpected bugs.

## Install

The easiest and quickest way to set up a sketch with Ssam is to use `create-ssam` CLI command. You don't need to install anything (except Node.js) in advance. Simply run the command below and you can jump straight into creative coding:

```sh
npm create ssam@latest
```

The prompts will guide you through options and templates. See [`create-ssam`](https://github.com/cdaein/create-ssam) for the list of templates.

Alternatively, if you only want to install `ssam` package into your own set up:

```sh
npm install ssam
```

## How to

- See [Wiki](https://github.com/cdaein/ssam/wiki) for documentation.
- [ssam-examples](https://github.com/cdaein/ssam-examples) repo has basic examples.
- [ssam-thing-examples](https://github.com/cdaein/ssam-thing-examples) repo has examples of drawing with Thing Umbrella packages.

## Features

- **TypeScript**: It can work both in JavaScript or TypeScript projects.
- **ESM**: You can use it alongside other ESM packages.
- **Vitejs**: Vitejs is modern and fast. You can extend the config to add functionality. Ssam also has a few of its own plugins.
- **Multiple sketch modes**: It supports vanilla Canvas 2D API, WebGL context, or you can use with other Canvas libraries (Three.js, OGL, Two.js, Pts.js, etc.) as long as they support an existing canvas. p5.js is not supported (yet).
- **Hot Reload**: Code updates will be instantly applied without a full page refresh and wthout losing the sketch states.
- **Git snapshot**: Commit your code to git and export a frame with the same hash for an easy archiving and retrieval.
- **Timelapse documentation**: Automatically export an image when you save your code to create a visual documentation of your project over time.
- **Animation loop**: The `playhead` prop repeats `0..1` and makes it easy to create a seamless animation loop. Other props such as `time`, `frame`, `deltaTime` and `loopCount` are provided as well. You can also adjust frame rate for playing and exporting independently.
- **Sketch settings**: Many essential settings reduce boilerplate code in your sketch - animation duration, playback frame rate, filename, etc.
- **Sketch props**: Use props for each mode such as `context`, `width`, `height` to help your coding.
- **File exports**: Export canvas as image, animated GIF, PNG sequence or MP4/WebM video at various frame rates.

## Example

The code used to create the cover gif:

```typescript
import { drawRect } from "@daeinc/draw";
import { snapBy } from "@daeinc/math";
import { css, hsv, srgb } from "@thi.ng/color";
import { Smush32 } from "@thi.ng/random";
import { ssam } from "ssam";
import type { Sketch, SketchSettings } from "ssam";

const seed = 1249;
const rnd = new Smush32(seed);
const num = 200;

const sketch: Sketch<"2d"> = ({ wrap, context: ctx, width, height }) => {
  const sn = 40; // snap
  const rects = Array.from({ length: num }, (_, i) => {
    const w = snapBy(rnd.minmaxInt(sn, 200), sn);
    const h = snapBy(rnd.minmaxInt(sn, 100), sn);
    const x = snapBy(rnd.minmaxInt((sn + w) / 2, width - (sn + w) / 2), sn);
    const y = snapBy(rnd.minmaxInt((sn + h) / 2, height - (sn + h) / 2), sn);
    return [x, y, w, h];
  });

  wrap.render = ({ playhead }) => {
    ctx.fillStyle = css(srgb(hsv(0, 0, 0.95)));
    ctx.fillRect(0, 0, width, height);

    rects.forEach((r, i) => {
      const w = r[2] / 2 + (Math.sin(i + playhead * Math.PI * 2) * r[2]) / 2;
      drawRect(ctx, [snapBy(r[0], 1), snapBy(r[1], 1)], [w, r[3]], "center");
      const c = hsv([
        (i / num) * 0.15,
        Math.sin(i) * 0.5 + 0.5,
        Math.cos(i / 8) * 0.4 + 0.9,
      ]);
      if (i % 5 === 0) {
        ctx.fillStyle = css(srgb(c));
        ctx.fill();
      } else {
        ctx.strokeStyle = css(srgb(c));
        ctx.stroke();
      }
    });
  };
};

const settings: SketchSettings = {
  dimensions: [600, 200],
  duration: 3_000,
  playFps: 12,
  exportFps: 12,
  pixelated: true,
  framesFormat: ["gif"],
};

ssam(sketch, settings);
```

## License

MIT
