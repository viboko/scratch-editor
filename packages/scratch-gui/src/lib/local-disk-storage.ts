import {ScratchStorage, Asset} from '@scratch/scratch-storage';

import defaultProject from './default-project';
import {GUIStorage, ProjectId} from '../gui-config';

// Proxied by webpack-dev-server (see webpack.config.js) to the Express server
// in `../../dev-server/server.js`, so these are same-origin relative URLs.
const LOCAL_STORAGE_BASE = '/local-storage';

export class LocalDiskStorage implements GUIStorage {
    readonly scratchStorage = new ScratchStorage();

    constructor () {
        this.cacheDefaultProject(this.scratchStorage);
        this.addLocalDiskWebStores(this.scratchStorage);
    }

    // `params` (originalId/isCopy/isRemix/title) is part of the `GUIStorage.saveProject`
    // signature but unused by this minimal disk-backed implementation, so it's omitted --
    // TypeScript allows implementing an interface method with fewer declared parameters.
    saveProject (projectId: ProjectId | null | undefined, vmState: string): Promise<{id: ProjectId}> {
        const creatingProject = projectId === null || typeof projectId === 'undefined';
        const url = creatingProject ?
            `${LOCAL_STORAGE_BASE}/projects` :
            `${LOCAL_STORAGE_BASE}/projects/${projectId}`;

        return fetch(url, {
            method: creatingProject ? 'POST' : 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: vmState
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to save project: ${response.status}`);
            }
            return response.json();
        });
    }

    saveProjectThumbnail (
        projectId: ProjectId,
        thumbnail: Blob,
        onSuccess?: () => void,
        onError?: () => void
    ): void {
        fetch(`${LOCAL_STORAGE_BASE}/projects/${projectId}/thumbnail`, {
            method: 'PUT',
            body: thumbnail
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to save thumbnail: ${response.status}`);
                }
                if (onSuccess) onSuccess();
            })
            .catch(() => {
                if (onError) onError();
            });
    }

    private cacheDefaultProject (storage: ScratchStorage) {
        const defaultProjectAssets = defaultProject();
        defaultProjectAssets.forEach(asset => storage.builtinHelper._store(
            storage.AssetType[asset.assetType],
            storage.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }

    private addLocalDiskWebStores (storage: ScratchStorage) {
        // Project loads are handled by `scratchStorage.load`; project saves go
        // through `saveProject` above instead of `scratchStorage.store`, so no
        // create/update function is registered here.
        storage.addWebStore(
            [storage.AssetType.Project],
            this.getProjectGetConfig.bind(this)
        );

        storage.addWebStore(
            [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
            this.getAssetGetConfig.bind(this),
            this.getAssetStoreConfig.bind(this),
            this.getAssetStoreConfig.bind(this)
        );
    }

    private getProjectGetConfig (projectAsset: Asset) {
        return `${LOCAL_STORAGE_BASE}/projects/${projectAsset.assetId}`;
    }

    private getAssetGetConfig (asset: Asset) {
        return `${LOCAL_STORAGE_BASE}/assets/${asset.assetId}.${asset.dataFormat}`;
    }

    private getAssetStoreConfig (asset: Asset) {
        return {
            method: 'put',
            url: `${LOCAL_STORAGE_BASE}/assets/${asset.assetId}.${asset.dataFormat}`
        };
    }
}
