// Generates a narration clip for every caption in captions.mjs, using the Kokoro text-to-speech model running locally.
// Writes demo/narration/<id>.wav and demo/narration/manifest.json, which the demo reads to pace itself. A clip is only
// regenerated when its text or the voice changes. Pick another voice with NARRATION_VOICE (e.g. bm_george, af_heart).

import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {KokoroTTS} from 'kokoro-js';

import {captions} from './captions.mjs';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const VOICE = process.env.NARRATION_VOICE || 'bf_emma';
const OUT_DIR = path.join(import.meta.dirname, 'narration');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const readManifest = async () => {
    try {
        return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch (e) {
        return {clips: {}};
    }
};

await mkdir(OUT_DIR, {recursive: true});
const previous = await readManifest();
const clips = {};
let tts;

for (const [id, {text, say, speed = 1}] of Object.entries(captions)) {
    const spoken = say ?? text;
    const hash = createHash('sha256').update(`${MODEL}\n${VOICE}\n${speed}\n${spoken}`)
        .digest('hex');
    const file = `${id}.wav`;
    const cached = previous.clips[id];
    if (cached?.hash === hash && existsSync(path.join(OUT_DIR, file))) {
        clips[id] = cached;
        continue;
    }

    tts ??= await KokoroTTS.from_pretrained(MODEL, {dtype: 'q8', device: 'cpu'});
    const audio = await tts.generate(spoken, {voice: VOICE, speed});
    await audio.save(path.join(OUT_DIR, file));
    clips[id] = {file, hash, durationMs: Math.round(audio.audio.length / audio.sampling_rate * 1000)};
    console.log(`${id}: ${clips[id].durationMs} ms`);
}

await writeFile(MANIFEST_PATH, `${JSON.stringify({voice: VOICE, clips}, null, 4)}\n`);
console.log(`Narration for ${Object.keys(clips).length} captions is in ${OUT_DIR}`);
