# Hot Reload

Ssam supports Hot Reloading. Instead of a full page refresh every time you update and save your code, hot reloading applies the udpates to the sketch while keeping the current sketch states. This is great for creating animation content as your animation will continue playing when files are saved and updates are applied.

> ⚠️ This feature is still experimental, and the methods introduced below may change in future releases.

To enable hot reloading, update the `sketch` structure as below:

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
    // clean up any side-effects such as event listeners, if any.
  };
};
```

`wrap.dispose()` stores the current sketch states such as `time`, `playhead` and `frame` right before hot reloading, and `wrap.hotReload()` initializes a new sketch and remove all side effects and any queued animation frame. The new sketch uses the sketch states from before so the change will be applied seamlessly. If you use any side effects yourself such as mouse or keyboard event listeners, make sure to remove them in `wrap.unload()`. Otherwise, those events will continue to be added every hot reload.

Next, check out [Extra Topics](./extra.md)

Or, go back to [Documentation](./index.md).
