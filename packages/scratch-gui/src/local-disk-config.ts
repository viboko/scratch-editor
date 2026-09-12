import {GUIConfigFactory} from './gui-config';
import {LocalDiskStorage} from './lib/local-disk-storage';

// Used by the `local-storage.html` playground demo (see
// `src/playground/local-disk-storage-demo.jsx`) to save/load projects to
// local disk via `dev-server/server.js`, instead of `legacyConfig`'s
// MIT-hosted storage.
export const localDiskConfigFactory: GUIConfigFactory = () => ({
    storage: new LocalDiskStorage()
});
