# Ssam

Ssam wraps your HTML5 Canvas sketches and provides helpful features such as animation props and file exports. It is inspired by [`canvas-sketch`](https://github.com/mattdesl/canvas-sketch/).

> ⚠️ This module is in an early stage of development, and there may be unexpected bugs.

## Install

```sh
npm install ssam
```

## Features

- **TypeScript**: It can work both in JavaScript or TypeScript projects.
- **ESM**: You can use it alongside other ESM packages.
- **Multiple sketch modes**: It supports vanilla Canvas 2D API, WebGL context, or use with other Canvas libraries (Three.js, OGL, Two.js, Pts.js) as long as they support an existing canvas and context. p5.js is not supported (yet).
- **Animation loop**: It has `playhead` prop that repeats `0..1` and makes it easy to create a seamless animation loop. Other props such as `time`, `deltaTime` are provided as well. You can also adjust frame rate for both playing and recording.
- **Sketch settings**: Use `settings` object to reduce boilerplate code in your sketch - set up animation duration, playback frame rate, filename, etc.
- **Sketch props**: Use props for each mode to help your coding.
- **File exports**: Export canvas as image, animated GIF or WebM video at various frame rates using keyboard shortcuts.

## License

MIT
