# List available recipes
default:
    @just --list

# Install dependencies for every workspace
install:
    npm ci

# Start the local disk storage server on :8701 (run in its own terminal, alongside `just dev`)
local-store-up:
    npm run start:local-storage-server --workspace=packages/scratch-gui

# Start the scratch-gui webpack-dev-server on :8601 (run in its own terminal, alongside `just local-store-up`)
dev:
    npm start --workspace=packages/scratch-gui

# Open the local disk storage demo in the browser (needs `just local-store-up` and `just dev` running)
browse-local:
    open http://localhost:8601/local-storage.html

# Remove the projects and assets saved by the local disk storage server
clean:
    rm -rf packages/scratch-gui/dev-server/.data
