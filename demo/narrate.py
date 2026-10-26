# /// script
# requires-python = "==3.11.*"
# dependencies = [
#     "chatterbox-tts==0.1.7",
#     # resemble-perth, which Chatterbox uses to watermark its audio, still imports pkg_resources.
#     "setuptools<81",
# ]
# ///
"""Generates a narration clip for every caption in captions.mjs, with Resemble AI's Chatterbox running locally.

Writes demo/narration/<id>.wav and demo/narration/manifest.json, which the demo reads to pace itself. A clip is only
regenerated when its text or the settings change. Run it with `uv run demo/narrate.py`, which installs its
dependencies. The model (a few GB) downloads to the Hugging Face cache on first use.

Chatterbox samples its output, so each clip is seeded from its text and settings to make reruns reproducible.
"""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import torch
import torchaudio

DEMO_DIR = Path(__file__).parent
OUT_DIR = DEMO_DIR / "narration"
MANIFEST_PATH = OUT_DIR / "manifest.json"


def load_captions():
    script = "import('./captions.mjs').then(m => console.log(JSON.stringify(m.captions)))"
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=DEMO_DIR, capture_output=True,
                            text=True, check=True)
    return json.loads(result.stdout)


def load_model(name, device):
    if name == "turbo":
        from chatterbox.tts_turbo import ChatterboxTurboTTS
        return ChatterboxTurboTTS.from_pretrained(device=device)
    from chatterbox.tts import ChatterboxTTS
    return ChatterboxTTS.from_pretrained(device=device)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--model", choices=["standard", "turbo"], default="standard")
    parser.add_argument("--voice-prompt", type=Path,
                        help="a recording of the voice to clone (over 5 seconds); the model's own voice if omitted")
    parser.add_argument("--exaggeration", type=float, default=0.5,
                        help="emotional intensity, 0.25-2 (standard model only)")
    parser.add_argument("--cfg-weight", type=float, default=0.5,
                        help="lower is slower and more deliberate (standard model only)")
    args = parser.parse_args()

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    settings = {"model": args.model, "exaggeration": args.exaggeration, "cfg_weight": args.cfg_weight}
    prompt = str(args.voice_prompt.resolve()) if args.voice_prompt else None
    prompt_hash = hashlib.sha256(args.voice_prompt.read_bytes()).hexdigest() if args.voice_prompt else ""

    OUT_DIR.mkdir(exist_ok=True)
    try:
        previous = json.loads(MANIFEST_PATH.read_text())
    except FileNotFoundError:
        previous = {"clips": {}}

    model = None
    clips = {}
    for clip_id, spoken in load_captions().items():
        clip_hash = hashlib.sha256(f"chatterbox\n{json.dumps(settings)}\n{prompt_hash}\n{spoken}".encode())
        clip_hash = clip_hash.hexdigest()
        file = f"{clip_id}.wav"
        cached = previous["clips"].get(clip_id)
        if cached and cached["hash"] == clip_hash and (OUT_DIR / file).exists():
            clips[clip_id] = cached
            continue

        model = model or load_model(args.model, device)
        torch.manual_seed(int(clip_hash[:8], 16))
        options = {"audio_prompt_path": prompt}
        if args.model == "standard":
            options.update(exaggeration=args.exaggeration, cfg_weight=args.cfg_weight)
        wav = model.generate(spoken, **options).cpu()
        torchaudio.save(str(OUT_DIR / file), wav, model.sr)
        clips[clip_id] = {"file": file, "hash": clip_hash, "durationMs": round(wav.shape[-1] / model.sr * 1000)}
        print(f"{clip_id}: {clips[clip_id]['durationMs']} ms")

    voice = f"chatterbox-{args.model}" + (f" ({args.voice_prompt.name})" if args.voice_prompt else "")
    MANIFEST_PATH.write_text(json.dumps({"voice": voice, "clips": clips}, indent=4) + "\n")
    print(f"Narration for {len(clips)} captions is in {OUT_DIR}")


if __name__ == "__main__":
    main()
