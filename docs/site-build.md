# Ocean blog

The site uses plain HTML, CSS, and JavaScript in `site/`, plus Markdown notes in `content/notes/`. Use Node.js 22 or newer. No Jekyll, Ruby, npm install, or framework build is required.

```sh
node scripts/build-site.mjs
```

This copies `site/` into `dist` and renders the homepage article list, full article list and reading pages as static HTML. Open the output through a local static server to preview. `--out <directory>` selects another output directory; relative paths are resolved from the current working directory.

The build requires `site/index.html`, `material.css`, `styles.css`, `main.js`, `ocean.js`, `particles.js`, and `assets/`, as well as the notes metadata, Markdown sources, and templates described below. It excludes `.git`, input build markers, and `ASSETS.md`, and writes `.nojekyll`. Check asset references and visual behavior when changing the site.

`material.css` contains the shared dark palette, system font stack, base styles, and 64px navigation. The homepage adds `styles.css`; generated notes pages add `notes.css` without loading homepage styles. The historical filename is retained; the active design uses generous spacing, a full-screen ocean introduction and clean article lists and reading surfaces. No UI framework or downloaded font is a build or runtime dependency.

The homepage uses a native `<video>` element to play an 18.2-second, 30 fps HD film. The entire frame is one uninterrupted half-submerged GoPro / Telesin Dome shot from the Marina di Massa coast. Original source time 179.65–188.75 seconds is played at half speed, preserving every 60 fps source frame at 30 fps, with a uniform blue grade and proportional downscaling from the full 4K frame. The waterline, refraction, wave motion and underwater light were recorded together by the camera. The browser loops the excerpt directly. See `site/ASSETS.md` and `/credits/` for the source and attribution license. The posters are the film's first frame, so the initial crossfade has consistent framing.

`site/main.js` selects `ocean-dome-1080p.mp4` (1920 × 1080) for desktop, or `ocean-dome-720p.mp4` (1280 × 720) when the initial viewport is at most 700 CSS pixels wide, the primary pointer is coarse, or Network Information reports save-data / slow-2g / 2g / 3g. Browsers without Network Information use the display and pointer checks. Selection happens once per page load, preventing source swaps and repeat downloads during rotation or resize. No 4K video is requested or shipped with the active site.

`site/ocean.js` handles muted inline playback, first-frame reveal, manual pause, hidden-page suspension, reduced motion, autoplay denial, and cleanup. `site/main.js` also suspends the film when the hero has completely left the viewport, where the opaque content surface covers it; returning to the hero resumes according to the user's pause setting. Scroll state is initialized before playback to preserve restored framing. Hero scrolling gently enlarges the film by up to 16% and fades the heading. Particle simulation and canvas drawing are capped at 60 fps with at most 600 animated points; touch and reduced-motion modes use a static field. Motion remains elapsed-time based. Original top-down ocean assets are retained for note sharing previews.

## Write and browse articles

The public list is `/notes/`. Each note has its own reading page at `/notes/<slug>/`. Both work without JavaScript; JavaScript adds list search and reading navigation. Article content is rendered during the build, so browsers do not fetch Markdown or load a Markdown parser.

To add a note, create `content/notes/<slug>.md` and add its metadata to `content/notes/index.json`:

```json
{
  "slug": "my-next-note",
  "title": "下一篇文章",
  "date": "2026-10-11",
  "description": "一段简短的文章介绍。",
  "tags": ["Kotlin", "实践"]
}
```

The metadata file is an array. Slugs must be unique lowercase letters and digits separated by single hyphens. Dates must be valid `YYYY-MM-DD` values. Articles appear newest first. The homepage shows the five newest articles through `{{RECENT_ARTICLES}}` in `site/index.html`; `/notes/` shows all articles. Adding metadata and Markdown updates both during the build, without changing homepage markup. An empty blog shows a short placeholder message. Keep the article title in metadata; start the Markdown with `##` sections so the reading page has one main heading. Every Markdown heading receives a unique, stable anchor; the directory includes second-level headings only. Fenced code blocks, lists, tables, links, and ordinary Markdown formatting are supported.

`scripts/render-notes.mjs` uses the pinned, build-only [Marked 16.4.2 module](../scripts/vendor/README.md). It escapes raw HTML and metadata, and rejects unsafe link or image schemes. HTML snippets should be written in fenced code blocks when they need code formatting. Links may use HTTP, HTTPS, email, page anchors, or relative site paths; images support HTTP, HTTPS, and relative paths. Data URLs, script URLs, protocol-relative URLs, and URLs containing raw character references are not emitted. Use ordinary `&` in Markdown URLs instead of `&amp;`.

The list and article layout templates are `scripts/templates/notes-index.html` and `scripts/templates/note-article.html`. Their shared styles and browser behavior live in `site/notes.css` and `site/notes.js`. The renderer fills template placeholders, writes the pages, and adds their canonical URLs to `sitemap.xml`, preserving existing entries only when an optional archive was explicitly supplied. Normal publication starts with a fresh sitemap containing only the current blog.

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

## Published content

The publication script builds only the current `site/` and `content/notes/`. It does not import the previous al-folio snapshot, its demonstration posts, project/repository pages, CV, or their sitemap entries. `/blog/` forwards to `/notes/`; obsolete pages use the blog's own `404.html`. `robots.txt` points to the generated sitemap.

The original al-folio source remains on branch `archive/al-folio-20261011` and in Git history. The sole personal article from that source is preserved in `content/notes/kotlin-coroutine.md` and published at `/notes/kotlin-coroutine/`. It had no generated article URL in the old snapshot.

For manual archival work, the build still accepts `--legacy <published-snapshot>`; this option overlays current files on a supplied snapshot. Do not use it for normal blog publication, as it would reintroduce that snapshot's pages and sitemap entries.

## Build directory safety

The output carries `.site-build-output`, an opaque repository marker. Only a marked directory from this repository may be cleared on a subsequent build. Existing unmarked directories, repository roots and their parents, source/output overlaps, hidden output directories, and symbolic links are rejected. Choose a new output path instead of reusing an unknown directory. The publication script excludes this marker from the published files.
