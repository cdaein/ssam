import { defineConfig, HmrContext, PluginOption } from "vite";

const hotReload = (): PluginOption => ({
  name: "hot-reload",
  handleHotUpdate({ server, file, modules }: HmrContext) {
    server.ws.on("ssam:wrap", (data) => {
      console.log(data);
    });

    return modules;
  },
});

export default defineConfig({
  plugins: [hotReload()],
});
