import React from 'react';
import ReactDomClient from 'react-dom/client';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import {localDiskConfigFactory} from '../local-disk-config';

const onClickLogo = () => {
    window.location = 'https://scratch.mit.edu';
};

const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);

// `compose` isn't used here (unlike render-gui.jsx) because AppStateHOC needs
// a third argument, `configFactory`, to use LocalDiskStorage instead of the
// default `legacyConfig` -- `compose` only threads a single value through.
const WrappedGui = AppStateHOC(HashParserHOC(GUI), false, localDiskConfigFactory);

const root = ReactDomClient.createRoot(appTarget);
root.render(
    <WrappedGui
        canEditTitle
        canSave
        canCreateNew
        onClickLogo={onClickLogo}
    />
);
