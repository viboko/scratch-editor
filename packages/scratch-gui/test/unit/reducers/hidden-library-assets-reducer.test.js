import hiddenLibraryAssetsReducer, {
    hiddenLibraryAssetsInitialState,
    setHiddenLibraryAssets
} from '../../../src/reducers/hidden-library-assets';

test('initialState hides nothing', () => {
    let defaultState;
    expect(hiddenLibraryAssetsReducer(defaultState, {type: 'anything'})).toEqual({
        sprites: [],
        backdrops: [],
        costumes: [],
        sounds: []
    });
});

test('setHiddenLibraryAssets fills in the libraries it leaves out', () => {
    const resultState = hiddenLibraryAssetsReducer(
        hiddenLibraryAssetsInitialState,
        setHiddenLibraryAssets({sprites: ['Cat'], sounds: ['Meow']})
    );
    expect(resultState).toEqual({
        sprites: ['Cat'],
        backdrops: [],
        costumes: [],
        sounds: ['Meow']
    });
});
