import React from 'react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import MenuBar from '../../../src/components/menu-bar/menu-bar';
import {menuInitialState} from '../../../src/reducers/menus';
import {LoadingState} from '../../../src/reducers/project-state';
import {DEFAULT_MODE} from '../../../src/lib/settings/color-mode';
import {fireEvent} from '@testing-library/react';

import {PLATFORM} from '../../../src/lib/platform';

import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import VM from '@scratch/scratch-vm';
import {MenuRefProvider} from '../../../src/contexts/menu-ref-context.jsx';

describe('MenuBar Component', () => {
    const store = configureStore()({
        locales: {
            isRtl: false,
            locale: 'en-US'
        },
        scratchGui: {
            menus: menuInitialState,
            projectState: {
                loadingState: LoadingState.NOT_LOADED
            },
            settings: {
                colorMode: DEFAULT_MODE
            },
            timeTravel: {
                year: 'NOW'
            },
            vm: new VM(),
            platform: {
                platform: PLATFORM.WEB
            }
        }
    });

    const getComponent = function (props = {}) {
        return (<Provider store={store}>
            <MenuRefProvider>
                <MenuBar {...props} />
            </MenuRefProvider>
        </Provider>);
    };

    test('menu bar with no About handler has no About button', () => {
        const {container} = renderWithIntl(getComponent());
        const button = container.querySelector('button[aria-label="About menu"]');
        expect(button).toBeFalsy();
    });

    test('menu bar with an About handler has an About button', () => {
        const onClickAbout = jest.fn();
        const {container} = renderWithIntl(getComponent({onClickAbout}));
        const button = container.querySelector('button[aria-label="About menu"]');
        expect(button).toBeTruthy();
    });

    describe('triggering About button handler', () => {
        test('clicking on About button calls the handler', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = container.querySelector('button[aria-label="About menu"]');
    
            fireEvent.click(button);
            expect(onClickAbout).toHaveBeenCalledTimes(1);
        });
    
        test('not clicking on About button does not call the handler', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = container.querySelector('button[aria-label="About menu"]');
    
            expect(onClickAbout).toHaveBeenCalledTimes(0);
        });
    });

    describe('Save now handled by the embedding app', () => {
        const fileMenuProps = {
            canManageFiles: true,
            canCreateCopy: false,
            canRemix: false,
            onStartSelectingFileUpload: () => {}
        };
        const openFileMenu = (container) => {
            fireEvent.click(container.querySelector('[aria-label="File menu"]'));
        };

        test('without canSave or an onClickSave handler, there is no Save now item', () => {
            const {container, queryByText} = renderWithIntl(getComponent(fileMenuProps));
            openFileMenu(container);
            expect(queryByText('Save now')).toBeFalsy();
        });

        test('with an onClickSave handler, Save now calls it', () => {
            const onClickSave = jest.fn();
            const {container, getByText} = renderWithIntl(getComponent({...fileMenuProps, onClickSave}));
            openFileMenu(container);
            fireEvent.click(getByText('Save now'));
            expect(onClickSave).toHaveBeenCalledTimes(1);
        });

        test('with an onClickSave handler, Ctrl/Cmd+S calls it', () => {
            const onClickSave = jest.fn();
            renderWithIntl(getComponent({onClickSave}));
            fireEvent.keyDown(document, {key: 's', ctrlKey: true, metaKey: true});
            expect(onClickSave).toHaveBeenCalledTimes(1);
        });
    });
});
