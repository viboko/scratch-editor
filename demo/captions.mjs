/**
 * The demo's narration, line by line. Each line is read out by the voice and shown, word for word, as a subtitle.
 * The text-to-speech model takes its intonation from punctuation and sentence shape, so the lines read best as
 * varied, conversational sentences, written the way they should be said.
 * @type {Record<string, string>}
 */
export const captions = {
    intro: 'Let\'s demo how we could use Satchel, to save a Scratch project to a Solid Pod.',
    signUp: 'Here\'s a brand new Solid server, running locally. First, let\'s sign up for an account.',
    createPod: 'Now we create a Pod, and call it "my-pod".',
    webId: 'And the Pod comes with a Web ID. That\'s our identity, on the Solid web.',
    editor: 'Over to Scratch! This is the editor, with saving to Solid switched on.',
    loadProject: 'Let\'s load a project from the computer.',
    run: 'Click the green flag to run it.',
    walk: 'Off we go!',
    jump: 'Jump!',
    walkOn: 'On to the satchel…',
    pickUp: 'and, pick it up!',
    save: 'Now, the important bit: saving the project to our Pod. File, then Save now.',
    enterWebId: 'Scratch asks for our Web ID, so it knows where to log us in.',
    authoriseScratch: 'The Solid server checks with us: is Scratch allowed to save here? Yes, it is.',
    saved: 'Saved! And we\'re straight back in the editor, right where we left off.',
    fileManager: 'Here\'s the clever part. The project isn\'t locked inside Scratch: any Solid app can reach it. ' +
        'Let\'s try a file manager.',
    authoriseFileManager: 'Same Web ID, same Pod. We just let the file manager in.',
    openPod: 'We\'re in. Let\'s open the Pod…',
    openContainer: 'then the scratch folder…',
    openFile: 'and there\'s the project that Scratch saved.',
    noPreview: 'The file manager doesn\'t know what a Scratch file is. But here\'s the thing: a Scratch file is just ' +
        'a zip.',
    download: 'So let\'s download it from the Pod…',
    zipViewer: 'and open it with an ordinary zip tool, one that knows nothing about Scratch, or Solid.',
    zipContents: 'Inside, there\'s the project, and every costume and sound it uses.',
    projectJson: 'The project file holds the scripts and the variables. And look: "has satchel" is 1.',
    costume: 'And the costumes are just ordinary pictures. Here\'s our cat, holding the satchel.',
    closing: 'So the whole project lives in the child\'s own Pod, open to any app they choose.'
};
