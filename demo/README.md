# Solid save demo

A Playwright script that walks through saving a Scratch project to a Solid Pod, and records it, with captions and a
spoken narration, to `demo/satchel-demo.mp4`. The recording isn't committed here: it's published on the
[satchel-project](https://github.com/viboko/satchel-project) site, so copy it there after a run.

```bash
just demo
```

It needs `ffmpeg`, [`uv`](https://docs.astral.sh/uv/) and ports 3000 and 8601. It starts its own Community Solid Server with empty storage
(`demo/.css-data`), so stop `just css-up` first. It reuses a `just dev` editor if one is running.

The script:

1. Signs up on the local Community Solid Server and creates a Pod called `my-pod`.
2. Opens `solid-save.html`, loads [`satchel.sb3`](satchel.sb3) from disk, and plays it with the arrow keys until the
   cat picks up the satchel.
3. Saves with File > Save now, entering the WebID `http://localhost:3000/my-pod/profile/card#me`, and authorises
   Scratch on the Solid server.
4. Signs in to [Solid File Manager](https://filemanager.solid-experiments.org/) with `http://localhost:3000` and
   opens `scratch/satchel.sb3`, which it can't preview.
5. Downloads `satchel.sb3` and opens it in [ezyZip](https://www.ezyzip.com/extract-zip-file-online.html), an online
   zip tool, to show that an `.sb3` is just a zip: `project.json` plus the costumes and sounds. The script blocks
   requests from ezyZip's page to other hosts (its ads, analytics and cookie-consent dialog). ezyZip unzips in the
   browser, so the file isn't uploaded.

## Narration

The captions live in [`captions.mjs`](captions.mjs). Each has the on-screen `text`, and optionally `say`, the line the
voice reads instead. The voice takes its intonation from punctuation and sentence shape, so spoken lines work best as
varied, conversational sentences. `just demo` runs three steps:

1. [`narrate.py`](narrate.py) turns each caption into speech with Resemble AI's
   [Chatterbox](https://huggingface.co/ResembleAI/chatterbox) (MIT licensed), running locally. `uv run` installs its
   Python dependencies, and the first run downloads the model (a few GB) to the Hugging Face cache. Clips go to
   `demo/narration/` and are only regenerated when their text or the settings change. `--exaggeration`,
   `--cfg-weight` and `--voice-prompt` (a recording of a voice to clone) change the voice; see
   `uv run demo/narrate.py --help`. Chatterbox adds an inaudible watermark to everything it generates.
2. The script shows each caption once the previous line of narration has finished, so the narration sets the pace.
   It notes when each caption appeared in `demo/narration/timeline.json`.
3. [`mux-narration.mjs`](mux-narration.mjs) mixes the clips into the recording at those times. Playwright records
   video only, so the sound is added here.

## Doing it by hand

Doing this by hand in your own Chrome: when the file manager first signs in, Chrome asks whether it may access devices
on your local network. Allow it, or the file manager can't reach `localhost:3000`. The script grants this permission
itself.
