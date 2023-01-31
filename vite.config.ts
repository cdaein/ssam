import { defineConfig, HmrContext, PluginOption } from "vite";

// const hotReload = (): PluginOption => ({
//   name: "hot-reload",
//   handleHotUpdate({ server, file, modules }: HmrContext) {
//     return modules;
//   },
// });

export default defineConfig({
  // server: {
  //   //
  // },
  // plugins: [hotReload()],
});

// import { fileURLToPath } from "url";
// import { createServer } from "vite";

// const __dirname = fileURLToPath(new URL(".", import.meta.url));

// (async () => {
//   const server = await createServer({
//     // any valid user config options, plus `mode` and `configFile`
//     configFile: false,
//     root: __dirname,
//     server: {
//       port: 1337,
//     },
//   });
//   await server.listen();

//   console.log("server running");

//   server.printUrls();
// })();
