# Extra Topics

## Render-On-Demand

Some sketches may not need to run and update constantly and only need to update on user action, for example. In this case, you can only render-on-demand.

```js
const sketch = ({ wrap, render }) => {
  // when this object changes, it will run render a new frame
  someObject.addEventListener("change", render);

  wrap.render = () => {
    // rendering code
  };

  wrap.resize = () => {
    // render a new frame when resized
    render();
  };
};

const settings = {
  // it will not animate. use render() prop to render-on-demand
  animate: false,
};

ssam(sketch, settings);
```
