import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {createSatchel} from '@viboko/satchel-core';

import SolidSaveModalComponent from '../components/solid-save-modal/solid-save-modal';
import log from '../lib/log';
import {closeAlertWithId, showAlertWithTimeout, showStandardAlert} from '../reducers/alerts';
import {closeLoadingProject, closeSolidSaveModal, openLoadingProject, openSolidSaveModal} from '../reducers/modals';
import {getIsShowingWithoutId} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';

/**
 * Saves the project to a Solid Pod through satchel-core, which does the Solid work; this container connects it to the
 * editor. A save by a user who has logged in before shows only the usual saving alerts. Only a user who has never
 * logged in is asked for a WebID, in the modal. Logging in redirects the whole page, so such a save spans two page
 * loads: on the page load that follows the redirect, satchel-core finishes the save and this container restores the
 * project into the editor. The modal reports the outcome of a login it asked for, and any failure; a silent renewal
 * of a lapsed session just shows the usual saved alert.
 * @param {object} props Props
 * @param {string} [props.clientId] URL of the Solid-OIDC Client ID Document that identifies Scratch when logging in
 * @returns {React.Element} The modal
 */
const SolidSaveModal = ({
    clientId,
    isOpen,
    loadingState,
    projectTitle,
    vm,
    onClose,
    onLoadingFinished,
    onLoadingStarted,
    onOpen,
    onSetProjectTitle,
    onShowSaved,
    onShowSaving,
    onSaveFailed
}) => {
    const satchel = useMemo(() => createSatchel({
        clientName: 'Scratch',
        clientId,
        containerName: 'scratch',
        fileExtension: 'sb3',
        contentType: 'application/x.scratch.sb3',
        logger: log
    }), [clientId]);
    const [status, setStatus] = useState('input');
    const [resultUrl, setResultUrl] = useState();
    const [errorMessage, setErrorMessage] = useState();
    const [projectToRestore, setProjectToRestore] = useState(null);
    const isRestoring = useRef(false);

    // The modal is only a login dialog: for a user who has logged in before, "open" means "save now" and the dialog
    // stays hidden, unless it has been forced open to report a result or a failed save. This is a ref, set before
    // the modal is opened, because the store update that opens the modal renders before any batched state update
    // would land.
    const isDialogForced = useRef(false);
    const isQuickSave = isOpen && !isDialogForced.current && satchel.hasLoggedInBefore();

    useEffect(() => {
        satchel.completeLogin()
            .then(completed => {
                if (!completed) return;
                const {outcome, isRenewal, title, data} = completed;
                setProjectToRestore({title, projectSb3: data});
                if (outcome.status === 'saved' && isRenewal) {
                    onShowSaved();
                    return;
                }
                if (outcome.status === 'saved') {
                    setResultUrl(outcome.url);
                    setStatus('saved');
                } else {
                    setErrorMessage(outcome.message);
                    setStatus('error');
                }
                isDialogForced.current = true;
                onOpen();
            })
            .catch(error => log.error('SolidSaveModal: could not complete the pending Solid save', error));
    }, []);

    // The stashed project can only replace the editor's project once the editor has finished loading its
    // default project.
    useEffect(() => {
        if (!projectToRestore || isRestoring.current || !getIsShowingWithoutId(loadingState)) return;
        isRestoring.current = true;

        const {title, projectSb3} = projectToRestore;
        onLoadingStarted();
        projectSb3.arrayBuffer()
            .then(buffer => vm.loadProject(buffer))
            .then(() => onSetProjectTitle(title))
            .catch(error => log.error('SolidSaveModal: could not restore the project after the Solid login', error))
            .then(() => {
                onLoadingFinished();
                setProjectToRestore(null);
            });
    }, [projectToRestore, loadingState]);

    useEffect(() => {
        if (!isQuickSave) return;
        onShowSaving();
        vm.saveProjectSb3()
            .then(projectSb3 => satchel.saveOrRenew({title: projectTitle, data: projectSb3}))
            .then(result => {
                // While redirecting, the save is finished when the login returns.
                if (result.status !== 'saved') return;
                onShowSaved();
                onClose();
            })
            .catch(error => {
                log.error('SolidSaveModal: could not save to the Solid Pod', error);
                onSaveFailed();
                setErrorMessage(error.message);
                isDialogForced.current = true;
                setStatus('error');
            });
    }, [isQuickSave]);

    const handleClose = useCallback(() => {
        isDialogForced.current = false;
        setStatus('input');
        onClose();
    }, [onClose]);

    const handleContinue = useCallback(async webId => {
        setStatus('working');
        try {
            await satchel.startLogin({webId, title: projectTitle, data: await vm.saveProjectSb3()});
            // The browser is now being redirected to the Solid provider.
        } catch (error) {
            log.error(`SolidSaveModal: could not start the Solid login for ${webId}`, error);
            setErrorMessage(error.message);
            setStatus('error');
        }
    }, [satchel, projectTitle, vm]);

    return (
        <SolidSaveModalComponent
            errorMessage={errorMessage}
            initialWebId={satchel.getLastWebId()}
            isOpen={isOpen && !isQuickSave}
            resultUrl={resultUrl}
            status={status}
            onClose={handleClose}
            onContinue={handleContinue}
        />
    );
};

SolidSaveModal.propTypes = {
    clientId: PropTypes.string,
    isOpen: PropTypes.bool,
    loadingState: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onLoadingFinished: PropTypes.func.isRequired,
    onLoadingStarted: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onSaveFailed: PropTypes.func.isRequired,
    onSetProjectTitle: PropTypes.func.isRequired,
    onShowSaved: PropTypes.func.isRequired,
    onShowSaving: PropTypes.func.isRequired,
    projectTitle: PropTypes.string,
    vm: PropTypes.shape({
        loadProject: PropTypes.func,
        saveProjectSb3: PropTypes.func
    }).isRequired
};

const mapStateToProps = state => ({
    isOpen: state.scratchGui.modals.solidSaveModal,
    loadingState: state.scratchGui.projectState.loadingState,
    projectTitle: state.scratchGui.projectTitle,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeSolidSaveModal()),
    onLoadingFinished: () => dispatch(closeLoadingProject()),
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onOpen: () => dispatch(openSolidSaveModal()),
    onSaveFailed: () => dispatch(closeAlertWithId('saving')),
    onSetProjectTitle: title => dispatch(setProjectTitle(title)),
    onShowSaved: () => showAlertWithTimeout(dispatch, 'saveSuccess'),
    onShowSaving: () => dispatch(showStandardAlert('saving'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SolidSaveModal);
