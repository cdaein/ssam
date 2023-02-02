import { defineConfig, HmrContext, PluginOption } from "vite";

const hotReload = (): PluginOption => ({
  name: "hot-reload",
  handleHotUpdate({ server, file, modules }: HmrContext) {
    server.ws.on("sketch:update", (data) => {
      // console.log("sketch is updated");

      server.ws.send({
        type: "custom",
        event: "ssam:destroy",
        data: {},
      });
    });

    return modules;
  },
});

export default defineConfig({
  plugins: [hotReload()],
});
