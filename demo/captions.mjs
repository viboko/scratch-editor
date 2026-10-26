/**
 * The demo's captions, shown on screen and read out in the narration. `say` is what the voice reads, where it differs
 * from the on-screen `text`: the text-to-speech model takes its intonation from punctuation and sentence shape, so
 * spoken lines read better as varied, conversational sentences than as terse labels.
 * @type {Record<string, {text: string, say?: string}>}
 */
export const captions = {
    signUp: {
        text: 'A fresh local Solid server: sign up for an account',
        say: 'Here\'s a brand new Solid server, running locally. First, let\'s sign up for an account.'
    },
    createPod: {
        text: 'Create a Pod called "my-pod"',
        say: 'Now we create a Pod, and call it "my pod".'
    },
    webId: {
        text: 'The Pod comes with a WebID: the user\'s identity on the Solid web',
        say: 'And the Pod comes with a Web ID. That\'s our identity, on the Solid web.'
    },
    editor: {
        text: 'The Scratch editor, with Solid saving switched on',
        say: 'Over to Scratch! This is the editor, with saving to Solid switched on.'
    },
    loadProject: {
        text: 'Load a project from the computer',
        say: 'Let\'s load a project from the computer.'
    },
    run: {
        text: 'Run the project',
        say: 'Click the green flag to run it.'
    },
    walk: {
        text: 'Walk right…',
        say: 'Off we go!'
    },
    jump: {
        text: '…jump…',
        say: 'Jump!'
    },
    walkOn: {
        text: '…walk on to the satchel…',
        say: 'On to the satchel…'
    },
    pickUp: {
        text: '…and pick it up',
        say: 'and, pick it up!'
    },
    save: {
        text: 'Save the project to the Solid Pod: File > Save now',
        say: 'Now, the important bit: saving the project to our Pod. File, then Save now.'
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
        say: 'Saved! And we\'re straight back in the editor, right where we left off.'
    },
    fileManager: {
        text: 'Any Solid app can now reach the project, for example a file manager',
        say: 'Here\'s the clever part. The project isn\'t locked inside Scratch: any Solid app can reach it. ' +
            'Let\'s try a file manager.'
    },
    authoriseFileManager: {
        text: 'Authorise the file manager with the same WebID',
        say: 'Same Web ID, same Pod. We just let the file manager in.'
    },
    openPod: {
        text: 'Signed in to the file manager: open the Pod…',
        say: 'We\'re in. Let\'s open the Pod…'
    },
    openContainer: {
        text: '…then the "scratch" container…',
        say: 'then the scratch folder…'
    },
    openFile: {
        text: '…and the project Scratch saved',
        say: 'and there\'s the project that Scratch saved.'
    },
    noPreview: {
        text: 'The file manager can\'t preview a .sb3 file… but a .sb3 file is just a zip',
        say: 'The file manager doesn\'t know what an S B 3 file is. ' +
            'But here\'s the thing: an S B 3 file is just a zip.'
    },
    download: {
        text: 'Download it from the Pod…',
        say: 'So let\'s download it from the Pod…'
    },
    zipViewer: {
        text: '…and open it with an ordinary online zip tool, which knows nothing about Scratch or Solid',
        say: 'and open it with an ordinary zip tool, one that knows nothing about Scratch, or Solid.'
    },
    zipContents: {
        text: 'Inside: project.json, plus every costume and sound, named by its content hash',
        say: 'Inside, there\'s the project, and every costume and sound it uses.'
    },
    projectJson: {
        text: 'project.json holds the scripts and variables: "has satchel" is 1',
        say: 'Project dot JSON holds the scripts and the variables. And look: has satchel, is one.'
    },
    costume: {
        text: 'The costumes are ordinary image files',
        say: 'And the costumes are just ordinary pictures. Here\'s our cat, holding the satchel.'
    },
    closing: {
        text: 'The whole project, in the child\'s own Pod, open to any app they choose',
        say: 'So the whole project lives in the child\'s own Pod, open to any app they choose.'
    }
};
