import React, {useCallback, useState} from 'react';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';

import styles from './solid-save-modal.css';
import closeIcon from '../debug-modal/icons/icon--close.svg';

const messages = defineMessages({
    title: {
        id: 'gui.solidSaveModal.title',
        defaultMessage: 'Save to your Solid Pod',
        description: 'Title of the modal for saving the project to a Solid Pod'
    },
    description: {
        id: 'gui.solidSaveModal.description',
        defaultMessage: 'Enter your WebID and continue to log in to your Solid provider. ' +
            'Your project will be saved in a "scratch" container in your Pod.',
        description: 'Explains what happens when saving the project to a Solid Pod'
    },
    webIdLabel: {
        id: 'gui.solidSaveModal.webIdLabel',
        defaultMessage: 'Your WebID',
        description: 'Label for the text field where the user enters their Solid WebID'
    },
    webIdPlaceholder: {
        id: 'gui.solidSaveModal.webIdPlaceholder',
        defaultMessage: 'https://example.com/profile/card#me',
        description: 'Example WebID shown inside the empty WebID text field'
    },
    continue: {
        id: 'gui.solidSaveModal.continue',
        defaultMessage: 'Continue',
        description: 'Button that starts the Solid login'
    },
    working: {
        id: 'gui.solidSaveModal.working',
        defaultMessage: 'Contacting your Solid provider…',
        description: 'Shown while the Solid login is being started'
    },
    saved: {
        id: 'gui.solidSaveModal.saved',
        defaultMessage: 'Your project was saved to {url}',
        description: 'Shown when the project was written to the Solid Pod. {url} is the address of the saved file'
    },
    error: {
        id: 'gui.solidSaveModal.error',
        defaultMessage: 'Your project could not be saved to your Pod: {message}',
        description: 'Shown when saving to the Solid Pod failed. {message} is the reason'
    },
    close: {
        id: 'gui.solidSaveModal.close',
        defaultMessage: 'Close',
        description: 'Button that closes the modal for saving to a Solid Pod'
    }
});

const isValidWebId = webId => {
    try {
        const {protocol} = new URL(webId.trim());
        return protocol === 'https:' || protocol === 'http:';
    } catch (e) {
        return false;
    }
};

const SolidSaveModal = ({
    errorMessage,
    initialWebId = '',
    isOpen,
    onClose,
    onContinue,
    resultUrl,
    status = 'input'
}) => {
    const intl = useIntl();
    const [webId, setWebId] = useState(initialWebId);

    const handleChange = useCallback(e => setWebId(e.target.value), []);
    const handleSubmit = useCallback(e => {
        e.preventDefault();
        onContinue(webId.trim());
    }, [onContinue, webId]);

    if (!isOpen) return null;

    const isWorking = status === 'working';

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            className={styles.solidSaveModalContainer}
            overlayClassName={styles.solidSaveModalOverlay}
        >
            <div className={styles.modalHeader}>
                <div className={styles.headerTitle}>
                    <FormattedMessage {...messages.title} />
                </div>
                <button
                    className={styles.closeButton}
                    aria-label={intl.formatMessage(messages.close)}
                    onClick={onClose}
                >
                    <img src={closeIcon} />
                </button>
            </div>
            {status === 'saved' ? (
                <div className={styles.modalContent}>
                    <p className={styles.message}>
                        <FormattedMessage
                            {...messages.saved}
                            values={{url: resultUrl}}
                        />
                    </p>
                    <div className={styles.actions}>
                        <button
                            className={styles.continueButton}
                            onClick={onClose}
                        >
                            <FormattedMessage {...messages.close} />
                        </button>
                    </div>
                </div>
            ) : (
                <form
                    className={styles.modalContent}
                    onSubmit={handleSubmit}
                >
                    <p className={styles.description}>
                        <FormattedMessage {...messages.description} />
                    </p>
                    <label className={styles.fieldLabel}>
                        <FormattedMessage {...messages.webIdLabel} />
                        <input
                            className={styles.webIdInput}
                            type="url"
                            value={webId}
                            placeholder={intl.formatMessage(messages.webIdPlaceholder)}
                            disabled={isWorking}
                            autoFocus
                            onChange={handleChange}
                        />
                    </label>
                    {status === 'error' ? (
                        <p className={styles.message}>
                            <FormattedMessage
                                {...messages.error}
                                values={{message: errorMessage}}
                            />
                        </p>
                    ) : null}
                    {isWorking ? (
                        <p className={styles.message}>
                            <FormattedMessage {...messages.working} />
                        </p>
                    ) : null}
                    <div className={styles.actions}>
                        <button
                            className={styles.continueButton}
                            type="submit"
                            disabled={isWorking || !isValidWebId(webId)}
                        >
                            <FormattedMessage {...messages.continue} />
                        </button>
                    </div>
                </form>
            )}
        </ReactModal>
    );
};

SolidSaveModal.propTypes = {
    errorMessage: PropTypes.string,
    initialWebId: PropTypes.string,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
    resultUrl: PropTypes.string,
    status: PropTypes.oneOf(['input', 'working', 'saved', 'error'])
};

export default SolidSaveModal;
