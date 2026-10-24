# Solid save demo

A Playwright script that walks through saving a Scratch project to a Solid Pod, and records it to
[`satchel-demo.mp4`](satchel-demo.mp4).

```bash
just demo
```

It needs `ffmpeg` for the MP4 and ports 3000 and 8601. It starts its own Community Solid Server with empty storage
(`demo/.css-data`), so stop `just css-up` first. It reuses a `just dev` editor if one is running.

The script:

1. Signs up on the local Community Solid Server and creates a Pod called `my-pod`.
2. Opens `solid-save.html`, loads [`satchel.sb3`](satchel.sb3) from disk, and plays it with the arrow keys until the
   cat picks up the satchel.
3. Saves with File > Save now, entering the WebID `http://localhost:3000/my-pod/profile/card#me`, and authorises
   Scratch on the Solid server.
4. Signs in to [Solid File Manager](https://filemanager.solid-experiments.org/) with `http://localhost:3000` and
   opens `scratch/satchel.json`.

Doing this by hand in your own Chrome: when the file manager first signs in, Chrome asks whether it may access devices
on your local network. Allow it, or the file manager can't reach `localhost:3000`. The script grants this permission
itself.
