# Self-hosted visual assets

Retrieved and verified from 2026-10-11 through 2026-10-13. Production media is served from this repository. The current interface uses installed system fonts and does not request font files. Project illustrations are original HTML, CSS and SVG; no Apple product images, logos or font files are included in the redesign.

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

## Single-shot HD ocean film

Updated on 2026-10-13. The entire moving background is one uninterrupted, real half-submerged camera shot. The waterline, sea surface, underwater rocks, optical refraction and moving sunlight were captured together in Marina di Massa, Tuscany, Italy.

- Work: **GOPRO, KARMA DRONE & TELESIN DOME - Above the water...Underwater, FOOTAGE 4K Tuscany**, by **XTOM CICOS - Tech**, published August 1, 2020. [Original publication](https://www.youtube.com/watch?v=4Hw1jdKvRGc), [creator](https://www.youtube.com/@XTOMCICOS).
- Capture evidence: the creator describes “Shooting with Gopro hero 7 black on Gopro Karma drone and Telesin Dome in 4k Ultra HD.” The selected passage is a Telesin Dome waterline shot. The original 3840 × 2160, 60 fps VP9 / yuv420p / BT.709 stream was downloaded without resizing and decoded to verify dimensions and distinct frames.
- License: the source watch page explicitly labels the work **“Creative Commons Attribution license (reuse allowed)”** and links [YouTube's CC license information](https://www.youtube.com/t/creative_commons). The label itself does not specify a version. Current [official YouTube help](https://support.google.com/youtube/answer/2797468) links CC BY 4.0; the credits preserve the source's version-unspecified CC BY label. The adapted excerpt and first-frame posters retain that attribution license. `/credits/` identifies the author, work, source, license and modifications.
- Selected original interval: **179.65–188.75 seconds** (02:59.65–03:08.75), 9.1 seconds of continuous footage, ending before the source's next cut at approximately 188.9 seconds. Visual inspection confirmed continuous camera movement and water refraction throughout this passage. Other sections of the full upload contain cuts and dissolves and are not included.
- Downloaded source excerpt: original seconds 175–190, 3840 × 2160 / 60 fps, remuxed unchanged to MP4, 50,012,615 bytes. SHA-256: `7bdfa542d558342b1a8e21e3dec22bc6cd5ddbdf8e155751f85a30f0f08ca056`. The selected local frame range is 279 through 824, inclusive.
- Both HD outputs are **30 fps, 18.2 seconds**, H.264 High / yuv420p, SDR BT.709, no audio, fast-start metadata. Every one of the 546 selected source frames appears once, producing smooth half-speed playback without frame interpolation. The full source frame is proportionally downscaled using Lanczos. Desktop loads 1080p; screens at most 700 CSS pixels wide, coarse-pointer devices, save-data connections, and reported slow-2g / 2g / 3g networks load 720p. The selection is made once per page load. The previous 42,658,315-byte 4K output has been removed from the active site.
- `assets/ocean-dome-1080p.mp4`: **1920 × 1080**, 6,105,342 bytes (85.7% smaller than the former 4K background). SHA-256: `6165fdd705206da4c74e238bb1eed25bc4fa6b7f9890d63e4eb7986be40d5f00`. H.264 level 4.0, CRF 23, 2.6 Mbps maximum rate / 5.2 Mbps buffer.
- `assets/ocean-dome-720p.mp4`: **1280 × 720**, 2,824,580 bytes (93.4% smaller). SHA-256: `0f0853fe17a0731de074dd18b1ff89a1dc01b242d27af4100729adec8bbeb937`. H.264 level 3.1, CRF 24, 1.2 Mbps maximum rate / 2.4 Mbps buffer.
- Color treatment applies uniformly to the complete frame: `colorchannelmixer=rr=0.62:gg=0.78:bb=0.96,eq=contrast=1.03:brightness=-0.035:saturation=0.9:gamma=0.92`. Encoding uses libx264, preset medium, and a 60-frame keyframe interval. There is no spatial compositing, generated waterline, added wave motion, or temporal dissolve. The native video player loops the straight excerpt.
- Posters: `assets/ocean-hd-poster.webp` (1920 × 1080, 80,142 bytes) and `assets/ocean-hd-poster-mobile.webp` (506 × 1080 center crop, 21,430 bytes). Both are quality-80 WebP encodings of the 1080p film's first frame, used only before playback, when playback fails, or for reduced motion. Only the mobile still is cropped; both videos retain the full source composition.
- The source downloads and editing intermediates are not needed to build the website. The normal build copies the committed MP4 and WebP assets without ffmpeg.

## Fonts

The following licensed fonts are retained from earlier layouts. The current system-font interface does not load or preload them.

All fonts are redistributed under the **SIL Open Font License 1.1**. The original license files and copyright notices are included alongside the fonts. Bebas Neue and Manrope were converted from Google Fonts' official source TTF files to WOFF2 with fontTools/Brotli; glyphs, family names, and font designs were preserved.

| Local asset | Family / weight | Official source | License copy |
|---|---|---|---|
| `assets/bebas-neue.woff2` | Bebas Neue / 400 | [google/fonts — ofl/bebasneue](https://github.com/google/fonts/tree/main/ofl/bebasneue) | `assets/bebas-neue-OFL.txt` |
| `assets/manrope-latin.woff2` | Manrope / variable 200–800 | [google/fonts — ofl/manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | `assets/manrope-OFL.txt` |
| `assets/roboto-latin.woff2` | Roboto / Latin variable 100–900 | [Fontsource — Roboto](https://fontsource.org/fonts/roboto), sourced from [google/fonts — ofl/roboto](https://github.com/google/fonts/tree/main/ofl/roboto) | `assets/roboto-OFL.txt` |

Bebas Neue copyright: © 2010 Dharma Type. Manrope copyright: © 2018 The Manrope Project Authors. Despite the local `-latin` filename, the Manrope file preserves the complete official source font rather than applying a new subset.

Roboto was added on 2026-10-12 for the Material 3 interface. The Latin normal variable WOFF2 is copied unchanged from `@fontsource-variable/roboto` (`roboto-latin-wght-normal.woff2`, Google Fonts v51), with its license and copyright notice: © 2011 The Roboto Project Authors. Chinese text uses system fonts. Fontsource is only an asset source, not a site dependency.
