# THE VISION BONES — "We Have No Name" — Anime Music Video

## Production route (and why)
- Anime plugin (Fal) key not configured; ElevenLabs account is free tier (no video). User declined the clarifying question, so production runs autonomously on **Canva AI video, engine MiniMax H3 Max, 768p, 16:9, max 15 s per generation**.
- Character/look consistency: protagonist / moth / band reference images generated once in Canva and passed as `canva_asset` references to every generation.
- Canva output carries its own generated sound → **discarded**. The final film uses the **original song, unedited, full length (5:27.13)**.
- Assembly, grade, grain, ink transitions, the moth swarm and the **official logo reveal** (supplied PNG, untouched) are done locally with FFmpeg/ImageMagick/Python and kept as code in `tools/`.
- Lyrics: could not be transcribed in this environment (speech-model downloads blocked, no upload path to ElevenLabs Scribe). Story follows the brief + measured music structure. No lyric text appears on screen.

## Music map (measured: 123 BPM, bar ≈ 1.95 s)
| Time | Section (energy) | Story chapter |
|---|---|---|
| 0:00–0:16 | Quiet intro | 1 — City without names: black → grain → rain city aerial |
| 0:16–0:33 | Band enters, mid energy | 1 — street level, crowd, hero walks against the flow |
| 0:33–1:18 | Full band (verse/chorus 1) | 2 — The first crack: train, moth, faceless passengers, reflection, clock |
| 1:18–1:57 | Lift (chorus) | 3 — Awakening: chase through cracking city + band glimpses (silhouettes) |
| 1:57–2:03 | Drop / near silence | tunnel mouth — descent into dark |
| 2:03–2:43 | Rebuild | 4 — The city under the city: graffiti, individuals, the moth mural |
| 2:43–3:45 | Peak plateau | 5 — Music as protest: band revealed in factory hall, sound waves rise to surface, numbers vanish |
| 3:45–4:52 | Sustained high | 6 — The breaking: ink buildings, thousands of moths, mirror void, masks |
| 4:52–5:00 | Breakdown (quiet) | 7 — Twist: wakes at the start spot, grey city |
| 5:00–5:23 | Last full section | 7 — people changed, number gone, reflection smiles, moth on shoulder; camera rises |
| 5:23–5:27 | Out | 8 — moths form the logo moth → official logo + "WE HAVE NO NAME" |

## Palette arc
Cold desaturated concrete grey (ch1) → first burnt-orange accent = moth (ch2) → orange leaking into sky/walls (ch3) → amber/rust underground (ch4) → burnt orange dominant (ch5–6) → grey again but warm skin/light accents (ch7) → logo colours (ch8).

## Cast
- **The Nameless (hero)** — ~24, thin, messy black hair, tired dark eyes, worn charcoal coat, frayed grey tee, old black boots, stamped ID tag on left chest.
- **The Moth** — death's-head hawkmoth, burnt orange & black wings, cream skull mark on thorax (from logo).
- **The Vision Bones** — fictional silhouetted band: vocalist (long coat, old mic), guitarist (battered offset guitar), bassist, drummer. Shown backlit/partially until ch5.

## Shot plan
See `shots/segments.yml` (one entry per H3 generation: timing, prompt, camera, references) — that file is the source of truth for regeneration.
