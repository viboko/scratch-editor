# List available recipes
default:
    @just --list

# Install dependencies for every workspace
install:
    npm ci

# Start the scratch-gui webpack-dev-server on :8601
dev:
    npm start --workspace=packages/scratch-gui
