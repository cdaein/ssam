# Git Commit And Image Snapshot

Creative coding involves making a lot of small tweaks to the same codebase. Without a system in place, many of the unique and interesting visual outcomes are lost by overwriting the code. You can export images to keep records but it's hard to reproduce the same code. You can use Git to snapshot your code, but it's hard to find a commit when you have hundreds of snapshots.

Ssam handles both at the same time by committing to Git to save the code snapshot and export an image with the git hash at the same time, thus making it easy to reproduce the exact same outcome from the code in the future. This feature was one of my favorites from `canvas-sketch` and I'm bringing it to the Ssam as well.

## How It Works

With Ssam, you can export an image with `Cmd(or Ctrl) + S` keypress. Instead, when you press `Cmd(or Ctrl) + K`, it not only exports and image but also commit the current codesnapshot to your local git repository. If you later decide to go back to one of the snapshots, it will be much easier to compare the images and checkout the Gif commit with the hash.

> If you want to use this feature, your project folder needs to be a Git repo. You will first need to run `git init` in the Terminal in your project folder.

The Git commiting and image snapshot will only work in the development server through Vite dev server. If you want to completely disable this feature, remove `gitSnapshot()` plugin from the config file.
