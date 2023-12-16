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

See [documentation](https://github.com/cdaein/ssam/wiki)

## Features

- **TypeScript**: It can work both in JavaScript or TypeScript projects.
- **ESM**: You can use it alongside other ESM packages.
- **Vitejs**: Vitejs is modern and fast. You can extend the config to add funtionality. Ssam also has a few of its own plugins.
- **Multiple sketch modes**: It supports vanilla Canvas 2D API, WebGL context, or you can use with other Canvas libraries (Three.js, OGL, Two.js, Pts.js, etc.) as long as they support an existing canvas. p5.js is not supported (yet).
- **Hot Reload**: Code updates will be instantly applied without a full page refresh and wthout losing the sketch states.
- **Git snapshot**: Commit your code to git and export a frame with the same hash for an easy archiving and retrieval.
- **Timelapse documentation**: Automatically export an image when you save your code to create a visual documentation of your project over time.
- **Animation loop**: The `playhead` prop repeats `0..1` and makes it easy to create a seamless animation loop. Other props such as `time`, `frame`, `deltaTime` and `loopCount` are provided as well. You can also adjust frame rate for playing and exporting independently.
- **Sketch settings**: Many essential settings reduce boilerplate code in your sketch - animation duration, playback frame rate, filename, etc.
- **Sketch props**: Use props for each mode such as `context`, `width`, `height` to help your coding.
- **File exports**: Export canvas as image, animated GIF, PNG sequence or MP4/WebM video at various frame rates.

## Example

```js
import { ssam } from "ssam";
import type { Sketch, SketchProps, SketchSettings } from "ssam";

const sketch = ({ wrap, width, height }: SketchProps) => {
  //  setup/init
  const numShapes = 40;
  const colors = [`#aaa`, `blue`, `white`, `black`, `lightpink`];
  const lines = new Array(numShapes).fill({}).map(() => ({
    x: Math.random() * width,
    y: 0,
    w: (Math.random() * width) / 10 + width / 40,
    h: height,
  }));

  wrap.render = ({ context: ctx, playhead }: SketchProps) => {
    // animation loop
    ctx.fillStyle = `lightblue`;
    ctx.fillRect(0, 0, width, height);

    lines.forEach((line, i) => {
      const cycle = Math.sin(i + playhead * Math.PI * 2);
      ctx.beginPath();
      ctx.rect(line.x + (cycle * width) / 8, line.y, line.w, line.h);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    });
  };

  wrap.resize = ({ width, height }: SketchProps) => {
    // resize
    console.log(width, height);
  };
};

// sketch settings
const settings: SketchSettings = {
  mode: "2d",
  dimensions: [320, 320],
  pixelRatio: 1,
  duration: 3_000,
  playFps: 12,
  exportFps: 12,
  frameFormat: "png",
  framesFormat: "gif",
};

ssam(sketch as Sketch, settings);
```

The code above can create and export the gif:

![example gif animation](./docs/example.gif)

## License

MIT
