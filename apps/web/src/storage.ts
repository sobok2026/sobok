import type { UserSettings } from '@sobok/domain/utils/user-settings'

// `as const` objects and not tuples: these are opaque storage keys, several of them versioned or abbreviated
// (`'rh'`, `'search-language:v1'`), so the member name is the only thing that says what a key holds. See
// `@sobok/domain/censorship/model` for why none of these are enums.
export const BROADCAST_CHANNEL_KEY = {
  USER_SETTINGS: 'user-settings',
} as const

export type BroadcastChannelKey = (typeof BROADCAST_CHANNEL_KEY)[keyof typeof BROADCAST_CHANNEL_KEY]

export const LOCAL_STORAGE_KEY = {
  CHAT_WEBLLM_SETTINGS: 'chat-webllm-settings',
  RECENT_SEARCHES: 'recent-searches',
  RECENT_SEARCHES_ENABLED: 'recent-searches-enabled',
  SEARCH_LANGUAGE: 'search-language:v1',
  THEME: 'theme',
} as const

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEY)[keyof typeof LOCAL_STORAGE_KEY]

export const SEARCH_PARAM_KEY = {
  REDIRECT: 'redirect',
} as const

export type SearchParamKey = (typeof SEARCH_PARAM_KEY)[keyof typeof SEARCH_PARAM_KEY]

export const SESSION_STORAGE_KEY = {
  READING_HISTORY: 'rh',
  SEARCH_TRENDING_VIEW: 'search-trending-view',
} as const

export type SessionStorageKey = (typeof SESSION_STORAGE_KEY)[keyof typeof SESSION_STORAGE_KEY]

export type UserSettingsBroadcastMessage = {
  settings: UserSettings
  userId: string
}

export const SessionStorageKeyMap = {
  readingHistory: () => `${SESSION_STORAGE_KEY.READING_HISTORY}:v1`,
  searchTrendingView: (query: string) => `${SESSION_STORAGE_KEY.SEARCH_TRENDING_VIEW}:v1:${encodeURIComponent(query)}`,
} as const
