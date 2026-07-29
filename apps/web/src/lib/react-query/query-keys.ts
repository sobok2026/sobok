import { PostFilter } from '@sobok/domain/post/filter'

export const QueryKeys = {
  me: ['me'],
  followingUsers: ['me', 'users', 'following'],
  likedPosts: ['me', 'posts', 'liked'],
  passkeys: ['me', 'passkeys'],
  notification: ['me', 'notifications'],
  notificationUnreadCount: ['me', 'notifications', 'unread-count'],
  notifications: (searchParams: URLSearchParams) => ['me', 'notifications', Object.fromEntries(searchParams)],
  points: ['me', 'points'],
  pointsExpansion: ['me', 'points', 'expansion'],
  pointsTurnstile: ['me', 'points', 'turnstile'],
  pointsTransactionsBase: ['me', 'points', 'transactions'],
  pointsTransactions: (locale: string) => [...QueryKeys.pointsTransactionsBase, locale],
  pointsToken: (adSlotId: string) => ['me', 'points', 'token', adSlotId],

  searchSuggestions: (query: string, locale: string, limit?: number) => ['search', 'suggestions', locale, query, limit],
  postsBase: ['posts'],
  followingPosts: ['posts', PostFilter.FOLLOWING],
  posts: (filter: PostFilter, mangaId?: number, username?: string, locale?: string) => [
    'posts',
    filter,
    { mangaId, username, locale },
  ],
  trendingKeywords: (locale: string) => ['trending-keywords', locale],

  chatThreads: ['chat', 'threads'],
  chatStudio: ['chat', 'studio'],
  chatStudioEarnings: ['chat', 'studio', 'earnings'],
  chatArtist: (handle: string) => ['chat', 'artist', handle],
  paymentMethods: ['billing', 'payment-methods'],
  billingSubscriptions: ['billing', 'subscriptions'],
  billingPayments: ['billing', 'payments'],
  chatMessages: (handle: string) => ['chat', 'messages', handle],
  chatReplies: (handle: string, messageId: string) => ['chat', 'replies', handle, messageId],
}
