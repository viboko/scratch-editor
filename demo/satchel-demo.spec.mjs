import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {expect, test} from '@playwright/test';

import {captions} from './captions.mjs';

const CSS_URL = 'http://localhost:3000';
const SCRATCH_URL = 'http://localhost:8601/solid-save.html';
const FILE_MANAGER_URL = 'https://filemanager.solid-experiments.org/login';

// Test-only credentials for the throwaway local Community Solid Server, which is wiped on every run.
const EMAIL = 'demo@example.com';
const PASSWORD = 'demo-password';
const POD_NAME = 'my-pod';
const WEB_ID = `${CSS_URL}/${POD_NAME}/profile/card#me`;
const SAVED_FILE_URL = `${CSS_URL}/${POD_NAME}/scratch/satchel.sb3`;
const ZIP_VIEWER_URL = 'https://www.ezyzip.com/extract-zip-file-online.html';
// Scratch names each asset in an .sb3 by the MD5 of its contents. This is the cat's costume holding the satchel.
const CAT_WITH_SATCHEL_COSTUME = '44be0e7508e16b69bc21eb74ba1c294a.svg';

const VIDEO_SIZE = {width: 1280, height: 800};
const SPLASH_URL = pathToFileURL(path.join(import.meta.dirname, 'splash.html')).href;
const POSTER_PATH = path.join(import.meta.dirname, 'satchel-demo-poster.png');
const NARRATION_DIR = path.join(import.meta.dirname, 'narration');
// Silence left between one line of narration and the next.
const NARRATION_GAP_MS = 400;

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

// The editor's redux store isn't exposed, but it is built with the Redux DevTools compose hook when one is present.
// Standing in for that hook captures the store, and through it the VM, so the script can watch the cat's position.
const exposeScratchVm = () => {
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = (...enhancers) => createStore => (...args) => {
        const store = enhancers.reduceRight((create, enhancer) => enhancer(create), createStore)(...args);
        window.demoStore = store;
        return store;
    };
};

/**
 * Paces the demo to its narration. The recording has no sound, so the narration and its subtitles are added
 * afterwards (mux-narration.mjs) from the timeline this writes: when each line starts, relative to the start of the
 * video, and how long it lasts.
 */
class Narrator {
    /**
     * @param {import('@playwright/test').Page} page The page, just created, so its video has just started
     * @param {Record<string, {file: string, durationMs: number}>} clips The clips from narrate.py, by caption id
     */
    constructor (page, clips) {
        this.page = page;
        this.clips = clips;
        this.startedAt = Date.now();
        this.timeline = [];
        this.speakingUntil = 0;
    }

    static async create (page) {
        let manifest;
        try {
            manifest = JSON.parse(await readFile(path.join(NARRATION_DIR, 'manifest.json'), 'utf8'));
        } catch (e) {
            throw new Error(`Narrator: no narration manifest in ${NARRATION_DIR}. Run uv run demo/narrate.py first.`);
        }
        return new Narrator(page, manifest.clips);
    }

    elapsedMs () {
        return Date.now() - this.startedAt;
    }

    /**
     * Starts a line of narration once the previous line has finished, then returns while it is spoken. A line left
     * empty in captions.mjs is a step with no narration, so it returns straight away.
     * @param {string} id The line's id in captions.mjs
     */
    async say (id) {
        if (!captions[id]) return;
        const clip = this.clips[id];
        if (!clip) throw new Error(`Narrator: no narration for "${id}". Run uv run demo/narrate.py.`);
        await this.finish();
        const startMs = this.elapsedMs();
        this.timeline.push({id, file: clip.file, startMs, durationMs: clip.durationMs});
        this.speakingUntil = startMs + clip.durationMs + NARRATION_GAP_MS;
    }

    /** Waits until the current line has been spoken. */
    async finish () {
        await pause(Math.max(0, this.speakingUntil - this.elapsedMs()));
    }

    async saveTimeline () {
        await writeFile(path.join(NARRATION_DIR, 'timeline.json'), `${JSON.stringify(this.timeline, null, 4)}\n`);
    }
}

const getCat = page => page.evaluate(() => {
    const cat = window.demoStore.getState().scratchGui.vm.runtime.getSpriteTargetByName('cat');
    return {
        x: cat.x,
        y: cat.y,
        costume: cat.getCostumes()[cat.currentCostume].name,
        isTouchingSatchel: cat.isTouchingSprite('satchel')
    };
});

/**
 * Holds `key` down until the cat satisfies `isDone`.
 * @param {import('@playwright/test').Page} page The page
 * @param {string} key The key to hold
 * @param {function(object): boolean} isDone Checked against the cat's state while the key is held
 * @param {string} description What the cat should end up doing, for the timeout message
 */
const holdKeyUntil = async (page, key, isDone, description) => {
    await page.keyboard.down(key);
    try {
        await expect.poll(async () => isDone(await getCat(page)), {message: description, intervals: [20], timeout: 10000})
            .toBe(true);
    } finally {
        await page.keyboard.up(key);
    }
};

const tapKey = async (page, key) => {
    await page.keyboard.down(key);
    await pause(60);
    await page.keyboard.up(key);
};

test('save a Scratch project to a Solid Pod and find it in a Solid app', async ({browser}, testInfo) => {
    const context = await browser.newContext({
        viewport: VIDEO_SIZE,
        recordVideo: {dir: testInfo.outputPath('video'), size: VIDEO_SIZE}
    });
    // The file manager is a public site; Chrome only lets it call the local Solid server once this is granted.
    await context.grantPermissions(['local-network-access'], {origin: new URL(FILE_MANAGER_URL).origin});
    await context.addInitScript(exposeScratchVm);
    const page = await context.newPage();
    const narrator = await Narrator.create(page);
    // Loading a project over the default one asks for confirmation.
    page.on('dialog', dialog => dialog.accept());

    // The splash screen, which is also the video's poster image.
    await page.goto(SPLASH_URL);
    await narrator.say('intro');
    await page.screenshot({path: POSTER_PATH});
    await narrator.finish();
    await pause(1000);

    // 1. Create an account and a Pod on the local Community Solid Server.
    await page.goto(`${CSS_URL}/.account/`);
    await page.waitForLoadState('networkidle');
    await narrator.say('signUp');
    await pause(1500);
    await page.getByRole('link', {name: 'Sign up'}).click();
    await page.waitForURL(/register/);
    await page.waitForLoadState('networkidle');
    await page.locator('#email').pressSequentially(EMAIL, {delay: 40});
    await page.locator('#password').pressSequentially(PASSWORD, {delay: 40});
    await page.locator('#confirmPassword').pressSequentially(PASSWORD, {delay: 40});
    await pause(500);
    await page.getByRole('button', {name: 'Register'}).click();
    await page.waitForURL(/\/\.account\/account\/[^/]+\/$/);
    await page.waitForLoadState('networkidle');

    await narrator.say('createPod');
    await pause(1000);
    await page.locator('#createPod').click();
    await page.waitForURL(/\/pod\/$/);
    await page.waitForLoadState('networkidle');
    await page.locator('#name').pressSequentially(POD_NAME, {delay: 60});
    await pause(500);
    await page.getByRole('button', {name: 'Create pod'}).click();
    await expect(page.locator('#response-webId')).toHaveText(WEB_ID);
    await narrator.say('webId');
    await narrator.finish();
    await pause(1000);

    // 2. Load the project into the editor and play it.
    await page.goto(SCRATCH_URL);
    await page.waitForFunction(() => window.demoStore?.getState().scratchGui.vm.runtime.targets.length > 0);
    await narrator.say('editor');
    await narrator.say('loadProject');
    await page.getByText('File', {exact: true}).click();
    await pause(800);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Load from your computer', {exact: true}).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(import.meta.dirname, 'satchel.sb3'));
    await page.waitForFunction(() =>
        window.demoStore.getState().scratchGui.vm.runtime.getSpriteTargetByName('cat'));
    await expect(page.getByPlaceholder('Project title here')).toHaveValue('satchel');
    await pause(1000);

    await narrator.say('run');
    await page.getByTitle('Go').click();
    await narrator.finish();

    // The editor only passes keys to the project when nothing has focus, and the File menu keeps it after loading.
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.activeElement?.blur());
    await narrator.say('walk');
    await holdKeyUntil(page, 'ArrowRight', cat => cat.x >= -100, 'the cat to walk a little to the right');
    await narrator.say('jump');
    await tapKey(page, 'ArrowUp');
    await narrator.say('walkOn');
    await holdKeyUntil(page, 'ArrowRight', cat => cat.isTouchingSatchel && cat.x >= 110,
        'the cat to walk to the satchel');
    await pause(300);
    await tapKey(page, 'ArrowLeft');
    await pause(600);
    expect((await getCat(page)).isTouchingSatchel).toBe(true);
    await narrator.say('pickUp');
    await holdKeyUntil(page, 'ArrowDown', cat => cat.costume === 'with-satchel', 'the cat to pick up the satchel');
    await narrator.finish();
    await pause(2500);

    // 3. Save to the Pod. The first save asks for the WebID and logs in through the Solid server.
    await narrator.say('save');
    await page.getByText('File', {exact: true}).click();
    await pause(800);
    await page.getByText('Save now', {exact: true}).click();
    const webIdInput = page.getByPlaceholder('https://example.com/profile/card#me');
    await expect(webIdInput).toBeVisible();
    await narrator.say('enterWebId');
    await webIdInput.pressSequentially(WEB_ID, {delay: 30});
    await narrator.finish();
    await page.getByRole('button', {name: 'Continue'}).click();

    await page.waitForURL(url => url.origin === CSS_URL);
    await page.waitForLoadState('networkidle');
    await narrator.say('authoriseScratch');
    await narrator.finish();
    await page.getByRole('button', {name: 'Authorize'}).click();

    await page.waitForURL(url => url.href.startsWith(SCRATCH_URL));
    await expect(page.getByText(`Your project was saved to ${SAVED_FILE_URL}`)).toBeVisible({timeout: 30000});
    await narrator.say('saved');
    await narrator.finish();
    await pause(1500);

    // 4. Find the saved file from a different Solid app. The line starts before the file manager loads, which takes a
    // few seconds, so the narration doesn't fall silent long enough to seem like the end of the video.
    await narrator.say('fileManager');
    await page.goto(FILE_MANAGER_URL);
    await page.waitForLoadState('networkidle');
    await page.getByRole('combobox').pressSequentially(CSS_URL, {delay: 50});
    await narrator.finish();
    await page.getByRole('button', {name: 'Continue to sign in'}).click();

    await page.waitForURL(url => url.origin === CSS_URL);
    await page.waitForLoadState('networkidle');
    await narrator.say('authoriseFileManager');
    await narrator.finish();
    await page.getByRole('button', {name: 'Authorize'}).click();

    await page.waitForURL(url => url.origin === new URL(FILE_MANAGER_URL).origin && !url.pathname.startsWith('/login'));
    const fileList = page.locator('main main main');
    await narrator.say('openPod');
    await narrator.finish();
    await page.getByRole('button', {name: `Folder: ${CSS_URL}/${POD_NAME}/`}).dblclick();
    await narrator.say('openContainer');
    await narrator.finish();
    await fileList.getByRole('button', {name: 'Folder: scratch'}).dblclick();
    await narrator.say('openFile');
    await narrator.finish();
    const savedFile = fileList.getByRole('button', {name: 'File: satchel.sb3'});
    await savedFile.dblclick();
    const preview = page.getByRole('dialog', {name: 'Preview'});
    await expect(preview).toContainText('application/x.scratch.sb3');
    await narrator.say('noPreview');
    await narrator.finish();
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();

    // 5. Download it, and look inside it with an ordinary zip tool.
    await narrator.say('download');
    await savedFile.click({button: 'right'});
    await pause(800);
    const downloading = page.waitForEvent('download');
    await page.getByRole('menuitem', {name: 'Download'}).click();
    const downloadedSb3 = testInfo.outputPath('satchel.sb3');
    await (await downloading).saveAs(downloadedSb3);
    await narrator.finish();

    // The zip tool unzips in the browser. Its ads, analytics and cookie-consent dialog come from other hosts; blocking
    // them keeps the recording clean and sends nothing about the demo to ad networks.
    await page.route(
        url => !/(^|\.)(ezyzip\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname),
        route => route.abort()
    );
    await page.goto(ZIP_VIEWER_URL);
    await page.waitForLoadState('domcontentloaded');
    await narrator.say('zipViewer');
    await narrator.finish();
    const choosingFile = page.waitForEvent('filechooser');
    await page.locator('label[for=extractFile]').click();
    await (await choosingFile).setFiles(downloadedSb3);
    await expect(page.getByText('project.json')).toBeVisible();
    await narrator.say('zipContents');
    await narrator.finish();

    await page.getByRole('button', {name: 'Preview project.json'}).click();
    await expect(page.locator('.text-preview')).toContainText('"has satchel","1"');
    await narrator.say('projectJson');
    await narrator.finish();
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: `Preview ${CAT_WITH_SATCHEL_COSTUME}`}).click();
    await narrator.say('costume');
    await narrator.finish();
    await pause(1000);
    await page.keyboard.press('Escape');

    await narrator.say('closing');
    await narrator.finish();
    await pause(2000);

    await narrator.saveTimeline();
    await context.close();
    await page.video().saveAs(path.join(import.meta.dirname, 'satchel-demo.webm'));
});
