# Build-only Markdown dependency

- Library: [Marked](https://github.com/markedjs/marked), **16.4.2**.
- Source: official npm package `marked@16.4.2`, downloaded with `npm pack`.
- File: the package's `lib/marked.esm.js`, renamed to `marked.mjs` without changing its contents.
- License: [MIT and included notices](./marked-LICENSE.md), copied from the package.
- ESM SHA-256: `6540aa2544be84b3abdd9424fa287120e9ed7c7600512dd92c097493121a5951`.
- Package tarball SHA-256: `f8f87a61f0f9668a675309224c55a9bb96c04592bbf757de5de40af7d2dec872`.

The renderer imports this module only while building. Neither this dependency nor article Markdown is sent to the browser. There is no package installation or network request during a build. To update it, select an explicit upstream version, replace both the module and license, update this provenance, and run `node --test scripts/render-notes.test.mjs`.
