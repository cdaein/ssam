# Hot Reload

Ssam supports Hot Reloading. Instead of a full page refresh every time you update and save your code, hot reloading evaluates the modules that have been updated and replaces them with the new ones while keeping the current sketch states. This is great for creating animation content as your animation will not start from the beginning every time you update the code.

> This API is still experimental, and the methods introduced below may change in future releases.

To enable hot reloading, add this bit inside the `sketch` function:

```js
const sketch = () => {
  // enable hot reloading
  if (import.meta.hot) {
    import.meta.hot.dispose(() => wrap.dispose());
    import.meta.hot.accept(() => wrap.hotReload());
  }

  wrap.render = () => {
    // ...
  };

  wrap.unload = () => {
    // clean up any side-effects here such as event listener, if any.
  };
};
```

`wrap.dispose()` stores the current sketch states such as `time`, `playhead` and `frame` right before hot reloading, and `wrap.hotReload()` initializes a new sketch and remove all side effects and a queued animation frame. The new sketch will be use the sketch states from before so the change will be applied seamlessly. If you use any side effects yourself such as mouse or keyboard event listeners, make sure to remove them in `wrap.unload()`. Otherwise, those events will continue to be added every hot reload.

Next, check out [Extra Topics](./extra.md)

Or, go back to [Documentation](./index.md).
