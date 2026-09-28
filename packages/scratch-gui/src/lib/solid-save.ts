import {
    FetchError,
    createContainerAt,
    getPodUrlAll,
    getSolidDataset,
    getThing,
    getUrl,
    overwriteFile
} from '@inrupt/solid-client';
import {getDefaultSession, handleIncomingRedirect, login} from '@inrupt/solid-client-authn-browser';

import log from './log';
import {putPendingSolidSave, takePendingSolidSave} from './solid-pending-save';

const SOLID_OIDC_ISSUER = 'http://www.w3.org/ns/solid/terms#oidcIssuer';
const CONTAINER_NAME = 'scratch';
const LAST_WEB_ID_KEY = 'scratch-solid-last-web-id';

export type SolidSaveOutcome =
    {status: 'saved', url: string} |
    {status: 'error', message: string};

export interface CompletedSolidSave {
    outcome: SolidSaveOutcome;
    isRenewal: boolean;
    title: string;
    projectSb3: Blob;
}

/**
 * There is no usable Solid session: it has ended, or the Pod rejected its token. Logging in again fixes it.
 */
export class SolidSessionExpiredError extends Error {
    constructor (message: string) {
        super(message);
        this.name = 'SolidSessionExpiredError';
    }
}

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const resolveOidcIssuer = async (webId: string): Promise<string> => {
    let profile;
    try {
        profile = await getSolidDataset(webId);
    } catch (error) {
        if (error instanceof FetchError) {
            throw new Error(`The profile at ${webId} could not be read (HTTP ${error.statusCode}).`);
        }
        throw error;
    }
    const profileThing = getThing(profile, webId);
    const issuer = profileThing && getUrl(profileThing, SOLID_OIDC_ISSUER);
    if (!issuer) {
        throw new Error(`The profile at ${webId} does not name a Solid OIDC issuer (solid:oidcIssuer).`);
    }
    return issuer;
};

const fileNameForTitle = (title: string): string => {
    const slug = title.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return `${slug || 'project'}.json`;
};

const ensureContainer = async (containerUrl: string, fetch: typeof globalThis.fetch): Promise<void> => {
    try {
        await getSolidDataset(containerUrl, {fetch});
    } catch (error) {
        if (error instanceof FetchError && error.statusCode === 404) {
            await createContainerAt(containerUrl, {fetch});
            return;
        }
        throw error;
    }
};

const writeProject = async (webId: string, title: string, projectJson: string): Promise<string> => {
    const {fetch} = getDefaultSession();
    const [podUrl] = await getPodUrlAll(webId, {fetch});
    if (!podUrl) {
        throw new Error(`No Pod storage (pim:storage) is listed in the profile at ${webId}.`);
    }
    const containerUrl = new URL(`${CONTAINER_NAME}/`, podUrl).href;
    await ensureContainer(containerUrl, fetch);

    const fileUrl = new URL(fileNameForTitle(title), containerUrl).href;
    await overwriteFile(fileUrl, new Blob([projectJson], {type: 'application/json'}), {
        contentType: 'application/json',
        fetch
    });
    return fileUrl;
};

/**
 * @returns the WebID the user is logged in with, or null if there is no Solid session.
 */
export const getLoggedInSolidWebId = (): string | null => {
    const {isLoggedIn, webId} = getDefaultSession().info;
    return isLoggedIn && webId ? webId : null;
};

/**
 * @returns the WebID of the most recent successful Solid login, or an empty string if there hasn't been one.
 */
export const getLastSolidWebId = (): string => {
    try {
        return window.localStorage.getItem(LAST_WEB_ID_KEY) ?? '';
    } catch (e) {
        return '';
    }
};

const rememberWebId = (webId: string): void => {
    try {
        window.localStorage.setItem(LAST_WEB_ID_KEY, webId);
    } catch (e) {
        // Remembering the WebID only saves typing; a blocked or full localStorage isn't worth failing the save for.
    }
};

/**
 * Writes the project to the Pod of the logged-in user, overwriting the file for this title if it exists.
 * @returns the URL of the saved file.
 * @throws {SolidSessionExpiredError} if there is no Solid session, or the Pod rejects its token (HTTP 401).
 */
export const saveToSolidPod = async ({title, projectJson}: {title: string; projectJson: string}): Promise<string> => {
    const webId = getLoggedInSolidWebId();
    if (!webId) {
        throw new SolidSessionExpiredError('saveToSolidPod: there is no logged-in Solid session.');
    }
    try {
        return await writeProject(webId, title, projectJson);
    } catch (error) {
        if (error instanceof FetchError && error.statusCode === 401) {
            throw new SolidSessionExpiredError(`The Pod rejected the Solid session for ${webId} (HTTP 401).`);
        }
        throw error;
    }
};

/**
 * Starts the Solid login for `webId`. The browser is redirected to the identity provider and returns to this page;
 * the project is stashed first so `completePendingSolidSave` can finish the save and restore it.
 */
export const startSolidSave = async ({webId, title, projectJson, projectSb3, isRenewal = false}: {
    webId: string;
    title: string;
    projectJson: string;
    projectSb3: Blob;
    isRenewal?: boolean;
}): Promise<void> => {
    const oidcIssuer = await resolveOidcIssuer(webId);
    await putPendingSolidSave({webId, isRenewal, title, projectJson, projectSb3});
    await login({
        oidcIssuer,
        redirectUrl: `${window.location.origin}${window.location.pathname}`,
        clientName: 'Scratch'
    });
};

/**
 * Handles a return from the Solid login redirect, and if a save was pending, writes it to the Pod.
 * @returns the outcome plus the stashed project so the caller can restore it, or null if this page load isn't
 *   returning from a Solid login.
 */
export const completePendingSolidSave = async (): Promise<CompletedSolidSave | null> => {
    const returningFromLogin = new URLSearchParams(window.location.search).has('state');
    // Restoring the previous session is what lets later saves skip the login.
    const sessionInfo = await handleIncomingRedirect({restorePreviousSession: true});
    if (!returningFromLogin) return null;

    const pending = await takePendingSolidSave();
    if (!pending) return null;

    const {webId, isRenewal, title, projectJson, projectSb3} = pending;
    if (!sessionInfo?.isLoggedIn) {
        return {
            outcome: {status: 'error', message: 'The Solid login was not completed.'},
            isRenewal,
            title,
            projectSb3
        };
    }
    rememberWebId(webId);

    try {
        const url = await writeProject(webId, title, projectJson);
        return {outcome: {status: 'saved', url}, isRenewal, title, projectSb3};
    } catch (error) {
        log.error(`completePendingSolidSave: failed to write the project for ${webId}`, error);
        return {outcome: {status: 'error', message: errorMessage(error)}, isRenewal, title, projectSb3};
    }
};
