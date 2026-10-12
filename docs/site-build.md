# Independent static site

The site uses plain HTML, CSS, and JavaScript in `site/`, plus Markdown notes in `content/notes/`. Use Node.js 22 or newer. No Jekyll, Ruby, npm install, or framework build is required.

```sh
node scripts/build-site.mjs
```

This copies `site/` into `dist` and renders the notes list and article pages as static HTML. Open the output through a local static server to preview. `--out <directory>` selects another output directory; relative paths are resolved from the current working directory.

The build requires `site/index.html`, `styles.css`, `main.js`, `ocean.js`, `particles.js`, and `assets/`, as well as the notes metadata, Markdown sources, and templates described below. It excludes `.git`, input build markers, and `ASSETS.md`, and writes `.nojekyll`. Check asset references and visual behavior when changing the site.

## Write and browse notes

The public list is `/notes/`. Each note has its own reading page at `/notes/<slug>/`. Both work without JavaScript; JavaScript adds list search and reading navigation. Article content is rendered during the build, so browsers do not fetch Markdown or load a Markdown parser.

To add a note, create `content/notes/<slug>.md` and add its metadata to `content/notes/index.json`:

```json
{
  "slug": "my-next-note",
  "title": "下一篇笔记",
  "date": "2026-10-11",
  "description": "一段简短的文章介绍。",
  "tags": ["Kotlin", "实践"]
}
```

The metadata file is an array. Slugs must be unique lowercase letters and digits separated by single hyphens. Dates must be valid `YYYY-MM-DD` values. Notes appear newest first. Keep the article title in metadata; start the Markdown with `##` sections so the reading page has one main heading. Every Markdown heading receives a unique, stable anchor; the directory includes second-level headings only. Fenced code blocks, lists, tables, links, and ordinary Markdown formatting are supported.

`scripts/render-notes.mjs` uses the pinned, build-only [Marked 16.4.2 module](../scripts/vendor/README.md). It escapes raw HTML and metadata, and rejects unsafe link or image schemes. HTML snippets should be written in fenced code blocks when they need code formatting. Links may use HTTP, HTTPS, email, page anchors, or relative site paths; images support HTTP, HTTPS, and relative paths. Data URLs, script URLs, protocol-relative URLs, and URLs containing raw character references are not emitted. Use ordinary `&` in Markdown URLs instead of `&amp;`.

The list and article layout templates are `scripts/templates/notes-index.html` and `scripts/templates/note-article.html`. Their shared styles and browser behavior live in `site/notes.css` and `site/notes.js`. The renderer fills template placeholders, writes the pages, and adds their canonical URLs to `sitemap.xml`, preserving existing archive entries.

After renderer changes, run the focused format, escaping, URL, path, and sitemap checks:

```sh
node --test scripts/render-notes.test.mjs
node scripts/build-site.mjs
```

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

It copies the snapshot first, overlays `site/`, and generates the current notes pages, preserving existing article and project URLs. Rebuilding without `--legacy` removes previously copied archive files from the output. The new site has no dependency on the old framework.

The publication script currently uses the fixed `gh-pages` snapshot `4f8f0932b4b577ab6570b6f4764d66d8c856b690` as its archive input. Keeping this commit pinned prevents future deployments from using their own output as the archive. Old pages retain their published HTML and assets; updating them requires an explicit migration into `site/` or `content/notes/`, or a reviewed replacement snapshot.

The original al-folio source is preserved on branch `archive/al-folio-20261011`. The personal article source in `content/notes/kotlin-coroutine.md` now renders to `/notes/kotlin-coroutine/`.

## Build directory safety

The output carries `.site-build-output`, an opaque repository marker. Only a marked directory from this repository may be cleared on a subsequent build. Existing unmarked directories, repository roots and their parents, source/output overlaps, hidden output directories, and symbolic links are rejected. Choose a new output path instead of reusing an unknown directory. The publication script excludes this marker from the published files.
