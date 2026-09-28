/**
 * A project save that is waiting for the Solid login redirect to come back.
 * `projectSb3` lets the editor restore the project (assets included) after the
 * page reloads; `projectJson` is what gets written to the Pod. `isRenewal` marks a login started automatically
 * because the session had lapsed, rather than one the user asked for through the modal.
 */
export interface PendingSolidSave {
    webId: string;
    isRenewal: boolean;
    title: string;
    projectJson: string;
    projectSb3: Blob;
}

const DB_NAME = 'scratch-solid-save';
const STORE_NAME = 'pending';
const RECORD_KEY = 'pending-save';

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const runInStore = async <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
    const database = await openDatabase();
    try {
        return await new Promise<T>((resolve, reject) => {
            const request = operation(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        database.close();
    }
};

export const putPendingSolidSave = async (pending: PendingSolidSave): Promise<void> => {
    await runInStore('readwrite', store => store.put(pending, RECORD_KEY));
};

/**
 * Reads the pending save and removes it, so a save is only ever completed once.
 * @returns the pending save, or null if there isn't one.
 */
export const takePendingSolidSave = async (): Promise<PendingSolidSave | null> => {
    const pending = await runInStore<PendingSolidSave | undefined>('readonly', store => store.get(RECORD_KEY));
    if (!pending) return null;
    await runInStore('readwrite', store => store.delete(RECORD_KEY));
    return pending;
};
