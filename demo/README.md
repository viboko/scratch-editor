# Solid save demo

A Playwright script that walks through saving a Scratch project to a Solid Pod, and records it, with a spoken
narration, to `demo/satchel-demo.mp4`. Alongside it go the narration as WebVTT subtitles, `demo/satchel-demo.vtt`,
and a poster image, `demo/satchel-demo-poster.webp`, of the video's opening splash screen
([`splash.html`](splash.html)). None of them is committed here: they're published on the
[satchel-project](https://github.com/viboko/satchel-project) site, so copy them there after a run.

```bash
just demo
```

It needs `ffmpeg`, `cwebp` (`brew install webp`), [`uv`](https://docs.astral.sh/uv/) and ports 3000 and 8601. It
starts its own Community Solid Server with empty storage (`demo/.css-data`), so stop `just css-up` first. It reuses a
`just dev` editor if one is running.

The script:

1. Shows a splash screen while the narration introduces the demo.
2. Signs up on the local Community Solid Server and creates a Pod called `my-pod`.
3. Opens `solid-save.html`, loads [`satchel.sb3`](satchel.sb3) from disk, and plays it with the arrow keys until the
   cat picks up the satchel.
4. Saves with File > Save now, entering the WebID `http://localhost:3000/my-pod/profile/card#me`, and authorises
   Scratch on the Solid server.
5. Signs in to [Solid File Manager](https://filemanager.solid-experiments.org/) with `http://localhost:3000` and
   opens `scratch/satchel.sb3`, which it can't preview.
6. Downloads `satchel.sb3` and opens it in [ezyZip](https://www.ezyzip.com/extract-zip-file-online.html), an online
   zip tool, to show that an `.sb3` is just a zip: `project.json` plus the costumes and sounds. The script blocks
   requests from ezyZip's page to other hosts (its ads, analytics and cookie-consent dialog). ezyZip unzips in the
   browser, so the file isn't uploaded.

## Narration

The narration lives in [`captions.mjs`](captions.mjs), one line per step. Each line is both what the voice says and
its subtitle, word for word. The voice takes its intonation from punctuation and sentence shape, so lines work best as
varied, conversational sentences, written the way they should be said. `just demo` runs three steps:

1. [`narrate.py`](narrate.py) turns each line into speech with Resemble AI's
   [Chatterbox](https://huggingface.co/ResembleAI/chatterbox) (MIT licensed), running locally. `uv run` installs its
   Python dependencies, and the first run downloads the model (a few GB) to the Hugging Face cache. Clips go to
   `demo/narration/` and are only regenerated when their text or the settings change. `--exaggeration`,
   `--cfg-weight` and `--voice-prompt` (a recording of a voice to clone) change the voice; see
   `uv run demo/narrate.py --help`. Chatterbox adds an inaudible watermark to everything it generates.
2. The script starts each line once the previous one has finished, so the narration sets the pace. It notes when
   each line starts, and how long it lasts, in `demo/narration/timeline.json`.
3. [`mux-narration.mjs`](mux-narration.mjs) mixes the clips into the recording at those times, since Playwright
   records video only. It writes the subtitles from the same timeline, to `demo/satchel-demo.vtt` for a web page's
   `<track>`, and as a subtitle track inside the MP4 for video players.

## Doing it by hand

Doing this by hand in your own Chrome: when the file manager first signs in, Chrome asks whether it may access devices
on your local network. Allow it, or the file manager can't reach `localhost:3000`. The script grants this permission
itself.
