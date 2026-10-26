// Mixes the narration clips into the demo recording at the times they were spoken, and writes the result as
// satchel-demo.mp4, with the narration as subtitles: in satchel-demo.vtt, for a web page's <track>, and as a subtitle
// track inside the MP4, for video players. Needs ffmpeg, the recording (satchel-demo.webm) and
// narration/timeline.json from a demo run.

import {spawnSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {captions} from './captions.mjs';

const DEMO_DIR = import.meta.dirname;
const NARRATION_DIR = path.join(DEMO_DIR, 'narration');
const VIDEO_IN = path.join(DEMO_DIR, 'satchel-demo.webm');
const VIDEO_OUT = path.join(DEMO_DIR, 'satchel-demo.mp4');
const SUBTITLES_OUT = path.join(DEMO_DIR, 'satchel-demo.vtt');

const timeline = JSON.parse(await readFile(path.join(NARRATION_DIR, 'timeline.json'), 'utf8'));

const vttTime = ms => new Date(ms).toISOString()
    .slice(11, 23);
const cues = timeline.map(({id, startMs, durationMs}) =>
    `${vttTime(startMs)} --> ${vttTime(startMs + durationMs)}\n${captions[id]}`);
await writeFile(SUBTITLES_OUT, `WEBVTT\n\n${cues.join('\n\n')}\n`);

const clipInputs = timeline.flatMap(({file}) => ['-i', path.join(NARRATION_DIR, file)]);
// Input 0 is the video, so clip n is input n + 1, and the subtitles come after the clips.
const delays = timeline.map(({startMs}, index) => `[${index + 1}:a]adelay=${startMs}:all=1[a${index}]`);
const subtitlesInput = timeline.length + 1;
// Normalising the loudness keeps every voice at the same level, without clipping.
const mix = `${timeline.map((_, index) => `[a${index}]`).join('')}amix=inputs=${timeline.length}:normalize=0,` +
    'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad[narration]';

const result = spawnSync('ffmpeg', [
    '-v', 'error', '-y',
    '-i', VIDEO_IN,
    ...clipInputs,
    '-i', SUBTITLES_OUT,
    '-filter_complex', [...delays, mix].join(';'),
    '-map', '0:v', '-map', '[narration]', '-map', `${subtitlesInput}:s`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
    '-c:a', 'aac', '-b:a', '128k',
    '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
    // The narration is padded with silence, so it ends with the video.
    '-shortest',
    '-movflags', '+faststart',
    VIDEO_OUT
], {stdio: 'inherit'});

if (result.status !== 0) {
    throw new Error(`mux-narration: ffmpeg exited with ${result.status ?? result.signal}`);
}
console.log(`Narrated video written to ${VIDEO_OUT}, with subtitles in ${SUBTITLES_OUT}`);
