# Sketch Props

Your `sketch` function can use many props that are offered by `ssam`. This will save you time as it includes many common properties for creative coding sketches.

Normally, you will destructure the ones you want to use:

```js
// this is okay, but...
const sketch = (props) => {
  props.wrap.render = () => {
    //
  };
};

// this may be more convenient...
const sketch = ({ wrap }) => {
  wrap.render = ({ playhead }) => {
    //
  };
};
```

### `wrap` Prop

You will use `wrap` object to attach `render` and `resize` methods. That's the only use for now. In the future release, it may provide more features.

### Context Props

Based on which sketch mode you are using, you will have access to either `context` or `gl` prop.

|   name    |                       type                        | description                             |
| :-------: | :-----------------------------------------------: | --------------------------------------- |
| `context` |            `CanvasRenderingContext2D`             | available in `2d` mode.                 |
|   `gl`    | `WebGLRenderingContext \| WebGL2RenderingContext` | available in `webgl` or `webgl2` modes. |

### Canvas Props

|     name     |        type         | description                                                                                       |
| :----------: | :-----------------: | ------------------------------------------------------------------------------------------------- |
|   `canvas`   | `HTMLCanvasElement` | get canvas object reference.                                                                      |
|   `width`    |      `number`       | get width in `px`. When `scaleContext` is `true`, `canvas.width` is multiplied by `pixelRatio`.   |
|   `height`   |      `number`       | get height in `px`. When `scaleContext` is `true`, `canvas.height` is multiplied by `pixelRatio`. |
| `pixelRatio` |      `number`       | get the pixel ratio you set in `settings`. default: `1`                                           |

### Animation Props

|     name      |   type   | description                                                                                                       |
| :-----------: | :------: | ----------------------------------------------------------------------------------------------------------------- |
|  `duration`   | `number` | get loop duration in `ms` (ex. `4000` = 4 sec). If `settings.duration` is not set, it will be `Infinity`.         |
| `totalFrames` | `number` | get the number of total frames. If `settings.duration` is not set, it will be `Infinity`.                         |
|    `frame`    | `number` | get current frame count. starts at `0`                                                                            |
|    `time`     | `number` | get current time in `ms`. starts at `0`                                                                           |
|  `deltaTime`  | `number` | get delta time between frame renders in `ms`                                                                      |
|  `playhead`   | `number` | goes from `0` to `1` over animation duration. If `duration` is not set, it does not update, and will stay at `0`. |

### Function Props

|     name      |    type    | description                                                                                                                  |
| :-----------: | :--------: | ---------------------------------------------------------------------------------------------------------------------------- |
| `exportFrame` | `function` | Call to save a frame. Useful if you want to attach to an event.                                                              |
| `togglePlay`  | `function` | Call to toggle play and pause.                                                                                               |
|   `render`    | `function` | Call to run the code in `wrap.render()`. Useful for rendering-on-demand when you don't need to run the animation constantly. |
|   `update`    | `function` | not yet implemented. takes `settings` object to update settings. ex. `update({ pixelRatio: 2 })`                             |
