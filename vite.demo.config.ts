import { defineConfig, HmrContext, PluginOption } from "vite";

const hotReload = (): PluginOption => ({
  name: "hot-reload",
  handleHotUpdate({ server, file, modules }: HmrContext) {
    server.ws.on("ssam:wrap", (data) => {
      // console.log(data.props);
    });

    return modules;
  },
});

export default defineConfig({
  plugins: [hotReload()],
  // server: {
  //   hmr: {
  //     overlay: false,
  //   },
  // },
});
