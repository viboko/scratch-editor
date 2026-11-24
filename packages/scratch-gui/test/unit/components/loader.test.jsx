import React from 'react';
import '@testing-library/jest-dom';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import Loader from '../../../src/components/loader/loader.jsx';

describe('Loader Component', () => {
    test('picks from its own messages by default', () => {
        const {getAllByText} = renderWithIntl(<Loader />);

        expect(getAllByText('Loading sprites …')).toHaveLength(1);
        expect(getAllByText('Herding cats …')).toHaveLength(1);
    });

    test('picks only from the messages it is given', () => {
        const messages = [
            {message: {id: 'gui.loader.message2', defaultMessage: 'Loading sprites …'}, weight: 1},
            {message: {id: 'test.loader.custom', defaultMessage: 'Sharpening pencils …'}, weight: 1}
        ];
        const {getByText, queryByText} = renderWithIntl(<Loader messages={messages} />);

        expect(getByText('Loading sprites …')).toBeInTheDocument();
        expect(getByText('Sharpening pencils …')).toBeInTheDocument();
        expect(queryByText('Herding cats …')).not.toBeInTheDocument();
    });
});
