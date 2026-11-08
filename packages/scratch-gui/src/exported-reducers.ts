import {ScratchPaintReducer} from '@scratch/scratch-paint';
import LocalesReducer, {localesInitialState, initLocale, selectLocale, setLocales} from './reducers/locales.js';
import GuiReducer, {
    buildGuiMiddleware,
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initFullScreen,
    initPlayer
} from './reducers/gui';
import {setFullScreen, setPlayer, setEmbedded} from './reducers/mode.js';
import {activateDeck} from './reducers/cards.js';
import {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    manualUpdateProject,
    remixProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId
} from './reducers/project-state.js';
import {
    openBackdropLibrary,
    openCostumeLibrary,
    openDebugModal,
    openExtensionLibrary,
    openLoadingProject,
    openTelemetryModal,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openConnectionModal,
    openTipsLibrary,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeDebugModal,
    closeExtensionLibrary,
    closeLoadingProject,
    closeTelemetryModal,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeTipsLibrary,
    closeConnectionModal
} from './reducers/modals.js';
import {setProjectUnchanged} from './reducers/project-changed.js';
import {setStageSize} from './reducers/stage-size';

export const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

export {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    manualUpdateProject,
    remixProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    setProjectUnchanged,
    setStageSize,

    openBackdropLibrary,
    openCostumeLibrary,
    openDebugModal,
    openExtensionLibrary,
    openLoadingProject,
    openTelemetryModal,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openConnectionModal,
    openTipsLibrary,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeDebugModal,
    closeExtensionLibrary,
    closeLoadingProject,
    closeTelemetryModal,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeTipsLibrary,
    closeConnectionModal,
    
    buildGuiMiddleware,
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initPlayer,
    initFullScreen,
    initLocale,
    localesInitialState,
    setFullScreen,
    setPlayer,
    setEmbedded,
    activateDeck,
    selectLocale,
    setLocales
};
