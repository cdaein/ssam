# Git Commit Image Snapshot

Creative coding involves making a lot of small tweaks to the same codebase. Without a system in place, many of the unique and interesting visual outcomes are lost by overwriting the code. You can export images to keep records but it's hard to reproduce the same code. You can use Git to snapshot your code, but it's hard to find a commit when you have hundreds of snapshots.

Ssam handles both at the same time by committing to Git to save the code snapshot and export an image with the commit hash at the same time, thus making it easy to reproduce the exact same code and the outcome. This feature was one of my favorites and most helpful from `canvas-sketch`.

## How It Works

When you press `Cmd(or Ctrl) + K`, it will commit the current code snapshot to the local git repository and export an image with the commit hash. If you later decide to go back to one of the snapshots, you can use the hash to checkout the commit.

> If you want to use this feature, your project folder needs to be a Git repo. You will first need to run `git init` in the Terminal in your project folder.

The Git commit and image snapshot will only work in the development server through Vite. If you want to completely disable this feature, remove `gitSnapshot()` plugin from the Vite config file.
