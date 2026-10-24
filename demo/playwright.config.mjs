import {defineConfig} from '@playwright/test';

const CSS_DATA = 'demo/.css-data';

export default defineConfig({
    testDir: '.',
    outputDir: 'test-results',
    timeout: 5 * 60 * 1000,
    workers: 1,
    reporter: 'list',
    use: {
        actionTimeout: 15000,
        navigationTimeout: 30000,
        headless: true,
        viewport: {width: 1280, height: 800}
    },
    webServer: [
        {
            // Wipe the Pod storage on every run so the demo always starts from an empty server.
            command: `rm -rf ${CSS_DATA} && npx --yes @solid/community-server@7.2.0 ` +
                `--config @css:config/file.json --rootFilePath ${CSS_DATA} --port 3000`,
            cwd: '..',
            url: 'http://localhost:3000/',
            reuseExistingServer: false,
            timeout: 2 * 60 * 1000
        },
        {
            command: 'npm start --workspace=packages/scratch-gui',
            cwd: '..',
            url: 'http://localhost:8601/solid-save.html',
            // The editor holds no state between runs, so an already-running dev server is fine to reuse.
            reuseExistingServer: true,
            timeout: 5 * 60 * 1000
        }
    ]
});
