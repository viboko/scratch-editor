/* eslint-env jest */
import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import ReactModal from 'react-modal';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import SolidSaveModal from '../../../src/components/solid-save-modal/solid-save-modal';

const webId = 'http://localhost:3000/alice/profile/card#me';

describe('SolidSaveModal', () => {
    let onClose;
    let onContinue;

    beforeAll(() => {
        ReactModal.setAppElement(document.createElement('div'));
    });

    beforeEach(() => {
        onClose = jest.fn();
        onContinue = jest.fn();
    });

    const renderModal = props => renderWithIntl(
        <SolidSaveModal
            isOpen
            onClose={onClose}
            onContinue={onContinue}
            {...props}
        />
    );

    const typeWebId = value => fireEvent.change(screen.getByLabelText('Your WebID'), {target: {value}});

    test('renders nothing when closed', () => {
        renderModal({isOpen: false});
        expect(screen.queryByText('Save to your Solid Pod')).toBeNull();
    });

    test('Continue is disabled until the WebID is a valid URL', () => {
        renderModal();
        const continueButton = screen.getByRole('button', {name: 'Continue'});
        expect(continueButton.disabled).toBe(true);

        typeWebId('not a url');
        expect(continueButton.disabled).toBe(true);

        typeWebId(webId);
        expect(continueButton.disabled).toBe(false);
    });

    test('Continue passes the trimmed WebID to onContinue', () => {
        renderModal();
        typeWebId(`  ${webId}  `);
        fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(onContinue).toHaveBeenCalledWith(webId);
    });

    test('disables the field and Continue while working', () => {
        renderModal({status: 'working'});
        expect(screen.getByText('Contacting your Solid provider…')).toBeTruthy();
        expect(screen.getByLabelText('Your WebID').disabled).toBe(true);
        expect(screen.getByRole('button', {name: 'Continue'}).disabled).toBe(true);
    });

    test('shows the error and keeps the form usable', () => {
        renderModal({status: 'error', errorMessage: '403 Forbidden'});
        expect(screen.getByText('Your project could not be saved to your Pod: 403 Forbidden')).toBeTruthy();

        typeWebId(webId);
        expect(screen.getByRole('button', {name: 'Continue'}).disabled).toBe(false);
    });

    test('shows where the project was saved, without the form', () => {
        renderModal({status: 'saved', resultUrl: 'http://localhost:3000/alice/scratch/x.json'});
        expect(screen.getByText('Your project was saved to http://localhost:3000/alice/scratch/x.json')).toBeTruthy();
        expect(screen.queryByLabelText('Your WebID')).toBeNull();
    });

    test('the close buttons call onClose', () => {
        renderModal({status: 'saved', resultUrl: 'http://localhost:3000/alice/scratch/x.json'});
        screen.getAllByRole('button', {name: 'Close'}).forEach(button => fireEvent.click(button));
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
