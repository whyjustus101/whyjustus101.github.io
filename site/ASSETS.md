# Self-hosted visual assets

Retrieved and verified on 2026-10-11. All production images and fonts are served from this repository; page rendering does not depend on an external image or font service.

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

## Fonts

Both fonts are redistributed under the **SIL Open Font License 1.1**. The original license files and copyright notices are included alongside the fonts. Google Fonts' official source TTF files were converted to WOFF2 with fontTools/Brotli; glyphs, family names, and font designs were preserved.

| Local asset | Family / weight | Official source | License copy |
|---|---|---|---|
| `assets/bebas-neue.woff2` | Bebas Neue / 400 | [google/fonts — ofl/bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue) | `assets/bebas-neue-OFL.txt` |
| `assets/manrope-latin.woff2` | Manrope / variable 200–800 | [google/fonts — ofl/manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | `assets/manrope-OFL.txt` |

Bebas Neue copyright: © 2010 Dharma Type. Manrope copyright: © 2018 The Manrope Project Authors. Despite the local `-latin` filename, the Manrope file preserves the complete official source font rather than applying a new subset.
