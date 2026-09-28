import React from 'react';
import ReactDomClient from 'react-dom/client';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';

import styles from './index.css';

const onClickLogo = () => {
    window.location = 'https://scratch.mit.edu';
};

const appTarget = document.createElement('div');
appTarget.className = styles.app;
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);

const WrappedGui = AppStateHOC(HashParserHOC(GUI), false);

const root = ReactDomClient.createRoot(appTarget);
root.render(
    <WrappedGui
        canEditTitle
        canSave
        canSaveToSolid
        onClickLogo={onClickLogo}
    />
);
