export interface Archetype {
  key: string
  label: string
  /** Fallback glyph shown until the WebP art at public/characters/alien-<key>.webp is added. */
  emoji: string
}

/** The aliens are people — a spread of looks. Each maps to public/characters/alien-<key>.webp. */
export const ALIEN_ARCHETYPES: Archetype[] = [
  { key: 'beautiful', label: '아름다운', emoji: '💃' },
  { key: 'cute', label: '귀여운', emoji: '🧒' },
  { key: 'cool', label: '쿨한', emoji: '😎' },
  { key: 'ugly', label: '못생긴', emoji: '😬' },
  { key: 'chubby', label: '뚱뚱한', emoji: '🧑' },
  { key: 'macho', label: '마초', emoji: '💪' },
  { key: 'nerd', label: '너드', emoji: '🤓' },
  { key: 'hipster', label: '힙스터', emoji: '🧔' },
]

export function alienSpriteEntries(): { key: string; url: string }[] {
  return ALIEN_ARCHETYPES.map((a) => ({ key: `alien-${a.key}`, url: `/characters/alien-${a.key}.webp` }))
}
