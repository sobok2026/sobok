// The integers are the DB and crawler values, so the names have to stay reachable — hence `as const` objects.
// See `../censorship/model.ts` for why none of these are enums.
export const TAG_CATEGORY = {
  FEMALE: 0,
  MALE: 1,
  MIXED: 2,
  OTHER: 3,
} as const

export type TagCategory = (typeof TAG_CATEGORY)[keyof typeof TAG_CATEGORY]

export const tagCategoryIntToName = {
  [TAG_CATEGORY.FEMALE]: 'female',
  [TAG_CATEGORY.MALE]: 'male',
  [TAG_CATEGORY.MIXED]: 'mixed',
  [TAG_CATEGORY.OTHER]: 'other',
} as const satisfies Record<TagCategory, string>

// Indexed by a crawled category string, so the key type stays wide. `TagCategory` and not `TagCategory |
// undefined` is the shape the one call site (`utils/manga.ts` sortLabeledValues) was written against.
export const tagCategoryNameToInt: Record<string, TagCategory> = {
  female: TAG_CATEGORY.FEMALE,
  male: TAG_CATEGORY.MALE,
  mixed: TAG_CATEGORY.MIXED,
  other: TAG_CATEGORY.OTHER,
}

// 5 and 6 are burnt: E_HENTAI and EX_HENTAI were dropped and their ids may never be reused, because rows in the
// wild still carry them.
export const MANGA_SOURCE = {
  HASHA: 0,
  HARPI: 1,
  HIYOBI: 2,
  K_HENTAI: 3,
  HITOMI: 4,
  KOMI: 7,
  HENTAIPAW: 8,
  SOBOK: 9,
  HENTKOR: 10,
} as const

export type MangaSource = (typeof MANGA_SOURCE)[keyof typeof MANGA_SOURCE]

export const MANGA_TYPE = {
  DOUJINSHI: 1,
  MANGA: 2,
  ARTIST_CG: 3,
  GAME_CG: 4,
  WESTERN: 5,
  IMAGE_SET: 6,
  NON_H: 7,
  COSPLAY: 8,
  ASIAN_PORN: 9,
  MISC: 10,
  HIDDEN: 11,
} as const

export type MangaType = (typeof MANGA_TYPE)[keyof typeof MANGA_TYPE]

export const MANGA_TYPE_VALUE_BY_ID = {
  [MANGA_TYPE.DOUJINSHI]: 'doujinshi',
  [MANGA_TYPE.MANGA]: 'manga',
  [MANGA_TYPE.ARTIST_CG]: 'artist_cg',
  [MANGA_TYPE.GAME_CG]: 'game_cg',
  [MANGA_TYPE.WESTERN]: 'western',
  [MANGA_TYPE.IMAGE_SET]: 'image_set',
  [MANGA_TYPE.NON_H]: 'non-h',
  [MANGA_TYPE.COSPLAY]: 'cosplay',
  [MANGA_TYPE.ASIAN_PORN]: 'asian',
  [MANGA_TYPE.MISC]: 'misc',
  [MANGA_TYPE.HIDDEN]: 'private',
} as const satisfies Record<MangaType, string>

export type ImageVariant = {
  url: string
  width?: number
  height?: number
}

export type ImageWithVariants = {
  original?: ImageVariant
  thumbnail?: ImageVariant
  medium?: ImageVariant
}

export type LabeledValue = {
  label: string
  value: string
}

export interface LabeledValueWithLink extends LabeledValue {
  links?: LabeledValue[]
}

export type Manga = {
  id: number
  title: string
  images?: ImageWithVariants[]
  artists?: LabeledValueWithLink[]
  bookmarkCount?: number
  characters?: LabeledValueWithLink[]
  count?: number
  date?: string
  description?: string
  filesize?: number
  group?: LabeledValue[]
  languages?: LabeledValue[]
  like?: number
  likeAnonymous?: number
  lines?: string[]
  rating?: number
  ratingCount?: number
  related?: number[]
  series?: LabeledValue[]
  source?: MangaSource
  sources?: MangaSource[]
  tags?: MangaTag[]
  torrentCount?: number
  torrents?: MangaTorrent[]
  type?: LabeledValue
  uploader?: string
  viewCount?: number

  // Harpi
  harpiId?: string
}

export type MangaError = Manga & {
  isError: true
}

export type MangaTag = LabeledValue & {
  category: string
}

export type MangaTorrent = {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}
