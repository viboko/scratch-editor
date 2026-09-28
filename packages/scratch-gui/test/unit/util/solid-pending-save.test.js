/* eslint-env jest */
import 'fake-indexeddb/auto';

import {putPendingSolidSave, takePendingSolidSave} from '../../../src/lib/solid-pending-save';

// jsdom has no structuredClone, which fake-indexeddb uses to copy stored values. An identity copy is enough here.
global.structuredClone = value => value;

const pending = {
    webId: 'http://localhost:3000/alice/profile/card#me',
    isRenewal: true,
    title: 'My Project',
    projectJson: '{"targets":[]}',
    projectSb3: new Blob(['sb3 bytes'])
};

test('take returns null when nothing is pending', async () => {
    expect(await takePendingSolidSave()).toBeNull();
});

test('take returns the stored save and removes it', async () => {
    await putPendingSolidSave(pending);

    const taken = await takePendingSolidSave();
    expect(taken).toMatchObject({
        webId: pending.webId,
        isRenewal: true,
        title: pending.title,
        projectJson: pending.projectJson
    });
    expect(await takePendingSolidSave()).toBeNull();
});

test('put replaces an earlier pending save', async () => {
    await putPendingSolidSave(pending);
    await putPendingSolidSave({...pending, title: 'Second'});

    expect((await takePendingSolidSave()).title).toBe('Second');
});
