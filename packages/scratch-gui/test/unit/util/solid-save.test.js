/* eslint-env jest */
import {
    createContainerAt,
    getPodUrlAll,
    getSolidDataset,
    getThing,
    getUrl,
    overwriteFile
} from '@inrupt/solid-client';
import {getDefaultSession, handleIncomingRedirect, login} from '@inrupt/solid-client-authn-browser';

import log from '../../../src/lib/log';
import {putPendingSolidSave, takePendingSolidSave} from '../../../src/lib/solid-pending-save';
import {
    completePendingSolidSave,
    getLastSolidWebId,
    getLoggedInSolidWebId,
    saveToSolidPod,
    SolidSessionExpiredError,
    startSolidSave
} from '../../../src/lib/solid-save';

jest.mock('@inrupt/solid-client', () => {
    class FetchError extends Error {
        constructor (statusCode) {
            super(`status ${statusCode}`);
            this.statusCode = statusCode;
        }
    }
    return {
        FetchError,
        createContainerAt: jest.fn(),
        getPodUrlAll: jest.fn(),
        getSolidDataset: jest.fn(),
        getThing: jest.fn(),
        getUrl: jest.fn(),
        overwriteFile: jest.fn()
    };
});
jest.mock('@inrupt/solid-client-authn-browser', () => ({
    getDefaultSession: jest.fn(),
    handleIncomingRedirect: jest.fn(),
    login: jest.fn()
}));
jest.mock('../../../src/lib/log', () => ({__esModule: true, default: {error: jest.fn()}}));
jest.mock('../../../src/lib/solid-pending-save', () => ({
    putPendingSolidSave: jest.fn(),
    takePendingSolidSave: jest.fn()
}));

const webId = 'http://localhost:3000/alice/profile/card#me';
const podUrl = 'http://localhost:3000/alice/';
const sessionFetch = jest.fn();
const pending = {
    webId,
    title: 'My Project',
    projectJson: '{"targets":[]}',
    projectSb3: new Blob(['sb3'])
};

const readBlobText = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
});

const setSearch = search => window.history.replaceState({}, '', `/solid-save.html${search}`);

beforeEach(() => {
    jest.resetAllMocks();
    getDefaultSession.mockReturnValue({fetch: sessionFetch, info: {isLoggedIn: true, webId}});
    getPodUrlAll.mockResolvedValue([podUrl]);
    getSolidDataset.mockResolvedValue({});
    setSearch('');
    window.localStorage.clear();
});

describe('getLoggedInSolidWebId', () => {
    test('returns the WebID of the current session', () => {
        expect(getLoggedInSolidWebId()).toBe(webId);
    });

    test('returns null without a logged-in session', () => {
        getDefaultSession.mockReturnValue({fetch: sessionFetch, info: {isLoggedIn: false}});
        expect(getLoggedInSolidWebId()).toBeNull();
    });
});

describe('saveToSolidPod', () => {
    test('overwrites the title\'s file in the scratch container using the session\'s WebID', async () => {
        const url = await saveToSolidPod({title: 'My Project', projectJson: '{"targets":[]}'});

        expect(getPodUrlAll).toHaveBeenCalledWith(webId, {fetch: sessionFetch});
        expect(overwriteFile).toHaveBeenCalledWith(
            `${podUrl}scratch/My-Project.json`,
            expect.any(Blob),
            {contentType: 'application/json', fetch: sessionFetch}
        );
        expect(url).toBe(`${podUrl}scratch/My-Project.json`);
    });

    test('rejects without writing when there is no session', async () => {
        getDefaultSession.mockReturnValue({fetch: sessionFetch, info: {isLoggedIn: false}});

        const saving = saveToSolidPod({title: 'My Project', projectJson: '{}'});
        await expect(saving).rejects.toThrow(SolidSessionExpiredError);
        await expect(saving).rejects.toThrow('no logged-in');
        expect(overwriteFile).not.toHaveBeenCalled();
    });

    test('rejects with a session-expired error when the Pod rejects the token', async () => {
        const {FetchError} = jest.requireMock('@inrupt/solid-client');
        overwriteFile.mockRejectedValue(new FetchError(401));

        await expect(saveToSolidPod({title: 'My Project', projectJson: '{}'}))
            .rejects.toThrow(SolidSessionExpiredError);
    });

    test('passes other failures through unchanged', async () => {
        const {FetchError} = jest.requireMock('@inrupt/solid-client');
        const forbidden = new FetchError(403);
        overwriteFile.mockRejectedValue(forbidden);

        await expect(saveToSolidPod({title: 'My Project', projectJson: '{}'})).rejects.toBe(forbidden);
    });
});

describe('startSolidSave', () => {
    const args = {webId, title: 'My Project', projectJson: '{}', projectSb3: pending.projectSb3};

    test('stashes the project, then logs in with the issuer named in the profile', async () => {
        getThing.mockReturnValue({});
        getUrl.mockReturnValue('http://localhost:3000/');

        await startSolidSave(args);

        expect(getSolidDataset).toHaveBeenCalledWith(webId);
        expect(putPendingSolidSave).toHaveBeenCalledWith({...args, isRenewal: false});
        expect(login).toHaveBeenCalledWith(expect.objectContaining({
            oidcIssuer: 'http://localhost:3000/',
            redirectUrl: `${window.location.origin}/solid-save.html`
        }));
        expect(putPendingSolidSave.mock.invocationCallOrder[0])
            .toBeLessThan(login.mock.invocationCallOrder[0]);
    });

    test('marks a login started because the session lapsed as a renewal', async () => {
        getThing.mockReturnValue({});
        getUrl.mockReturnValue('http://localhost:3000/');

        await startSolidSave({...args, isRenewal: true});

        expect(putPendingSolidSave).toHaveBeenCalledWith({...args, isRenewal: true});
    });

    test('does not remember the WebID until the login succeeds', async () => {
        getThing.mockReturnValue({});
        getUrl.mockReturnValue('http://localhost:3000/');

        await startSolidSave(args);

        expect(getLastSolidWebId()).toBe('');
    });

    test('rejects without stashing or logging in when the profile has no issuer', async () => {
        getThing.mockReturnValue({});
        getUrl.mockReturnValue(null);

        await expect(startSolidSave(args)).rejects.toThrow('solid:oidcIssuer');
        expect(putPendingSolidSave).not.toHaveBeenCalled();
        expect(login).not.toHaveBeenCalled();
    });

    test('rejects with a readable message when the profile cannot be fetched', async () => {
        const {FetchError} = jest.requireMock('@inrupt/solid-client');
        getSolidDataset.mockRejectedValue(new FetchError(401));

        await expect(startSolidSave(args)).rejects.toThrow(`The profile at ${webId} could not be read (HTTP 401).`);
        expect(login).not.toHaveBeenCalled();
    });

    test('rejects when the profile has no thing for the WebID', async () => {
        getThing.mockReturnValue(null);

        await expect(startSolidSave(args)).rejects.toThrow('solid:oidcIssuer');
        expect(login).not.toHaveBeenCalled();
    });
});

describe('completePendingSolidSave', () => {
    test('restores the previous session so later saves need no login', async () => {
        handleIncomingRedirect.mockResolvedValue({isLoggedIn: true});

        await completePendingSolidSave();

        expect(handleIncomingRedirect).toHaveBeenCalledWith({restorePreviousSession: true});
    });

    test('returns null and leaves any stash alone when not returning from a login', async () => {
        handleIncomingRedirect.mockResolvedValue({isLoggedIn: false});

        expect(await completePendingSolidSave()).toBeNull();
        expect(takePendingSolidSave).not.toHaveBeenCalled();
    });

    test('returns null when returning from a login with nothing pending', async () => {
        setSearch('?code=abc&state=xyz');
        handleIncomingRedirect.mockResolvedValue({isLoggedIn: true});
        takePendingSolidSave.mockResolvedValue(null);

        expect(await completePendingSolidSave()).toBeNull();
    });

    test('reports an error, still returning the project, when the login was not completed', async () => {
        setSearch('?error=access_denied&state=xyz');
        handleIncomingRedirect.mockResolvedValue({isLoggedIn: false});
        takePendingSolidSave.mockResolvedValue(pending);

        const completed = await completePendingSolidSave();

        expect(completed.outcome).toEqual({status: 'error', message: 'The Solid login was not completed.'});
        expect(completed.projectSb3).toBe(pending.projectSb3);
        expect(overwriteFile).not.toHaveBeenCalled();
        expect(getLastSolidWebId()).toBe('');
    });

    describe('when logged in', () => {
        beforeEach(() => {
            setSearch('?code=abc&state=xyz');
            handleIncomingRedirect.mockResolvedValue({isLoggedIn: true});
            takePendingSolidSave.mockResolvedValue(pending);
        });

        test('remembers the WebID for later saves', async () => {
            expect(getLastSolidWebId()).toBe('');

            await completePendingSolidSave();

            expect(getLastSolidWebId()).toBe(webId);
        });

        test('reports whether the login was a renewal', async () => {
            takePendingSolidSave.mockResolvedValue({...pending, isRenewal: true});

            expect((await completePendingSolidSave()).isRenewal).toBe(true);
        });

        test('writes the JSON into the existing scratch container', async () => {
            const completed = await completePendingSolidSave();

            expect(getPodUrlAll).toHaveBeenCalledWith(webId, {fetch: sessionFetch});
            expect(createContainerAt).not.toHaveBeenCalled();
            expect(overwriteFile).toHaveBeenCalledWith(
                `${podUrl}scratch/My-Project.json`,
                expect.any(Blob),
                {contentType: 'application/json', fetch: sessionFetch}
            );
            const written = overwriteFile.mock.calls[0][1];
            expect(await readBlobText(written)).toBe(pending.projectJson);
            expect(completed).toEqual({
                outcome: {status: 'saved', url: `${podUrl}scratch/My-Project.json`},
                title: pending.title,
                projectSb3: pending.projectSb3
            });
        });

        test('creates the scratch container first when it does not exist', async () => {
            const {FetchError} = jest.requireMock('@inrupt/solid-client');
            getSolidDataset.mockRejectedValue(new FetchError(404));

            const completed = await completePendingSolidSave();

            expect(createContainerAt).toHaveBeenCalledWith(`${podUrl}scratch/`, {fetch: sessionFetch});
            expect(createContainerAt.mock.invocationCallOrder[0])
                .toBeLessThan(overwriteFile.mock.invocationCallOrder[0]);
            expect(completed.outcome.status).toBe('saved');
        });

        test('falls back to a default file name when the title has no usable characters', async () => {
            takePendingSolidSave.mockResolvedValue({...pending, title: '???'});

            await completePendingSolidSave();

            expect(overwriteFile.mock.calls[0][0]).toBe(`${podUrl}scratch/project.json`);
        });

        test('reports an error when the profile lists no Pod', async () => {
            getPodUrlAll.mockResolvedValue([]);

            const completed = await completePendingSolidSave();

            expect(completed.outcome.status).toBe('error');
            expect(completed.outcome.message).toContain('pim:storage');
            expect(overwriteFile).not.toHaveBeenCalled();
        });

        test('reports an error and still returns the project when the write fails', async () => {
            overwriteFile.mockRejectedValue(new Error('403 Forbidden'));

            const completed = await completePendingSolidSave();

            expect(completed.outcome).toEqual({status: 'error', message: '403 Forbidden'});
            expect(completed.projectSb3).toBe(pending.projectSb3);
            expect(log.error).toHaveBeenCalled();
        });

        test('does not swallow non-404 errors when checking the container', async () => {
            const {FetchError} = jest.requireMock('@inrupt/solid-client');
            getSolidDataset.mockRejectedValue(new FetchError(500));

            const completed = await completePendingSolidSave();

            expect(createContainerAt).not.toHaveBeenCalled();
            expect(completed.outcome.status).toBe('error');
        });
    });
});
