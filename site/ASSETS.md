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

## 4K ocean motion footage

- Work: **Mavericks Beach 3 2024-03-18** by **Fastily**, recorded March 18, 2024.
- Source: https://commons.wikimedia.org/wiki/File:Mavericks_Beach_3_2024-03-18.webm
- Creator: https://commons.wikimedia.org/wiki/User_talk:Fastily
- Original: https://upload.wikimedia.org/wikipedia/commons/c/c1/Mavericks_Beach_3_2024-03-18.webm
- License: **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/ . The adapted MP4 files remain licensed CC BY-SA 4.0; visible attribution is linked from the homepage footer to `/credits/`.
- Verified original: 3840 × 2160, 60 fps, 32.950 seconds, 581,447,107 bytes; VP9 Profile 2, 10-bit HLG / BT.2020, no audio.
- Adaptation: source seconds 2–15, tone-mapped from HLG to SDR BT.709 with Hable, graded to deep blue, reduced to 30 fps, and arranged as a 12-second loop. The final second crossfades to the preceding source second so the wrap continues naturally. No upscaling; the desktop file retains the native source dimensions.
- Desktop: `assets/ocean-waves-4k.mp4`, 3840 × 2160, H.264 High / yuv420p, 12 seconds, 28,597,121 bytes. CRF 23 with 18 Mbps maximum target and 36 Mbps buffer.
- Mobile: `assets/ocean-waves-1080.mp4`, 1920 × 1080, H.264 High / yuv420p, 12 seconds, 8,006,979 bytes. Lanczos downsample, CRF 23 with 5 Mbps maximum target and 10 Mbps buffer.
- Both files use fast-start MP4 metadata and have no audio track. Playback stays on this site's origin. The shader composites the footage above the photograph's waterline; the underwater area remains the photograph with refraction and light effects.

## Half-submerged ocean photograph

Added on 2026-10-12.

- Work: **Nenue lurking below**.
- Creator: **John Burns / NOAA**, from the NOAA Office of National Marine Sanctuaries collection; photographed in Papahānaumokuākea Marine National Monument.
- Source and license record: [Wikimedia Commons — Nenue lurking below (40176628190).jpg](https://commons.wikimedia.org/wiki/File:Nenue_lurking_below_(40176628190).jpg).
- Original publication: [NOAA Office of National Marine Sanctuaries on Flickr](https://www.flickr.com/photos/onms/40176628190/).
- License: **Public domain**, recorded by Wikimedia Commons as **PD-US-NOAA** (United States government work).
- Original size: 2640 × 3960.
- `assets/waterline-ocean.webp`: 2400 × 1500. Crop from original `(0, 2050)` to `(2640, 3700)`.
- `assets/waterline-ocean-mobile.webp`: 1080 × 1620. Crop from original `(607, 1820)` to `(2033, 3960)`.
- Edits: cropping, resizing, a dark blue color grade, and WebP compression. Runtime refraction and surface motion are original WebGL effects. No generated imagery or added subjects.
- Credit: “Ocean photograph by John Burns / NOAA (public domain).”

## Fonts

All fonts are redistributed under the **SIL Open Font License 1.1**. The original license files and copyright notices are included alongside the fonts. Bebas Neue and Manrope were converted from Google Fonts' official source TTF files to WOFF2 with fontTools/Brotli; glyphs, family names, and font designs were preserved.

| Local asset | Family / weight | Official source | License copy |
|---|---|---|---|
| `assets/bebas-neue.woff2` | Bebas Neue / 400 | [google/fonts — ofl/bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue) | `assets/bebas-neue-OFL.txt` |
| `assets/manrope-latin.woff2` | Manrope / variable 200–800 | [google/fonts — ofl/manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | `assets/manrope-OFL.txt` |
| `assets/roboto-latin.woff2` | Roboto / Latin variable 100–900 | [Fontsource — Roboto](https://fontsource.org/fonts/roboto), sourced from [google/fonts — ofl/roboto](https://github.com/google/fonts/tree/main/ofl/roboto) | `assets/roboto-OFL.txt` |

Bebas Neue copyright: © 2010 Dharma Type. Manrope copyright: © 2018 The Manrope Project Authors. Despite the local `-latin` filename, the Manrope file preserves the complete official source font rather than applying a new subset.

Roboto was added on 2026-10-12 for the Material 3 interface. The Latin normal variable WOFF2 is copied unchanged from `@fontsource-variable/roboto` (`roboto-latin-wght-normal.woff2`, Google Fonts v51), with its license and copyright notice: © 2011 The Roboto Project Authors. Chinese text uses system fonts. Fontsource is only an asset source, not a site dependency.
