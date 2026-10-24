// Mixes the narration clips into the demo recording at the times their captions appeared, and writes the result as
// satchel-demo.mp4. Needs ffmpeg, the recording (satchel-demo.webm) and narration/timeline.json from a demo run.

import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const DEMO_DIR = import.meta.dirname;
const NARRATION_DIR = path.join(DEMO_DIR, 'narration');
const VIDEO_IN = path.join(DEMO_DIR, 'satchel-demo.webm');
const VIDEO_OUT = path.join(DEMO_DIR, 'satchel-demo.mp4');

const timeline = JSON.parse(await readFile(path.join(NARRATION_DIR, 'timeline.json'), 'utf8'));

const clipInputs = timeline.flatMap(({file}) => ['-i', path.join(NARRATION_DIR, file)]);
// Input 0 is the video, so clip n is input n + 1.
const delays = timeline.map(({startMs}, index) => `[${index + 1}:a]adelay=${startMs}:all=1[a${index}]`);
const mix = `${timeline.map((_, index) => `[a${index}]`).join('')}amix=inputs=${timeline.length}:normalize=0,apad[narration]`;

const result = spawnSync('ffmpeg', [
    '-v', 'error', '-y',
    '-i', VIDEO_IN,
    ...clipInputs,
    '-filter_complex', [...delays, mix].join(';'),
    '-map', '0:v', '-map', '[narration]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
    '-c:a', 'aac', '-b:a', '128k',
    // The narration is padded with silence, so it ends with the video.
    '-shortest',
    '-movflags', '+faststart',
    VIDEO_OUT
], {stdio: 'inherit'});

if (result.status !== 0) {
    throw new Error(`mux-narration: ffmpeg exited with ${result.status ?? result.signal}`);
}
console.log(`Narrated video written to ${VIDEO_OUT}`);
