# Cafe work sounds

The user selected these recordings on 2026-09-25 after auditioning local samples. The existing bell is retained unchanged. Other files are edited from the sources' publicly available HQ MP3 previews, **not their original WAV downloads**. Source license labels are recorded below; the user deferred the usage-rights review to a later step.

| File                | Original sound                               | Creator / source                                                                                     | Source license label                                            |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `bell.wav`          | `bell_02.ogg`                                | rubberduck · [100 CC0 SFX](https://opengameart.org/node/85570)                                       | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)   |
| `steam-machine.wav` | steam 1 · 723045                             | [casadalenha](https://freesound.org/people/casadalenha/sounds/723045/)                               | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)       |
| `steam-milk.wav`    | frothing milk 3 · 723035                     | [casadalenha](https://freesound.org/people/casadalenha/sounds/723035/)                               | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)       |
| `pour-cup.wav`      | pouring liquid · 723044                      | [casadalenha](https://freesound.org/people/casadalenha/sounds/723044/)                               | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)       |
| `pour-milk.wav`     | pouring milk in to metal jug.wav · 628846    | [greatsoundstube](https://freesound.org/people/greatsoundstube/sounds/628846/)                       | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)   |
| `espresso.wav`      | Coffee machine pouring espresso.wav · 628845 | [greatsoundstube](https://freesound.org/people/greatsoundstube/sounds/628845/)                       | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)   |
| `ice-cubes.wav`     | Putting ice cubes into glassWAV · 377995     | [13GPanska_Gorbusinova_Anna](https://freesound.org/people/13GPanska_Gorbusinova_Anna/sounds/377995/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)   |
| `wipe-table.wav`    | Wiping A Table · 766836                      | [241378](https://freesound.org/people/241378/sounds/766836/)                                         | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |

## Editing

The new files use 48,000 Hz, 16-bit PCM WAV while preserving the preview's channel count. Resampling does not restore quality lost in the source MP3. DC offset was removed, gain was adjusted for auditioning (RMS target 0.085, peak ceiling 0.7, gain capped at +12 dB), and 25 ms edge fades were applied. Continuous sounds additionally use an 80 ms wrap crossfade to avoid abrupt loop boundaries. Playback speed is unchanged for the new recordings.

| File                | Preview excerpt, before wrap crossfade | Audition gain | Installed duration |
| ------------------- | -------------------------------------- | ------------- | ------------------ |
| `steam-machine.wav` | 3–10 seconds                           | +6.9 dB       | 6.92 seconds       |
| `steam-milk.wav`    | 8–16 seconds                           | +6.9 dB       | 7.92 seconds       |
| `pour-cup.wav`      | 0.4–6.4 seconds                        | −1.7 dB       | 5.92 seconds       |
| `pour-milk.wav`     | 0.15–3.75 seconds                      | +12 dB        | 3.52 seconds       |
| `espresso.wav`      | 3–11 seconds                           | +12 dB        | 7.92 seconds       |
| `ice-cubes.wav`     | Full 2.652-second preview              | −2.1 dB       | 2.652 seconds      |
| `wipe-table.wav`    | 0.6–6.6 seconds                        | +0.1 dB       | 5.92 seconds       |

The bell was retrieved on 2026-09-24 from the [rubberduck archive](https://opengameart.org/sites/default/files/100-CC0-SFX_0.zip), converted to mono 22,050 Hz / 16-bit PCM, normalized to a 0.6 peak and faded at the edges. Its file is unchanged by this replacement.

## In-game use

- Steam alternates between the machine and milk-frothing recordings when a steam loop starts.
- Pouring into a cup and measuring dairy into a pitcher use separate recordings. Espresso extraction has its own loop.
- Real ice sounds play only when scooping ice; powder topping is silent.
- The wiping recording plays while wiping a table, condiment bar or worktop.
- Meter targets, confirmations, tickets, labels, cup/tool handling, bean pouring, washing and garbage collection have no additional cue. Nearby running machines can still be heard.
- Completed work and drink handoff retain the bell. The sound preview plays the bell.
