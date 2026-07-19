import { PERSON_ART, PERSON_ROSTER } from './characters.generated'

export type { ArtState } from './characters.generated'
/** Roster (identity per gender) and art map (key per identity×state), scanned from public/characters. */
export { PERSON_ART, PERSON_ROSTER }

/** Preload entries for every portrait state of every character, fed to the SpriteSheet on boot. */
export function personSpriteEntries(): { key: string; url: string }[] {
  return Object.values(PERSON_ART).flatMap((states) =>
    Object.values(states).map((key) => ({ key, url: `/characters/${key}.webp` })),
  )
}
