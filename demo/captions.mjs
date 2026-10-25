/**
 * The demo's captions, shown on screen and read out in the narration. `say` is what the voice reads, where it differs
 * from the on-screen `text`: the text-to-speech model takes its intonation from punctuation and sentence shape, so
 * spoken lines read better as varied, conversational sentences than as terse labels. `speed` (default 1) slows key
 * moments down and speeds asides up.
 * @type {Record<string, {text: string, say?: string, speed?: number}>}
 */
export const captions = {
    signUp: {
        text: 'A fresh local Solid server: sign up for an account',
        say: 'Here\'s a brand new Solid server, running locally. First, let\'s sign up for an account.'
    },
    createPod: {
        text: 'Create a Pod called "my-pod"',
        say: 'Now we create a Pod, and call it "my pod".',
        speed: 1.05
    },
    webId: {
        text: 'The Pod comes with a WebID: the user\'s identity on the Solid web',
        say: 'And the Pod comes with a Web ID. That\'s our identity, on the Solid web.',
        speed: 0.92
    },
    editor: {
        text: 'The Scratch editor, with Solid saving switched on',
        say: 'Over to Scratch! This is the editor, with saving to Solid switched on.'
    },
    loadProject: {
        text: 'Load a project from the computer',
        say: 'Let\'s load a project from the computer.',
        speed: 1.08
    },
    run: {
        text: 'Run the project',
        say: 'Click the green flag to run it.',
        speed: 1.08
    },
    walk: {
        text: 'Walk right…',
        say: 'Off we go!',
        speed: 1.1
    },
    jump: {
        text: '…jump…',
        say: 'Jump!',
        speed: 1.1
    },
    walkOn: {
        text: '…walk on to the satchel…',
        say: 'On to the satchel…',
        speed: 1.05
    },
    pickUp: {
        text: '…and pick it up',
        say: 'and, pick it up!',
        speed: 1.05
    },
    save: {
        text: 'Save the project to the Solid Pod: File > Save now',
        say: 'Now, the important bit: saving the project to our Pod. File, then Save now.',
        speed: 0.95
    },
    enterWebId: {
        text: 'Enter the WebID to log in to the Solid provider',
        say: 'Scratch asks for our Web ID, so it knows where to log us in.'
    },
    authoriseScratch: {
        text: 'The Solid provider asks the user to authorise Scratch',
        say: 'The Solid server checks with us: is Scratch allowed to save here? Yes, it is.'
    },
    saved: {
        text: 'Saved, and the project is back in the editor',
        say: 'Saved! And we\'re straight back in the editor, right where we left off.',
        speed: 0.95
    },
    fileManager: {
        text: 'Any Solid app can now reach the project, for example a file manager',
        say: 'Here\'s the clever part. The project isn\'t locked inside Scratch: any Solid app can reach it. ' +
            'Let\'s try a file manager.',
        speed: 0.95
    },
    authoriseFileManager: {
        text: 'Authorise the file manager with the same WebID',
        say: 'Same Web ID, same Pod. We just let the file manager in.'
    },
    openPod: {
        text: 'Signed in to the file manager: open the Pod…',
        say: 'We\'re in. Let\'s open the Pod…',
        speed: 1.05
    },
    openContainer: {
        text: '…then the "scratch" container…',
        say: 'then the scratch folder…',
        speed: 1.05
    },
    openFile: {
        text: '…and the project Scratch saved',
        say: 'and there\'s the project that Scratch saved.'
    },
    readBack: {
        text: 'The saved Scratch project, found in the Pod by another Solid app',
        say: 'There it is: the very same Scratch project, found in the Pod, by a completely different app.',
        speed: 0.92
    }
};
