/* eslint-env jest */
import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import ReactModal from 'react-modal';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import SolidSaveModal from '../../../src/containers/solid-save-modal';
import {createStore} from 'redux';

import {
    completePendingSolidSave,
    getLastSolidWebId,
    getLoggedInSolidWebId,
    saveToSolidPod,
    SolidSessionExpiredError,
    startSolidSave
} from '../../../src/lib/solid-save';
import modalsReducer from '../../../src/reducers/modals';
import {LoadingState} from '../../../src/reducers/project-state';

jest.mock('../../../src/lib/solid-save', () => ({
    completePendingSolidSave: jest.fn(),
    getLastSolidWebId: jest.fn(),
    getLoggedInSolidWebId: jest.fn(),
    saveToSolidPod: jest.fn(),
    SolidSessionExpiredError: class extends Error {},
    startSolidSave: jest.fn()
}));

const OPEN_MODAL = {type: 'scratch-gui/modals/OPEN_MODAL', modal: 'solidSaveModal'};
const OPEN_LOADING = {type: 'scratch-gui/modals/OPEN_MODAL', modal: 'loadingProject'};
const CLOSE_LOADING = {type: 'scratch-gui/modals/CLOSE_MODAL', modal: 'loadingProject'};
const CLOSE_MODAL = {type: 'scratch-gui/modals/CLOSE_MODAL', modal: 'solidSaveModal'};
const SHOW_SAVING = {type: 'scratch-gui/alerts/SHOW_ALERT', alertId: 'saving'};
const SHOW_SAVED = {type: 'scratch-gui/alerts/SHOW_ALERT', alertId: 'saveSuccess'};
const CLOSE_SAVING = {type: 'scratch-gui/alerts/CLOSE_ALERT_WITH_ID', alertId: 'saving'};
const webId = 'http://localhost:3000/alice/profile/card#me';
const SET_TITLE = {type: 'projectTitle/SET_PROJECT_TITLE', title: 'Restored Title'};

describe('SolidSaveModal container', () => {
    let vm;
    let store;
    const sb3Bytes = new ArrayBuffer(8);
    const projectSb3 = {arrayBuffer: () => Promise.resolve(sb3Bytes)};

    beforeAll(() => {
        ReactModal.setAppElement(document.createElement('div'));
    });

    beforeEach(() => {
        jest.resetAllMocks();
        getLastSolidWebId.mockReturnValue('');
        getLoggedInSolidWebId.mockReturnValue(null);
        vm = {
            loadProject: jest.fn(() => Promise.resolve()),
            saveProjectSb3: jest.fn(() => Promise.resolve('sb3-blob')),
            toJSON: jest.fn(() => '{"targets":[]}')
        };
    });

    const renderContainer = ({loadingState = LoadingState.SHOWING_WITHOUT_ID, isOpen = false} = {}) => {
        store = configureStore()({
            scratchGui: {
                modals: {solidSaveModal: isOpen},
                projectState: {loadingState},
                projectTitle: 'My Project',
                vm
            }
        });
        return renderWithIntl(
            <Provider store={store}>
                <SolidSaveModal />
            </Provider>
        );
    };

    test('does nothing when the page load is not returning from a Solid login', async () => {
        completePendingSolidSave.mockResolvedValue(null);
        renderContainer();

        await waitFor(() => expect(completePendingSolidSave).toHaveBeenCalled());
        expect(vm.loadProject).not.toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });

    test('restores the stashed project and reports where it was saved', async () => {
        completePendingSolidSave.mockResolvedValue({
            outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.json'},
            title: 'Restored Title',
            projectSb3
        });
        renderContainer({isOpen: true});

        await waitFor(() => expect(vm.loadProject).toHaveBeenCalledWith(sb3Bytes));
        await waitFor(() => expect(store.getActions()).toEqual([
            OPEN_MODAL,
            OPEN_LOADING,
            SET_TITLE,
            CLOSE_LOADING
        ]));
        expect(screen.getByText('Your project was saved to http://localhost:3000/alice/scratch/My-Project.json'))
            .toBeTruthy();
    });

    test('waits for the default project to finish loading before restoring', async () => {
        completePendingSolidSave.mockResolvedValue({
            outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.json'},
            title: 'Restored Title',
            projectSb3
        });
        renderContainer({loadingState: LoadingState.LOADING_VM_NEW_DEFAULT});

        await waitFor(() => expect(store.getActions()).toEqual([OPEN_MODAL]));
        expect(vm.loadProject).not.toHaveBeenCalled();
    });

    test('shows the failure but still restores the project when the write failed', async () => {
        completePendingSolidSave.mockResolvedValue({
            outcome: {status: 'error', message: '403 Forbidden'},
            title: 'Restored Title',
            projectSb3
        });
        renderContainer({isOpen: true});

        await waitFor(() => expect(vm.loadProject).toHaveBeenCalledWith(sb3Bytes));
        expect(screen.getByText('Your project could not be saved to your Pod: 403 Forbidden')).toBeTruthy();
    });

    test('Continue stashes the project and starts the Solid login', async () => {
        completePendingSolidSave.mockResolvedValue(null);
        startSolidSave.mockResolvedValue();
        renderContainer({isOpen: true});

        fireEvent.change(screen.getByLabelText('Your WebID'), {
            target: {value: 'http://localhost:3000/alice/profile/card#me'}
        });
        fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

        await waitFor(() => expect(startSolidSave).toHaveBeenCalledWith({
            webId: 'http://localhost:3000/alice/profile/card#me',
            title: 'My Project',
            projectJson: '{"targets":[]}',
            projectSb3: 'sb3-blob'
        }));
    });

    test('shows an error when the login cannot be started', async () => {
        completePendingSolidSave.mockResolvedValue(null);
        startSolidSave.mockRejectedValue(new Error('no oidc issuer'));
        renderContainer({isOpen: true});

        fireEvent.change(screen.getByLabelText('Your WebID'), {
            target: {value: 'http://localhost:3000/alice/profile/card#me'}
        });
        fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

        await screen.findByText('Your project could not be saved to your Pod: no oidc issuer');
    });

    describe('with a Solid session', () => {
        beforeEach(() => {
            completePendingSolidSave.mockResolvedValue(null);
            getLoggedInSolidWebId.mockReturnValue(webId);
        });

        test('saves straight to the Pod without showing the dialog', async () => {
            saveToSolidPod.mockResolvedValue('http://localhost:3000/alice/scratch/My-Project.json');
            renderContainer({isOpen: true});

            await waitFor(() => expect(store.getActions()).toEqual([SHOW_SAVING, SHOW_SAVED, CLOSE_MODAL]));
            expect(saveToSolidPod).toHaveBeenCalledWith({title: 'My Project', projectJson: '{"targets":[]}'});
            expect(startSolidSave).not.toHaveBeenCalled();
            expect(screen.queryByLabelText('Your WebID')).toBeNull();
        });

        test('does nothing while the modal is closed', async () => {
            renderContainer({isOpen: false});

            await waitFor(() => expect(completePendingSolidSave).toHaveBeenCalled());
            expect(saveToSolidPod).not.toHaveBeenCalled();
        });

        test('falls back to the dialog, showing the error, when the save fails', async () => {
            saveToSolidPod.mockRejectedValue(new Error('401 Unauthorized'));
            renderContainer({isOpen: true});

            await screen.findByText('Your project could not be saved to your Pod: 401 Unauthorized');
            expect(store.getActions()).toEqual([SHOW_SAVING, CLOSE_SAVING]);
            expect(screen.getByLabelText('Your WebID')).toBeTruthy();
        });

        test('shows the result after a login redirect instead of saving again', async () => {
            completePendingSolidSave.mockResolvedValue({
                outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.json'},
                title: 'Restored Title',
                projectSb3
            });
            const realStore = createStore((state = {scratchGui: {modals: {solidSaveModal: false}}}, action) => ({
                scratchGui: {
                    modals: modalsReducer(state.scratchGui.modals, action),
                    projectState: {loadingState: LoadingState.SHOWING_WITHOUT_ID},
                    projectTitle: 'My Project',
                    vm
                }
            }));
            renderWithIntl(
                <Provider store={realStore}>
                    <SolidSaveModal />
                </Provider>
            );

            await screen.findByText('Your project was saved to http://localhost:3000/alice/scratch/My-Project.json');
            expect(saveToSolidPod).not.toHaveBeenCalled();
        });
    });

    describe('when the Solid session has lapsed', () => {
        beforeEach(() => {
            completePendingSolidSave.mockResolvedValue(null);
            getLastSolidWebId.mockReturnValue(webId);
            getLoggedInSolidWebId.mockReturnValue(null);
            saveToSolidPod.mockRejectedValue(new SolidSessionExpiredError('no session'));
        });

        test('logs in again with the remembered WebID, without showing the dialog', async () => {
            startSolidSave.mockResolvedValue();
            renderContainer({isOpen: true});

            await waitFor(() => expect(startSolidSave).toHaveBeenCalledWith({
                webId,
                isRenewal: true,
                title: 'My Project',
                projectJson: '{"targets":[]}',
                projectSb3: 'sb3-blob'
            }));
            expect(store.getActions()).toEqual([SHOW_SAVING]);
            expect(screen.queryByLabelText('Your WebID')).toBeNull();
        });

        test('shows the dialog with the error, and the WebID prefilled, if logging in again fails', async () => {
            startSolidSave.mockRejectedValue(new Error('no oidc issuer'));
            renderContainer({isOpen: true});

            await screen.findByText('Your project could not be saved to your Pod: no oidc issuer');
            expect(screen.getByLabelText('Your WebID').value).toBe(webId);
            expect(store.getActions()).toEqual([SHOW_SAVING, CLOSE_SAVING]);
        });

        test('shows the dialog rather than logging in again when the failure is not an expired session', async () => {
            saveToSolidPod.mockRejectedValue(new Error('500 Internal Server Error'));
            renderContainer({isOpen: true});

            await screen.findByText('Your project could not be saved to your Pod: 500 Internal Server Error');
            expect(startSolidSave).not.toHaveBeenCalled();
        });

        test('only shows the saved alert, and restores the project, when a renewal login returns', async () => {
            completePendingSolidSave.mockResolvedValue({
                outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.json'},
                isRenewal: true,
                title: 'Restored Title',
                projectSb3
            });
            renderContainer({isOpen: false});

            await waitFor(() => expect(store.getActions()).toEqual([
                SHOW_SAVED,
                OPEN_LOADING,
                SET_TITLE,
                CLOSE_LOADING
            ]));
            expect(vm.loadProject).toHaveBeenCalledWith(sb3Bytes);
            expect(screen.queryByLabelText('Your WebID')).toBeNull();
        });
    });

    test('asks for the WebID when the user has never logged in', () => {
        completePendingSolidSave.mockResolvedValue(null);
        renderContainer({isOpen: true});

        expect(screen.getByLabelText('Your WebID').value).toBe('');
        expect(saveToSolidPod).not.toHaveBeenCalled();
    });
});
