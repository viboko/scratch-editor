# Solid save demo

A Playwright script that walks through saving a Scratch project to a Solid Pod, and records it, with captions and a
spoken narration, to [`satchel-demo.mp4`](satchel-demo.mp4).

```bash
just demo
```

It needs `ffmpeg` and ports 3000 and 8601. It starts its own Community Solid Server with empty storage
(`demo/.css-data`), so stop `just css-up` first. It reuses a `just dev` editor if one is running.

The script:

1. Signs up on the local Community Solid Server and creates a Pod called `my-pod`.
2. Opens `solid-save.html`, loads [`satchel.sb3`](satchel.sb3) from disk, and plays it with the arrow keys until the
   cat picks up the satchel.
3. Saves with File > Save now, entering the WebID `http://localhost:3000/my-pod/profile/card#me`, and authorises
   Scratch on the Solid server.
4. Signs in to [Solid File Manager](https://filemanager.solid-experiments.org/) with `http://localhost:3000` and
   opens `scratch/satchel.json`.

## Narration

The captions live in [`captions.mjs`](captions.mjs), each with an optional `say` for when the written text reads badly
aloud. `just demo` runs three steps:

1. [`narrate.mjs`](narrate.mjs) turns each caption into speech with [Kokoro](https://github.com/hexgrad/kokoro), a
   small text-to-speech model that runs locally through `kokoro-js`. The first run downloads the model (about 90 MB)
   into `node_modules/@huggingface/transformers/.cache`. Clips go to `demo/narration/` and are only regenerated when
   their text or the voice changes. Choose a different voice with `NARRATION_VOICE`, for example
   `NARRATION_VOICE=bm_george just demo`.
2. The script shows each caption once the previous line of narration has finished, so the narration sets the pace.
   It notes when each caption appeared in `demo/narration/timeline.json`.
3. [`mux-narration.mjs`](mux-narration.mjs) mixes the clips into the recording at those times. Playwright records
   video only, so the sound is added here.

## Doing it by hand

Doing this by hand in your own Chrome: when the file manager first signs in, Chrome asks whether it may access devices
on your local network. Allow it, or the file manager can't reach `localhost:3000`. The script grants this permission
itself.
