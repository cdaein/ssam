# Sketch (Rendering) Modes

You can set `settings.mode` to `2d`, `webgl` or `webgl2` based on the type of a sketch you are working on. For example, to integrate with Three.js, you will want to use either `webgl` or `webgl2` and supply the canvas to Three.js' renderer.

```js
const settings = {
  mode: "webgl2",
};
```

## `2d` (default)

Use the `2d` mode to create a 2D Canvas sketch. You can now access the `context` prop.

```js
const sketch = ({ wrap, context }) => {
  wrap.render = ({ width, height }) => {
    context.clearRect(0, 0, width, height);
    // ...
  };
};
```

The `context` is a `CanvasRenderingContext2D` object from the vanilla Canvas API, and you can call many methods on it. See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) for more info.

In TypeScript,

```ts
const sketch = ({ wrap, context }: SketchProps) => {
  wrap.render = ({ width, height }: SketchProps) => {
    context.clearRect(0, 0, width, height);
    // ...
  };
};
```

You may want to rename the `context` to something shorter like `ctx`:

```js
const sketch = ({ wrap, context: ctx }) => {
  wrap.render = ({ width, height }) => {
    // now context is renamed to ctx
    ctx.clearRect(0, 0, width, height);
  };
};
```

## `webgl` and `webgl2`

The `webgl` mode is for 3d or shader sketches. You will most likely use it to integrate with 3d libraries such as Three.js or OGL. It gives you the `gl` prop, which is `WebGLRenderingContext` or `WebGL2RenderingContext` object. Note that now you use `gl` instead of the `context` prop.

```js
const sketch = ({ wrap, gl }) => {
  gl.clearColor(1, 1, 1, 1);

  wrap.render = ({ width, height }) => {
    // ...
  };
};
```

In TypeScript,

```ts
const sketch = ({ wrap, gl }: WebGLProps) => {
  gl.clearColor(1, 1, 1, 1);

  wrap.render = ({ width, height }: WebGLProps) => {
    // ...
  };
};
```

Next, check out [Sketch Props](./props.md).
