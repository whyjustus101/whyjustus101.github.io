# Self-hosted visual assets

Retrieved and verified from 2026-10-11 through 2026-10-13. All production video, images and fonts are served from this repository; page rendering does not depend on an external image or font service.

## Ocean photograph

- Work: **Ocean Foam** (2016-06-15)
- Photographer: **Jeremy Bishop**, listed by the source as `tidesinourveins`
- Source and license record: [Wikimedia Commons — Ocean Foam (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Ocean_Foam_(Unsplash).jpg)
- Original photo page: <https://unsplash.com/photos/C-opW0i5McE>
- Downloaded original: <https://upload.wikimedia.org/wikipedia/commons/e/e1/Ocean_Foam_%28Unsplash%29.jpg>
- License: **[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)**, as recorded in the Wikimedia Commons file page and its `imageinfo` extended metadata (`LicenseShortName: CC0`, `UsageTerms: Creative Commons Zero, Public Domain Dedication`, `AttributionRequired: false`). This is a historical Unsplash CC0 photograph, not an Unsplash+ asset. The Commons record also links a [2017-05-05 archive of the original photo page](https://web.archive.org/web/20170505080434/https%3A//unsplash.com/photos/C-opW0i5McE).
- Local derivatives:
  - `assets/ocean-surface.webp`: 2400 × 1600, 536,776 bytes; original resized and encoded to WebP (quality 85).
  - `assets/ocean-surface-mobile.webp`: 1080 × 1560, 208,896 bytes; portrait crop of the same photograph, WebP (quality 82).
- Edits: resizing, portrait crop for the mobile variant, WebP compression; no generated elements or retouching.
- Suggested credit: “Ocean photograph by Jeremy Bishop, via Wikimedia Commons (CC0).”

## Full-scene 4K ocean film

Updated on 2026-10-13. The entire moving background is a finished video assembled from two real 4K recordings. It is a composite, not one continuous half-submerged camera shot. No still photograph is used inside the playing film.

- Output: `assets/ocean-full-4k.mp4`, 3840 × 2160, 30 fps, 10 seconds, 24,188,345 bytes, H.264 High / yuv420p, SDR BT.709, no audio, fast-start metadata. All devices load this same 4K file.
- Above water: **Mavericks Beach 3 2024-03-18**, by **Fastily**, recorded March 18, 2024. [Source](https://commons.wikimedia.org/wiki/File:Mavericks_Beach_3_2024-03-18.webm), [creator](https://commons.wikimedia.org/wiki/User_talk:Fastily), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Original: 3840 × 2160, 60 fps, 32.950 seconds, 581,447,107 bytes, VP9 Profile 2, HLG / BT.2020. The source was tone-mapped with Hable and graded blue; the horizon is positioned using a 3840 × 1200 crop starting at y=960 from the graded footage.
- Below water: **Discovering Tenggol: Aerial Views and Submerged Delights in 4K**, by **Steven Lee**, recorded July 6, 2023. [Original publication](https://www.youtube.com/watch?v=VIVrRWn4vZY), [creator](https://www.youtube.com/@stevenlsw), [Commons license record](https://commons.wikimedia.org/wiki/File:Discovering_Tenggol-_Aerial_Views_and_Submerged_Delights_in_4K.webm), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The author's native 3840 × 2160 VP9 / 29.97 fps stream was downloaded and decoded to verify resolution. This uses the continuous 1160.5–1167 second reef-and-fish shot, slowed to fit 11 seconds and graded blue. Narrow source pillarbox edges are cropped by 16 pixels on each side before fitting the 4K frame; the visible underwater window is a 3840 × 1400 crop starting at y=160, positioned at output y=760.
- Editing: the two filmed regions are joined with a gently moving, feathered waterline mask. A one-second crossfade joins the end to the beginning, producing a 10-second loop. Pixel content on both sides comes from moving footage; the waterline is an editing mask.
- Adapted film and first-frame posters are distributed under **CC BY-SA 4.0**, with both authors and original licenses credited on `/credits/`.
- Posters: `assets/ocean-full-poster.webp` (3840 × 2160) and `assets/ocean-full-poster-mobile.webp` (1080 × 2160 center crop). Both are WebP encodings of the film's first frame, used only before playback, when playback fails, or for reduced motion.
- The source downloads and editing intermediates are not needed to build the website. The normal build copies the committed MP4 and WebP assets without ffmpeg.

## Fonts

All fonts are redistributed under the **SIL Open Font License 1.1**. The original license files and copyright notices are included alongside the fonts. Bebas Neue and Manrope were converted from Google Fonts' official source TTF files to WOFF2 with fontTools/Brotli; glyphs, family names, and font designs were preserved.

| Local asset | Family / weight | Official source | License copy |
|---|---|---|---|
| `assets/bebas-neue.woff2` | Bebas Neue / 400 | [google/fonts — ofl/bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue) | `assets/bebas-neue-OFL.txt` |
| `assets/manrope-latin.woff2` | Manrope / variable 200–800 | [google/fonts — ofl/manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | `assets/manrope-OFL.txt` |
| `assets/roboto-latin.woff2` | Roboto / Latin variable 100–900 | [Fontsource — Roboto](https://fontsource.org/fonts/roboto), sourced from [google/fonts — ofl/roboto](https://github.com/google/fonts/tree/main/ofl/roboto) | `assets/roboto-OFL.txt` |

Bebas Neue copyright: © 2010 Dharma Type. Manrope copyright: © 2018 The Manrope Project Authors. Despite the local `-latin` filename, the Manrope file preserves the complete official source font rather than applying a new subset.

Roboto was added on 2026-10-12 for the Material 3 interface. The Latin normal variable WOFF2 is copied unchanged from `@fontsource-variable/roboto` (`roboto-latin-wght-normal.woff2`, Google Fonts v51), with its license and copyright notice: © 2011 The Roboto Project Authors. Chinese text uses system fonts. Fontsource is only an asset source, not a site dependency.
