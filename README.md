# scratch-editor: The Scratch Editor Monorepo

If you'd like to use Scratch, please visit the [Scratch website](https://scratch.mit.edu/). You can build your own
Scratch project by pressing "Create" on that website or by visiting <https://scratch.mit.edu/projects/editor/>.

This is a source code repository for the packages that make up the Scratch editor and a few additional support
packages. Use this if you'd like to learn about how the Scratch editor works or to contribute to its development.

## What's in this repository?

The `packages` directory in this repository contains:

- `scratch-gui` provides the buttons, menus, and other elements that you interact with when creating and editing a
  project. It's also the "glue" that brings most of the other modules together at runtime.
- `scratch-media-lib-scripts` builds (or rebuilds) media libraries for the editor.
- `scratch-paint` provides a way to draw vector (SVG) or bitmap (PNG) images for costumes and backdrops.
- `scratch-render` draws backdrops, sprites, and clones on the stage.
- `scratch-storage` helps load project assets like images and sounds. It also provides `ScratchFetch`, a customized
  wrapper around `fetch`.
- `scratch-svg-renderer` processes SVG (vector) images for use with Scratch projects.
- `scratch-vm` is the virtual machine that runs Scratch projects.
- `task-herder` manages queues of tasks with throttling and concurrency limits.

_Please add to this list as more packages are migrated to the monorepo._

Each package has its own `README.md` file with more information about that package.

## Saving to a Solid Pod

This is the Scratch adaptor for [Satchel](https://satchel.viboko.dev), which lets a child save their projects to their
own [Solid](https://solidproject.org/) Pod. The Solid work, from logging in to where a project goes in the Pod, is done
by [`@viboko/satchel-core`](https://github.com/viboko/satchel-core); this fork only connects it to the editor:

- `packages/scratch-gui/src/containers/solid-save-modal.jsx` hands the project to satchel-core when the user saves,
  and loads it back into the editor after the Solid login.
- `packages/scratch-gui/src/components/solid-save-modal/` is the dialog that asks for a WebID.
- `canSaveToSolid` on `scratch-gui` points File > Save now at the modal (`menu-bar.jsx`, `gui.jsx`,
  `reducers/modals.js`).
- `packages/scratch-gui/dev-server/solid-client-id.js` serves Scratch's Solid-OIDC Client ID Document from the dev
  server, and `src/playground/solid-save-demo.jsx` is the `solid-save.html` page that uses it.

The end-to-end tests and the recorded demo live in [viboko/satchel-e2e](https://github.com/viboko/satchel-e2e).

### Trying it

The `canSaveToSolid` prop makes File > Save now open a modal that takes the user's WebID, runs the Solid login, and
writes the whole project, costumes and sounds included, to `scratch/<project title>.sb3` in their Pod. It adds File >
Save now by itself: don't also pass `canSave`, which makes the editor save to its own project server too. To try it
against a local [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer):

1. In a fresh clone, `just install`, then `npm run build` once. `just dev` serves `scratch-gui` from source, but
   needs the packages it uses, such as `scratch-storage`, to be built first. satchel-core is a private repository, so
   installing needs an SSH key that can read it.
2. `just css-up`, then create an account and a Pod at <http://localhost:3000/.account/>.
3. `just dev`, then `just browse-solid`.
4. Choose File > Save now, enter your WebID (for example `http://localhost:3000/<pod>/profile/card#me`), and click
   Continue.

Once you have logged in, File > Save now, and Ctrl/Cmd+S, skip the modal and overwrite `scratch/<project title>.sb3`
directly. If the session has lapsed, the editor logs in again with the WebID from your last login, then finishes the
save and restores the project; the modal comes back, with the WebID prefilled, only if that fails.

The `solidClientId` prop gives the URL of a Solid-OIDC Client ID Document that identifies Scratch to the Solid
server. Without one, Scratch registers itself with each server and the browser keeps that registration, so once the
server forgets it (after `just clean`, say) logging in fails with "Authenticating with unknown client" until the
site's storage is cleared.

### Updating satchel-core

scratch-gui depends on a tag of satchel-core. To move to a new one, tag it in satchel-core, then:

```bash
npm install --workspace=packages/scratch-gui "@viboko/satchel-core@github:viboko/satchel-core#<tag>"
```

CI installs it with the `SATCHEL_CORE_TOKEN` secret, a token that can read viboko/satchel-core.

## Monorepo migration

### What's going on?

We're migrating the Scratch editor packages into this monorepo. This will allow us to manage all the packages that
make up the Scratch editor in one place, making  it easier to manage dependencies and make changes that affect
multiple packages.

### Why are there only a few packages in this repo?

We're migrating packages in stages. The current plan, which is subject to change, has us migrating repositories in
four batches. We plan to complete the migration within 2025.

### What will happen to the existing repositories?

The existing repositories will be archived and made read-only. Those repositories contain valuable work and
information, including but not limited to issues and pull requests. We plan to keep that information available for
reference, and to selectively migrate it to this new repository.

## Thank you

Scratch would not be what it is today without help from the global community of Scratchers and open-source
contributors. Thank you for your contributions and support. _[Scratch on!](https://scratch.mit.edu/projects/65347738/fullscreen/)_

## Donate

We provide [Scratch](https://scratch.mit.edu) free of charge, and want to keep it that way! Please consider making a
[donation](https://www.scratchfoundation.org/donate) to support our continued engineering, design, community, and
resource development efforts. Donations of any size are appreciated. Thank you!
