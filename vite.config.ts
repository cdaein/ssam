import { defineConfig, HmrContext, PluginOption } from "vite";

const hotReload = (): PluginOption => ({
  name: "hot-reload",
  handleHotUpdate({ server, file, modules }: HmrContext) {
    return modules;
  },
});

export default defineConfig({
  plugins: [hotReload()],
});
