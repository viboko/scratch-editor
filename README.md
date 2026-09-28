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

## Adding Solid storage

See [`packages/scratch-gui/dev-server/README.md`](packages/scratch-gui/dev-server/README.md).

### Saving to a Solid Pod

The `canSaveToSolid` prop on `scratch-gui` makes File > Save now open a modal that takes the user's WebID, runs the
Solid login, and writes the project JSON to `scratch/<project title>.json` in their Pod. To try it against a local
[Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer):

1. `just css-up`, then create an account and a Pod at <http://localhost:3000/.account/>.
2. `just dev`, then `just browse-solid`.
3. Choose File > Save now, enter your WebID (for example `http://localhost:3000/<pod>/profile/card#me`), and click
   Continue.

Solid login redirects the whole page, so the editor stashes the project in IndexedDB first and restores it when the
login returns.

Once you have logged in, File > Save now, and Ctrl/Cmd+S, skip the modal and overwrite
`scratch/<project title>.json` directly. The previous session is restored across page loads.

Solid sessions are short-lived: the library can only refresh one that came from a full login, and one restored after
a page load ends when its access token does. When a save finds the session gone or rejected, the editor logs in again
with the WebID from your last login instead of asking for it, then finishes the save and restores the project. That
round trip goes through your identity provider, which may show its own sign-in or consent page. The modal comes back,
with the WebID prefilled, only if that fails.

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
