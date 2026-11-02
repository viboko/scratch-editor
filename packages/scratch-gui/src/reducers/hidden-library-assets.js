// Reducer for the names of bundled library assets (sprites, backdrops, costumes, sounds)
// that the embedding app has asked to hide, passed down to the editor on runtime.
const SET_HIDDEN_LIBRARY_ASSETS = 'scratch-gui/hidden-library-assets/SET_HIDDEN_LIBRARY_ASSETS';

const initialState = {
    sprites: [],
    backdrops: [],
    costumes: [],
    sounds: []
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_HIDDEN_LIBRARY_ASSETS:
        return {
            sprites: action.hiddenLibraryAssets.sprites || [],
            backdrops: action.hiddenLibraryAssets.backdrops || [],
            costumes: action.hiddenLibraryAssets.costumes || [],
            sounds: action.hiddenLibraryAssets.sounds || []
        };
    default:
        return state;
    }
};

const setHiddenLibraryAssets = function (hiddenLibraryAssets) {
    return {
        type: SET_HIDDEN_LIBRARY_ASSETS,
        hiddenLibraryAssets
    };
};

export {
    reducer as default,
    initialState as hiddenLibraryAssetsInitialState,
    setHiddenLibraryAssets
};
