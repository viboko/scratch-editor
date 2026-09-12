/**
 * Minimal local storage server for the `local-storage.html` playground demo.
 *
 * Writes projects, assets and thumbnails to disk under `./.data`. This is a
 * reference implementation of the server side of the `GUIStorage` interface
 * (see `../src/gui-config.ts` and `../src/lib/local-disk-storage.ts`) — not
 * intended for production use. See `./README.md` for the full route
 * reference and sequence diagrams.
 */

const fs = require('fs');
const path = require('path');

const express = require('express');

const PORT = 8701;

const DATA_DIR = path.join(__dirname, '.data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');

fs.mkdirSync(PROJECTS_DIR, {recursive: true});
fs.mkdirSync(ASSETS_DIR, {recursive: true});

// Project ids must stay numeric: the editor's URL-hash project loader
// (hash-parser-hoc.jsx) only recognizes `#<digits>`.
const existingProjectIds = fs.readdirSync(PROJECTS_DIR)
    .map(Number)
    .filter(Number.isInteger);
let nextProjectId = existingProjectIds.length > 0 ? Math.max(...existingProjectIds) + 1 : 1;

const CONTENT_TYPES_BY_EXTENSION = {
    jpg: 'image/jpeg',
    mp3: 'audio/mpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    wav: 'audio/x-wav'
};

const isValidProjectId = id => (/^\d+$/).test(id);
const isValidAssetFilename = filename => (/^[0-9a-fA-F]+\.[A-Za-z0-9]+$/).test(filename);

const app = express();

// Request bodies are either raw project JSON text or raw asset/thumbnail
// bytes, never form-encoded, so read everything as a raw Buffer.
app.use(express.raw({type: '*/*', limit: '50mb'}));

app.post('/projects', (req, res) => {
    const id = nextProjectId++;
    fs.mkdirSync(path.join(PROJECTS_DIR, String(id)), {recursive: true});
    fs.writeFileSync(path.join(PROJECTS_DIR, String(id), 'project.json'), req.body);
    res.json({id});
});

app.put('/projects/:id', (req, res) => {
    if (!isValidProjectId(req.params.id)) {
        res.status(400).end();
        return;
    }
    fs.mkdirSync(path.join(PROJECTS_DIR, req.params.id), {recursive: true});
    fs.writeFileSync(path.join(PROJECTS_DIR, req.params.id, 'project.json'), req.body);
    res.json({id: Number(req.params.id)});
});

app.get('/projects/:id', (req, res) => {
    if (!isValidProjectId(req.params.id)) {
        res.status(400).end();
        return;
    }
    const projectFile = path.join(PROJECTS_DIR, req.params.id, 'project.json');
    if (!fs.existsSync(projectFile)) {
        res.status(404).end();
        return;
    }
    res.type('application/json').send(fs.readFileSync(projectFile));
});

app.put('/projects/:id/thumbnail', (req, res) => {
    if (!isValidProjectId(req.params.id)) {
        res.status(400).end();
        return;
    }
    fs.mkdirSync(path.join(PROJECTS_DIR, req.params.id), {recursive: true});
    fs.writeFileSync(path.join(PROJECTS_DIR, req.params.id, 'thumbnail.png'), req.body);
    res.status(200).end();
});

app.put('/assets/:filename', (req, res) => {
    if (!isValidAssetFilename(req.params.filename)) {
        res.status(400).end();
        return;
    }
    fs.writeFileSync(path.join(ASSETS_DIR, req.params.filename), req.body);
    // The `{status: 'ok'}` shape is required by project-saver-hoc.jsx, which
    // hardcodes a check that asset-store responses look like this.
    res.json({status: 'ok'});
});

app.get('/assets/:filename', (req, res) => {
    if (!isValidAssetFilename(req.params.filename)) {
        res.status(400).end();
        return;
    }
    const assetFile = path.join(ASSETS_DIR, req.params.filename);
    if (!fs.existsSync(assetFile)) {
        res.status(404).end();
        return;
    }
    const extension = req.params.filename.split('.').pop();
    res.type(CONTENT_TYPES_BY_EXTENSION[extension] || 'application/octet-stream')
        .send(fs.readFileSync(assetFile));
});

app.listen(PORT, () => {
    console.log(`Local storage server listening on http://localhost:${PORT}`);
    console.log(`Writing projects/assets to ${DATA_DIR}`);
});
