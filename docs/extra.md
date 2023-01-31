# Extra Topics

## Render-On-Demand

Some sketches may not need to run and update constantly and only need to update based on a condition. In this case, you can use the `render` function prop to render on-demand.

```js
const sketch = ({ wrap, render }) => {
  // when this object changes, it renders a new frame
  someObject.addEventListener("change", render);

  // run render() for each mouse click
  window.addEventListener("click", () => {
    render();
  });

  wrap.render = () => {
    // place rendering code here
  };

  wrap.resize = () => {
    // render a new frame when resized
    render();
  };
};

const settings = {
  // animation is disabled, but you can still use render() prop to render on-demand
  animate: false,
};

ssam(sketch, settings);
```

## Asynchronous Operation

Sometimes, you need to run an asynchronous operation such as loading image or texture. In that case, add the `async` keyword to your `sketch` function and/or `render` method. This is especially useful if you want to reliably export a video/GIF frames.

```js
const sketch = async ({ wrap }) => {
  // 3d libraries may have async methods like this:
  const texture = await TextureLoader.load("/texture.png");

  wrap.render = async ({ width, height }) => {
    await TextureLoader.update(texture);
  };
};
```
