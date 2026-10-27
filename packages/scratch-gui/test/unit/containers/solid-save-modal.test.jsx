/* eslint-env jest */
import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import ReactModal from 'react-modal';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import SolidSaveModal from '../../../src/containers/solid-save-modal';
import {createStore} from 'redux';

import {createSatchel} from '@viboko/satchel-core';
import modalsReducer from '../../../src/reducers/modals';
import {LoadingState} from '../../../src/reducers/project-state';

jest.mock('@viboko/satchel-core', () => ({createSatchel: jest.fn()}));

const satchel = {
    completeLogin: jest.fn(),
    getLastWebId: jest.fn(),
    hasLoggedInBefore: jest.fn(),
    saveOrRenew: jest.fn(),
    startLogin: jest.fn()
};
const {completeLogin, getLastWebId, hasLoggedInBefore, saveOrRenew, startLogin} = satchel;

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
        createSatchel.mockReturnValue(satchel);
        getLastWebId.mockReturnValue('');
        hasLoggedInBefore.mockReturnValue(false);
        vm = {
            loadProject: jest.fn(() => Promise.resolve()),
            saveProjectSb3: jest.fn(() => Promise.resolve('sb3-blob'))
        };
    });

    const clientId = 'http://localhost:8601/solid-client-id.jsonld';

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
                <SolidSaveModal clientId={clientId} />
            </Provider>
        );
    };

    test('does nothing when the page load is not returning from a Solid login', async () => {
        completeLogin.mockResolvedValue(null);
        renderContainer();

        await waitFor(() => expect(completeLogin).toHaveBeenCalled());
        expect(vm.loadProject).not.toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });

    test('restores the stashed project and reports where it was saved', async () => {
        completeLogin.mockResolvedValue({
            outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.sb3'},
            title: 'Restored Title',
            data: projectSb3
        });
        renderContainer({isOpen: true});

        await waitFor(() => expect(vm.loadProject).toHaveBeenCalledWith(sb3Bytes));
        await waitFor(() => expect(store.getActions()).toEqual([
            OPEN_MODAL,
            OPEN_LOADING,
            SET_TITLE,
            CLOSE_LOADING
        ]));
        expect(screen.getByText('Your project was saved to http://localhost:3000/alice/scratch/My-Project.sb3'))
            .toBeTruthy();
    });

    test('waits for the default project to finish loading before restoring', async () => {
        completeLogin.mockResolvedValue({
            outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.sb3'},
            title: 'Restored Title',
            data: projectSb3
        });
        renderContainer({loadingState: LoadingState.LOADING_VM_NEW_DEFAULT});

        await waitFor(() => expect(store.getActions()).toEqual([OPEN_MODAL]));
        expect(vm.loadProject).not.toHaveBeenCalled();
    });

    test('shows the failure but still restores the project when the write failed', async () => {
        completeLogin.mockResolvedValue({
            outcome: {status: 'error', message: '403 Forbidden'},
            title: 'Restored Title',
            data: projectSb3
        });
        renderContainer({isOpen: true});

        await waitFor(() => expect(vm.loadProject).toHaveBeenCalledWith(sb3Bytes));
        expect(screen.getByText('Your project could not be saved to your Pod: 403 Forbidden')).toBeTruthy();
    });

    test('identifies Scratch, and where its projects go in the Pod, to satchel-core', () => {
        completeLogin.mockResolvedValue(null);
        renderContainer();

        expect(createSatchel).toHaveBeenCalledWith(expect.objectContaining({
            clientName: 'Scratch',
            clientId,
            containerName: 'scratch',
            fileExtension: 'sb3',
            contentType: 'application/x.scratch.sb3'
        }));
    });

    test('Continue stashes the project and starts the Solid login', async () => {
        completeLogin.mockResolvedValue(null);
        startLogin.mockResolvedValue();
        renderContainer({isOpen: true});

        fireEvent.change(screen.getByLabelText('Your WebID'), {
            target: {value: 'http://localhost:3000/alice/profile/card#me'}
        });
        fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

        await waitFor(() => expect(startLogin).toHaveBeenCalledWith({
            webId: 'http://localhost:3000/alice/profile/card#me',
            title: 'My Project',
            data: 'sb3-blob'
        }));
    });

    test('shows an error when the login cannot be started', async () => {
        completeLogin.mockResolvedValue(null);
        startLogin.mockRejectedValue(new Error('no oidc issuer'));
        renderContainer({isOpen: true});

        fireEvent.change(screen.getByLabelText('Your WebID'), {
            target: {value: 'http://localhost:3000/alice/profile/card#me'}
        });
        fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

        await screen.findByText('Your project could not be saved to your Pod: no oidc issuer');
    });

    describe('when the user has logged in before', () => {
        beforeEach(() => {
            completeLogin.mockResolvedValue(null);
            getLastWebId.mockReturnValue(webId);
            hasLoggedInBefore.mockReturnValue(true);
        });

        test('saves straight to the Pod without showing the dialog', async () => {
            saveOrRenew.mockResolvedValue({status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.sb3'});
            renderContainer({isOpen: true});

            await waitFor(() => expect(store.getActions()).toEqual([SHOW_SAVING, SHOW_SAVED, CLOSE_MODAL]));
            expect(saveOrRenew).toHaveBeenCalledWith({title: 'My Project', data: 'sb3-blob'});
            expect(startLogin).not.toHaveBeenCalled();
            expect(screen.queryByLabelText('Your WebID')).toBeNull();
        });

        test('does nothing while the modal is closed', async () => {
            renderContainer({isOpen: false});

            await waitFor(() => expect(completeLogin).toHaveBeenCalled());
            expect(saveOrRenew).not.toHaveBeenCalled();
        });

        test('leaves the saving alert up, without the dialog, while a lapsed session is renewed', async () => {
            saveOrRenew.mockResolvedValue({status: 'redirecting'});
            renderContainer({isOpen: true});

            await waitFor(() => expect(saveOrRenew).toHaveBeenCalled());
            expect(store.getActions()).toEqual([SHOW_SAVING]);
            expect(screen.queryByLabelText('Your WebID')).toBeNull();
        });

        test('falls back to the dialog, showing the error and the WebID, when the save fails', async () => {
            saveOrRenew.mockRejectedValue(new Error('401 Unauthorized'));
            renderContainer({isOpen: true});

            await screen.findByText('Your project could not be saved to your Pod: 401 Unauthorized');
            expect(store.getActions()).toEqual([SHOW_SAVING, CLOSE_SAVING]);
            expect(screen.getByLabelText('Your WebID').value).toBe(webId);
        });

        test('shows the result after a login redirect instead of saving again', async () => {
            completeLogin.mockResolvedValue({
                outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.sb3'},
                title: 'Restored Title',
                data: projectSb3
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

            await screen.findByText('Your project was saved to http://localhost:3000/alice/scratch/My-Project.sb3');
            expect(saveOrRenew).not.toHaveBeenCalled();
        });

        test('only shows the saved alert, and restores the project, when a renewal login returns', async () => {
            completeLogin.mockResolvedValue({
                outcome: {status: 'saved', url: 'http://localhost:3000/alice/scratch/My-Project.sb3'},
                isRenewal: true,
                title: 'Restored Title',
                data: projectSb3
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
        completeLogin.mockResolvedValue(null);
        renderContainer({isOpen: true});

        expect(screen.getByLabelText('Your WebID').value).toBe('');
        expect(saveOrRenew).not.toHaveBeenCalled();
    });
});
