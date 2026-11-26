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

`scripts/mix-soundtrack.py` cuts the music on bar lines (the source is exactly 120 BPM, the film's grid) and places every effect on the cue times in `src/config/cues.json`.
