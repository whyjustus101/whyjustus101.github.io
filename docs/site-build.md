# Independent static site

`site/` is the only source entry point for the new site: plain HTML, CSS, and JavaScript. Use Node.js 22 or newer. No Jekyll, Ruby, npm install, or framework build is required.

```sh
node scripts/build-site.mjs
```

This builds only `site/` into `dist`. Open it through a local static server to preview. `--out <directory>` selects another output directory; relative paths are resolved from the current working directory.

The build requires `site/index.html`, `styles.css`, `main.js`, `ocean.js`, and `assets/`. It excludes `.git`, input build markers, and `ASSETS.md`, and writes `.nojekyll`. Check asset references and visual behavior when changing the site.

## Publish with the CLI

Install Git and GitHub CLI, then sign in with `gh auth login`. Git credentials are supplied through `gh auth git-credential`; the script never reads or prints an access token. GitHub Pages must serve the root of `gh-pages` in `whyjustus101/whyjustus101.github.io`.

Prepare the build and inspect the changes:

```sh
node scripts/publish-site.mjs --dry-run
```

The script prints a temporary checkout directory. Run `git diff --cached` inside that directory to review the staged differences. Dry runs create no commit and make no push; the build and checkout remain available for inspection. Remove that temporary directory when finished reviewing it.

Publish explicitly:

```sh
node scripts/publish-site.mjs --publish
```

Both modes read the current files from the source branch, including uncommitted changes. They clone only the fixed remote's `gh-pages` branch into a fresh temporary directory, build the site, and replace files only in that temporary checkout. Publishing commits changed files as `whyjustus101 <116079361+whyjustus101@users.noreply.github.com>` and performs a normal push to `gh-pages`. There is no force push, source-branch push, or cleanup of the working source tree. If the remote advances meanwhile, the push fails; rerun after reviewing the latest state.

The old al-folio workflows have been removed. This repository currently uses the CLI process above; no new deployment workflow is configured.

## Optional published archive

The standalone build accepts an optional HTML snapshot:

```sh
node scripts/build-site.mjs --legacy ./published-snapshot --out dist
```

It copies the snapshot first and overlays `site/`, preserving existing article and project URLs. Rebuilding without `--legacy` removes previously copied archive files from the output. The new site has no dependency on the old framework.

The publication script currently uses the fixed `gh-pages` snapshot `4f8f0932b4b577ab6570b6f4764d66d8c856b690` as its archive input. Keeping this commit pinned prevents future deployments from using their own output as the archive. Old pages retain their published HTML and assets; updating them requires an explicit migration into `site/` or a reviewed replacement snapshot.

The original al-folio source is preserved on branch `archive/al-folio-20261011`. The personal article source is in `content/notes/kotlin-coroutine.md`; it is retained as editable content and is not automatically rendered by the static build.

## Build directory safety

The output carries `.site-build-output`, an opaque repository marker. Only a marked directory from this repository may be cleared on a subsequent build. Existing unmarked directories, repository roots and their parents, source/output overlaps, hidden output directories, and symbolic links are rejected. Choose a new output path instead of reusing an unknown directory. The publication script excludes this marker from the published files.
