# Sketch (Rendering) Modes

You can set `settings.mode` to `2d`, `webgl` or `webgl2` based on the type of sketch you are working on. For example, to integrate with Three.js, you will want to use either `webgl` or `webgl2`.

```js
const settings = {
  mode: "webgl2",
};
```

## `2d` (default)

Use the `2d` mode to create a 2D Canvas sketch. When you set to this mode, you can access the `context` prop.

```js
const sketch = ({ wrap, context }) => {
  wrap.render = ({ width, height }) => {
    context.clearRect(0, 0, width, height);
    // ...
  };
};
```

The `context` is `CanvasRenderingContext2D` object from the vanilla Canvas API, and you can call many drawing methods on it.

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

The `webgl` mode is for 3d or shader sketches. You will most likely use it to integrate with 3d libraries such as Three.js or OGL. It give you `gl` prop, which is `WebGLRenderingContext` or `WebGL2RenderingContext` object. Note that now you don't have access to `context` prop.

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
