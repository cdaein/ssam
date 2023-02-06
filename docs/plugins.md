# Plugins

When you create a new sketch with Ssam with `create-ssam` CLI command, it sets up the sketch with [Vite](https://vitejs.dev/) which runs a local development server. It also generates a production build using Rollup. Vite handles the most common dev setups behind the scene so you don't have to worry about it. It also has a plugin system - Vite plugins for development and Rollup plugins for production build. In fact, Git commit snapshot feature is a plugin in itself.

Here are some of the plugins that might be useful in creative coding projects:

### [`vite-plugin-glsl`](https://github.com/UstymUkhman/vite-plugin-glsl)

This plugin is already included if you use one of the shader tempaltes.

### `rollup-plugin-analyzer`

...
