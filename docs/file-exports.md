# Image/Video Exports

### Image Export

First, you can set the image format in the `settings` object:

```js
const settings = {
  frameFormat: "jpg",
  // ...
};
```

Supported image formats are `png`(default), `jpg`/`jpeg` and `webp`. When `hotkeys` is enabled, press `CMD` + `S` (Mac) or `CTRL` + `S` to export an image. You can also set `filename`, `prefix`, `suffix` in the `settings`. If you do not set `filename`, the current datetime string is used.

If you want to export multiple formats at the same time, use an array:

```js
const settings = {
  frameFormat: ["jpg", "png"],
  // ...
};
```

> ☝️ Note: in the `webgl` or `webgl2` mode, you also need to set `attributes.preserveDrawingBuffer` to `true` in the `settings` object. Otherwise, you will only get a blank image.

### Video/GIF Export

You can set the video file format in the `settings` object:

```js
const settings = {
  framesFormat: "webm",
  // ...
};
```

You can also set it to `"gif"` to export an animated GIF file. The default value for `framesFormat` is `"webm"`.

If you want to export multiple formats at the same time, use an array:

```js
const settings = {
  framesFormat: ["gif", "webm"],
  // ...
};
```

### MP4 Export

MP4 encoding is not yet supported. If you have `ffmpeg` installed on your machine, you can first render to WebM and then batch convert the WebM videos to MP4s in CLI:

```sh
for i in *.webm; do ffmpeg -i "$i" -c:v libx264 -crf 21 "${i%.*}.mp4"; done
```

Next, check out [Keyboard Shortcuts](./keyboard.md).

Or, go back to [Documentation](./index.md).
