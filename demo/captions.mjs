/**
 * The demo's captions, shown on screen and read out in the narration. `say` replaces `text` for the voice where the
 * written form reads badly aloud.
 * @type {Record<string, {text: string, say?: string}>}
 */
export const captions = {
    signUp: {text: 'A fresh local Solid server: sign up for an account'},
    createPod: {text: 'Create a Pod called "my-pod"', say: 'Create a Pod called "my pod".'},
    webId: {
        text: 'The Pod comes with a WebID: the user\'s identity on the Solid web',
        say: 'The Pod comes with a Web ID: the user\'s identity on the Solid web.'
    },
    editor: {text: 'The Scratch editor, with Solid saving switched on'},
    loadProject: {text: 'Load a project from the computer'},
    run: {text: 'Run the project'},
    walk: {text: 'Walk right…'},
    jump: {text: '…jump…'},
    walkOn: {text: '…walk on to the satchel…'},
    pickUp: {text: '…and pick it up'},
    save: {
        text: 'Save the project to the Solid Pod: File > Save now',
        say: 'Now save the project to the Solid Pod, with File, Save now.'
    },
    enterWebId: {
        text: 'Enter the WebID to log in to the Solid provider',
        say: 'Enter the Web ID to log in to the Solid provider.'
    },
    authoriseScratch: {text: 'The Solid provider asks the user to authorise Scratch'},
    saved: {text: 'Saved, and the project is back in the editor'},
    fileManager: {text: 'Any Solid app can now reach the project, for example a file manager'},
    authoriseFileManager: {
        text: 'Authorise the file manager with the same WebID',
        say: 'Authorise the file manager with the same Web ID.'
    },
    openPod: {text: 'Signed in to the file manager: open the Pod…'},
    openContainer: {text: '…then the "scratch" container…'},
    openFile: {text: '…and the project Scratch saved'},
    readBack: {text: 'The saved project, read back from the Pod by another Solid app'}
};
