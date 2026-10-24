import path from 'node:path';
import {expect, test} from '@playwright/test';

const CSS_URL = 'http://localhost:3000';
const SCRATCH_URL = 'http://localhost:8601/solid-save.html';
const FILE_MANAGER_URL = 'https://filemanager.solid-experiments.org/login';

// Test-only credentials for the throwaway local Community Solid Server, which is wiped on every run.
const EMAIL = 'demo@example.com';
const PASSWORD = 'demo-password';
const POD_NAME = 'my-pod';
const WEB_ID = `${CSS_URL}/${POD_NAME}/profile/card#me`;
const SAVED_FILE_URL = `${CSS_URL}/${POD_NAME}/scratch/satchel.json`;

const VIDEO_SIZE = {width: 1280, height: 800};

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
 * Shows a caption banner along the bottom of the page, so the recording explains itself.
 * @param {import('@playwright/test').Page} page The page
 * @param {string} text The caption
 */
const caption = async (page, text) => {
    await page.evaluate(captionText => {
        let banner = document.getElementById('demo-caption');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'demo-caption';
            Object.assign(banner.style, {
                position: 'fixed',
                left: '50%',
                bottom: '24px',
                transform: 'translateX(-50%)',
                zIndex: '2147483647',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(20, 20, 20, 0.85)',
                color: 'white',
                font: '500 20px/1.3 system-ui, sans-serif',
                pointerEvents: 'none',
                maxWidth: '80%',
                textAlign: 'center'
            });
            document.body.appendChild(banner);
        }
        banner.textContent = captionText;
    }, text);
};

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
    // Loading a project over the default one asks for confirmation.
    page.on('dialog', dialog => dialog.accept());

    // 1. Create an account and a Pod on the local Community Solid Server.
    await page.goto(`${CSS_URL}/.account/`);
    await page.waitForLoadState('networkidle');
    await caption(page, 'A fresh local Solid server: sign up for an account');
    await pause(1500);
    await page.getByRole('link', {name: 'Sign up'}).click();
    await page.waitForURL(/register/);
    await page.waitForLoadState('networkidle');
    await caption(page, 'A fresh local Solid server: sign up for an account');
    await page.locator('#email').pressSequentially(EMAIL, {delay: 40});
    await page.locator('#password').pressSequentially(PASSWORD, {delay: 40});
    await page.locator('#confirmPassword').pressSequentially(PASSWORD, {delay: 40});
    await pause(500);
    await page.getByRole('button', {name: 'Register'}).click();
    await page.waitForURL(/\/\.account\/account\/[^/]+\/$/);
    await page.waitForLoadState('networkidle');

    await caption(page, `Create a Pod called "${POD_NAME}"`);
    await pause(1500);
    await page.locator('#createPod').click();
    await page.waitForURL(/\/pod\/$/);
    await page.waitForLoadState('networkidle');
    await caption(page, `Create a Pod called "${POD_NAME}"`);
    await page.locator('#name').pressSequentially(POD_NAME, {delay: 60});
    await pause(500);
    await page.getByRole('button', {name: 'Create pod'}).click();
    await expect(page.locator('#response-webId')).toHaveText(WEB_ID);
    await caption(page, 'The Pod comes with a WebID: the user\'s identity on the Solid web');
    await pause(3000);

    // 2. Load the project into the editor and play it.
    await page.goto(SCRATCH_URL);
    await page.waitForFunction(() => window.demoStore?.getState().scratchGui.vm.runtime.targets.length > 0);
    await caption(page, 'The Scratch editor, with Solid saving switched on');
    await pause(2000);
    await caption(page, 'Load a project from the computer');
    await page.getByText('File', {exact: true}).click();
    await pause(800);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Load from your computer', {exact: true}).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(import.meta.dirname, 'satchel.sb3'));
    await page.waitForFunction(() =>
        window.demoStore.getState().scratchGui.vm.runtime.getSpriteTargetByName('cat'));
    await expect(page.getByPlaceholder('Project title here')).toHaveValue('satchel');
    await pause(2000);

    await caption(page, 'Run the project');
    await page.getByTitle('Go').click();
    await pause(1500);

    // The editor only passes keys to the project when nothing has focus, and the File menu keeps it after loading.
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.activeElement?.blur());
    await caption(page, 'Walk right…');
    await holdKeyUntil(page, 'ArrowRight', cat => cat.x >= -100, 'the cat to walk a little to the right');
    await pause(400);
    await caption(page, '…jump…');
    await tapKey(page, 'ArrowUp');
    await pause(1200);
    await caption(page, '…walk on to the satchel…');
    await holdKeyUntil(page, 'ArrowRight', cat => cat.isTouchingSatchel && cat.x >= 110,
        'the cat to walk to the satchel');
    await pause(300);
    await tapKey(page, 'ArrowLeft');
    await pause(600);
    expect((await getCat(page)).isTouchingSatchel).toBe(true);
    await caption(page, '…and pick it up');
    await holdKeyUntil(page, 'ArrowDown', cat => cat.costume === 'with-satchel', 'the cat to pick up the satchel');
    await pause(3500);

    // 3. Save to the Pod. The first save asks for the WebID and logs in through the Solid server.
    await caption(page, 'Save the project to the Solid Pod: File > Save now');
    await page.getByText('File', {exact: true}).click();
    await pause(800);
    await page.getByText('Save now', {exact: true}).click();
    const webIdInput = page.getByPlaceholder('https://example.com/profile/card#me');
    await expect(webIdInput).toBeVisible();
    await caption(page, 'Enter the WebID to log in to the Solid provider');
    await webIdInput.pressSequentially(WEB_ID, {delay: 30});
    await pause(800);
    await page.getByRole('button', {name: 'Continue'}).click();

    await page.waitForURL(url => url.origin === CSS_URL);
    await page.waitForLoadState('networkidle');
    await caption(page, 'The Solid provider asks the user to authorise Scratch');
    await pause(2000);
    await page.getByRole('button', {name: 'Authorize'}).click();

    await page.waitForURL(url => url.href.startsWith(SCRATCH_URL));
    await expect(page.getByText(`Your project was saved to ${SAVED_FILE_URL}`)).toBeVisible({timeout: 30000});
    await caption(page, 'Saved, and the project is back in the editor');
    await pause(3500);

    // 4. Find the saved file from a different Solid app.
    await page.goto(FILE_MANAGER_URL);
    await page.waitForLoadState('networkidle');
    await caption(page, 'Any Solid app can now reach the project, for example a file manager');
    await pause(1500);
    await page.getByRole('combobox').pressSequentially(CSS_URL, {delay: 50});
    await pause(800);
    await page.getByRole('button', {name: 'Continue to sign in'}).click();

    await page.waitForURL(url => url.origin === CSS_URL);
    await page.waitForLoadState('networkidle');
    await caption(page, 'Authorise the file manager with the same WebID');
    await pause(2000);
    await page.getByRole('button', {name: 'Authorize'}).click();

    await page.waitForURL(url => url.origin === new URL(FILE_MANAGER_URL).origin && !url.pathname.startsWith('/login'));
    const fileList = page.locator('main main main');
    await caption(page, 'Signed in to the file manager: open the Pod…');
    await pause(2000);
    await page.getByRole('button', {name: `Folder: ${CSS_URL}/${POD_NAME}/`}).dblclick();
    await caption(page, '…then the "scratch" container…');
    await pause(2000);
    await fileList.getByRole('button', {name: 'Folder: scratch'}).dblclick();
    await caption(page, '…and the project Scratch saved');
    await pause(2000);
    await fileList.getByRole('button', {name: 'File: satchel.json'}).dblclick();
    const preview = page.getByRole('dialog', {name: 'Preview'});
    await expect(preview).toContainText('"has satchel","1"');
    await caption(page, 'The saved project, read back from the Pod by another Solid app');
    await pause(5000);

    await context.close();
    await page.video().saveAs(path.join(import.meta.dirname, 'satchel-demo.webm'));
});
