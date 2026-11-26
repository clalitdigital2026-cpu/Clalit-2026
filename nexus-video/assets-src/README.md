# Sound sources

Generated in ElevenLabs for this film (instrumental, no vocals). To keep them in the project: download from the account flow "NEXUS launch score".

| File | Model | Description |
|---|---|---|
| `music/take-b.mp3` | eleven_music_v2_5, 90 s | Contemporary cinematic electronic score, 120 BPM: ambient opening, felt piano and pulse, string tension, a big hit and chord bloom, driving groove, peak, emotional anthem, hopeful final chord |
| `sfx/impact.mp3` | eleven_text_to_sound_v3 | Deep cinematic sub-bass impact with an airy tail |
| `sfx/whoosh.mp3` | eleven_text_to_sound_v3 | Soft, clean airy whoosh |
| `sfx/riser.mp3` | eleven_text_to_sound_v3 | Airy tonal riser, 3 s, peaks at the end |
| `sfx/reverse-swell.mp3` | eleven_text_to_sound_v3 | Reverse cymbal swell |
| `sfx/heartbeat.mp3` | eleven_text_to_sound_v3 | Soft, deep heartbeat |
| `sfx/logo-sting.mp3` | eleven_text_to_sound_v3 | Warm, glassy logo bloom with a soft sub |
| `sfx/data-stream.mp3` | eleven_text_to_sound_v3 (loop) | Flowing digital data, an airy granular shimmer: continuous beds under the particles and the event flow |
| `sfx/particles-assemble.mp3` | eleven_text_to_sound_v3 | Particles swirling and converging: text and logo assembly |
| `sfx/particles-disperse.mp3` | eleven_text_to_sound_v3 | A granular dissolve: text returning to the stream |
| `sfx/swipe.mp3` | eleven_text_to_sound_v3 | A sleek swipe with a crisp digital edge: wipes and cuts |
| `sfx/data-tap.mp3` | eleven_text_to_sound_v3 | A soft, muted tactile tap: moments of care, systems reacting |
| `sfx/connect-lock.mp3` | eleven_text_to_sound_v3 | A soft magnetic snap: connections, modules, the event |
| `sfx/energy-wave.mp3` | eleven_text_to_sound_v3 | A deep shockwave: the meeting point, the split, the great pulse |
| `sfx/digital-morph.mp3` | eleven_text_to_sound_v3 | A crisp granular morph: מידע → EVENT, the tangle resolving |
| `sfx/fly-by.mp3` | eleven_text_to_sound_v3 | A deep cinematic fly-by: camera moves |
| `sfx/freeze-stop.mp3` | eleven_text_to_sound_v3 | A tape stop into silence: the freeze |
| `sfx/shimmer.mp3` | eleven_text_to_sound_v3 | A soft glint of light over glass: logo and wordmark sweeps |

`scripts/mix-soundtrack.py` cuts the music on bar lines (the source is exactly 120 BPM, the film's grid) and places every effect on the cue times in `src/config/cues.json`: about 165 point events, plus continuous data-flow beds panned with the motion (right → left). Run with `STEMS=<dir>` to also write the music and effects stems as `.npy` files for checking the balance.
