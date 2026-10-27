# List available recipes
default:
    @just --list

# Install dependencies for every workspace
install:
    npm ci

# Start the scratch-gui webpack-dev-server on :8601
dev:
    npm start --workspace=packages/scratch-gui

# Open the Solid Pod save demo in the browser (needs `just dev` and `just css-up` running)
browse-solid:
    open http://localhost:8601/solid-save.html

# Start a local Community Solid Server on :3000 (data persists in ./.css-data)
css-up:
    npx --yes @solid/community-server@7.2.0 --config @css:config/file.json --rootFilePath .css-data --port 3000

# Remove everything saved in the local CSS (restart `just css-up` afterwards)
clean:
    rm -rf .css-data
