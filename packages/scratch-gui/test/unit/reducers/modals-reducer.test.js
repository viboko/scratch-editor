/* eslint-env jest */
import modalsReducer, {
    closeSolidSaveModal,
    modalsInitialState,
    openSolidSaveModal
} from '../../../src/reducers/modals';

test('solid save modal is closed initially', () => {
    let defaultState;
    expect(modalsReducer(defaultState, {type: 'anything'}).solidSaveModal).toBe(false);
});

test('openSolidSaveModal opens only the solid save modal', () => {
    const newState = modalsReducer(modalsInitialState, openSolidSaveModal());
    expect(newState).toEqual({...modalsInitialState, solidSaveModal: true});
});

test('closeSolidSaveModal closes the solid save modal', () => {
    const openState = {...modalsInitialState, solidSaveModal: true};
    expect(modalsReducer(openState, closeSolidSaveModal()).solidSaveModal).toBe(false);
});
