# NEXUS – סרטון השקה | Clalit launch film

סרטון השקה קולנועי (90 שניות, 1920×1080 ב‑60fps, עם אפשרות ל‑4K) לפלטפורמת הנתונים NEXUS של כללית.
הסרטון בנוי ב‑**Remotion + React + TypeScript**. כל ההמחשות מצוירות בקוד (Canvas2D עם מצלמת פרספקטיבה תלת‑ממדית, SVG ו‑DOM),
הפסקול הוא מוזיקה מקורית ואפקטים שנוצרו ב‑ElevenLabs, ערוכים לתמונה על ידי סקריפט לפי ציר הזמן של הסרטון.

## Quick start

```bash
npm install
npm run studio          # interactive preview in the browser (timeline, every scene separately)
npm run render          # → out/nexus-launch.mp4      (1920×1080, 60fps, H.264)
npm run render:4k       # → out/nexus-launch-4k.mp4   (3840×2160, 60fps)
npm run music           # re-edit and re-mix public/audio/nexus-score.wav from the cue sheet (needs ffmpeg + numpy)
```

Render a single scene, for example: `npx remotion render src/index.ts Scene-architecture out/architecture.mp4`

## Structure

| Path | What it holds |
|---|---|
| `src/config/config.ts` | **Central settings**: texts, colours, fonts, animation speed, glow strength, particle counts, grain/vignette, logo files, music, voiceover, resolution |
| `src/config/cues.json` | Scene lengths and every sync point (seconds). The visuals **and** the music generator both read it |
| `src/config/lockup.json` | Geometry of the original NEXUS logo, measured from the supplied artwork, used to rebuild it exactly |
| `src/scenes/S1…S9*.tsx` | One independent component per scene |
| `src/components/ParticleType.tsx` | Typography and logos assembled from data particles (morph, dissolve) |
| `src/components/Kinetic.tsx` | RTL-safe kinetic typography (the word order comes from the browser's bidi engine) |
| `src/lib/*` | Perspective camera, deterministic random/noise, glow sprites, icon set, fonts, timing |
| `scripts/mix-soundtrack.py` | Edits the score to picture on bar lines, places the sound design on the cues, sidechain and mastering |
| `assets-src/` | Source music and sound effects generated in ElevenLabs (see `assets-src/README.md`) |
| `scripts/extract-logos.py` | Builds transparent logo layers from the supplied brand images |
| `public/logos`, `public/fonts` | Logo layers and the Heebo/Inter fonts (bundled locally, so rendering works offline) |

## Scenes

| # | Time | Scene | Look |
|---|---|---|---|
| 1 | 00:00–00:08 | A world that never stops producing data: heartbeat, particle field, places of care | dark |
| 2 | 00:08–00:17 | Every moment is an event: six moments of care, packets, מידע → EVENT | light |
| 3 | 00:17–00:25 | The challenge: separate systems, tangled links, freeze, the question | dark |
| 4 | 00:25–00:33 | NEXUS revealed: two streams meet, energy wave, symbol and wordmark | dark → light |
| 5 | 00:33–00:49 | How it works: a dive into the symbol, then 4 layers from right to left (Sources → Kafka → Processing/Unification/Quality → MongoDB → Kafka → GCP/Azure/AWS/Clalit) | dark |
| 6 | 00:49–01:02 | Event-driven: LAB RESULT AVAILABLE → NEXUS → 5 systems in parallel (labelled as a possible future scenario) | light → dark |
| 7 | 01:02–01:15 | What it will enable: 7 benefits, each with its own visual, plus REAL-TIME / CONNECTED / SCALABLE / AI-READY on the beat | alternating |
| 8 | 01:15–01:24 | The rules of the game change: a network over an abstract map of Israel (points only, no borders) | dark |
| 9 | 01:24–01:30 | Signature: the streams become the symbol, the original logo, the slogan, Clalit and the division | light |

## Editing

- **Texts**: `TEXT` in `config.ts`.
- **Scene length or sync point**: `cues.json`. Then run `npm run music` so the sound follows. The music edit points are in the `EDIT` list in `scripts/mix-soundtrack.py`.
- **Draft speed**: in `config.ts`, set `FX.particleDensity = 0.5`, or render with `--scale=0.5`.
- **Voiceover**: put a file in `public/audio/` and set `ASSETS.voiceover` to it. It plays as a separate track under the music.
- **Logos**: the files in `public/logos` were extracted from the supplied images (`python3 scripts/extract-logos.py <nexus.jpg> <clalit.png>`). To use official vector/PNG files, replace the files and keep the names.

## Notes on content

- No real data or numbers appear. All medical values are abstract (bars only), and nothing identifies a patient.
- Kafka is shown only as the event-streaming backbone. Processing, unification and quality happen in layer 02.
- AI Factory, BigQuery and the AI tools appear as **complementary capabilities** within the broader DATA & AI & BI strategy, inside a separate dashed frame, not as part of NEXUS.
- Scene 6 is labelled "תרחיש עתידי אפשרי · להמחשה" (a possible future scenario, for illustration).
