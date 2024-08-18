import { defineConfig } from "tsup";
import esbuildPluginLicense from "esbuild-plugin-license";

const licenseNoticeOpts = {
  banner: `
/*! 
 * <%= pkg.name %> v<%= pkg.version %> | <%= pkg.license %> 
 * Find third-party licenses in LICENSE.txt  
 */
`,
  thirdParty: {
    output: {
      file: "LICENSE.txt",
      template(dependencies: any) {
        return dependencies
          .map(
            (dep: any) =>
              `${dep.packageJson.name}:${dep.packageJson.version} by ${dep.packageJson.author?.name} -- ${dep.packageJson.license} -- ${dep.packageJson.repositoery?.url || dep.packageJson.homepage}`,
          )
          .join("\n");
      },
    },
  },
};

export default defineConfig([
  // npm module (no bundling)
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "esnext",
    dts: true,
    splitting: true,
    sourcemap: false,
    clean: true,
    treeshake: true,
    // minify: true,
    external: ["p5"],
  },
  // es6 module (bundled) - this works. include LICENSE notice at top; use plugin?
  {
    entry: {
      ssam: "src/index.ts",
    },
    format: ["esm"],
    outDir: "dist",
    bundle: true,
    skipNodeModulesBundle: false,
    target: "esnext",
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    outExtension() {
      return {
        js: ".esm.js",
      };
    },
    esbuildPlugins: [esbuildPluginLicense(licenseNoticeOpts)],
    external: ["p5"],
    noExternal: [/./],
  },
  // iife
  // {
  //   entry: {
  //     ssam: "src/index.ts",
  //   },
  //   globalName: "Ssam",
  //   format: ["iife"],
  //   outDir: "dist",
  //   platform: "browser",
  //   // bundle: true,
  //   target: "esnext",
  //   dts: true,
  //   splitting: false,
  //   sourcemap: true,
  //   clean: true,
  //   treeshake: true,
  //   minify: true,
  //   outExtension() {
  //     return {
  //       js: ".min.js",
  //     };
  //   },
  //   esbuildPlugins: [esbuildPluginLicense(licenseNoticeOpts)],
  //   external: ["p5"],
  // },
  // {
  //   entry: {
  //     ssam: "src/index.ts",
  //   },
  //   globalName: "Ssam",
  //   format: ["iife"],
  //   outDir: "dist",
  //   platform: "browser",
  //   // bundle: true,
  //   target: "esnext",
  //   dts: true,
  //   splitting: false,
  //   sourcemap: true,
  //   clean: true,
  //   treeshake: true,
  //   minify: false,
  //   outExtension() {
  //     return {
  //       js: ".js",
  //     };
  //   },
  //   esbuildPlugins: [esbuildPluginLicense(licenseNoticeOpts)],
  //   external: ["p5"],
  // },
]);
