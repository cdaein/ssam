# Ssam documentation

- [Sketch (Rendering) Modes](./modes.md)
- [Sketch Props](./props.md)
- [Sketch Settings](./settings.md)
- [Image/Video Exports](./file-exports.md)
- [Keyboard Shortcuts](./keyboard.md)
- Hot Reload (not yet implemented)
- Git Commit Snapshot (not yet implemented)
- [Local Development Environment](./dev-env.md)
- [Extra Topics](./extra.md)

## Basics

By running `npm create ssam@latest`, it will set up all the necessary files and Vite bundler setup, using one of the pre-built templates you choose (ex. vanilla, three.js, etc.).

After the installation, `cd` into the project directory and start the dev server with `npm run dev`.

If you need to manually import the Ssam package,

```js
import { ssam } from "ssam";
```

### Ssam Structure

Ssam is a wrapper around your Canvas sketch. It is not a Canvas drawing library or framework. It does not offer any drawing, color or other convenience functions. It, however, setps up a boilerplate code behind the scene to save you time from writing the same code every time.

The basic structure looks like this:

```js
import { ssam } from "ssam";

// use wrap object to attach render/resize methods
const sketch = ({ wrap }) => {
  // any code that runs once when the page loads goes here

  wrap.render = () => {
    // any code that runs each frame goes here
  };

  wrap.resize = () => {
    // any code that runs when the canvas resizes goes here.
    // resize() also runs immediately after render() the first time.
  };
};

const settings = {
  mode: "2d",
  dimensions: [800, 600], // comment out for fullscreen sketch
  pixelRatio: window.devicePixelRatio,
  animate: true // default: true
  duration: 4_000, // in milliseconds
  framesFormat: "webm", // video export format
}

// call ssam with sketch and settings to prepare canvas
// and run your sketch code.
ssam(sketch, settings)
```

Other than what is introduced in the structure above, Ssam does not assume anything. It is up to you to use it any way you like.

Next, check out [Sketch (Rendering) Modes](./modes.md).
