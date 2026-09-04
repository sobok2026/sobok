'use client'

import { track } from '@sobok/analytics/browser'
import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Starfield from '@/components/Starfield'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  claimGuardianCollection,
  GUARDIAN_CLAIM_INTENT_KEY,
  GuardianApiError,
  type GuardianDailyTheme,
  type GuardianLibrary,
  type GuardianPassSession,
  guardianPassPaths,
  listGuardianCards,
  readGuardianPassSession,
  storeGuardianPassSession,
} from '@/lib/guardian-daily'

const COPY = {
  ko: {
    eyebrow: 'MY GUARDIAN ARCHIVE',
    title: '내 카드 보관함',
    signedOutBody: '소복 계정에 보관한 수호령 카드와 최근 일주일의 흐름을 다시 만날 수 있어요.',
    guestBody: '이 브라우저에 연결된 게스트 카드예요. 로그인은 원할 때만 해도 돼요.',
    signIn: '소복 계정으로 로그인',
    saveToAccount: '소복 계정에 안전하게 보관하기',
    signingIn: '계정 페이지를 여는 중…',
    saving: '계정에 보관하는 중…',
    claimError: '지금은 계정에 보관하지 못했어요. 게스트 보관함은 그대로 볼 수 있어요.',
    signOut: 'Stella에서 로그아웃',
    accountSettings: '소복 계정 설정',
    libraryBody: '선공개권을 사용하며 만난 카드가 날짜별로 남아 있어요.',
    emptyTitle: '아직 보관한 카드가 없어요',
    emptyBody: '7일 선공개권으로 내일 카드를 열면 이곳에 날짜별로 남아요.',
    start: '오늘의 수호령 만나기',
    active: '선공개권 이용 중',
    expired: '현재 사용 중인 선공개권이 없어요',
    summary: '최근 일주일의 흐름',
    cards: '보관한 카드',
    openCard: '카드 내용 보기',
    closeCard: '카드 내용 접기',
    action: '해볼 한 가지',
    reflection: '마음에 남길 질문',
    themes: {
      self: '나를 보는 카드',
      love: '사랑 카드',
      work: '일 카드',
      choice: '선택 카드',
    } satisfies Record<GuardianDailyTheme, string>,
    loading: '보관한 카드를 불러오는 중…',
    error: '보관함을 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요.',
  },
  en: {
    eyebrow: 'MY GUARDIAN ARCHIVE',
    title: 'My card archive',
    signedOutBody: 'Sign in to revisit guardian cards saved to your Sobok account.',
    guestBody: 'These guest cards are connected to this browser. Signing in is optional.',
    signIn: 'Sign in with Sobok',
    saveToAccount: 'Save safely to my Sobok account',
    signingIn: 'Opening account…',
    saving: 'Saving to your account…',
    claimError: 'Could not save to your account just now. Your guest archive is still available.',
    signOut: 'Sign out of Stella',
    accountSettings: 'Sobok account settings',
    libraryBody: 'Cards saved while using early access appear here by date.',
    emptyTitle: 'No saved cards yet',
    emptyBody: 'The paid guardian pass is currently available in Korean.',
    start: "See today's fortune",
    active: 'Early access active',
    expired: 'No active early-access pass',
    summary: 'Your recent seven-day flow',
    cards: 'Saved cards',
    openCard: 'View card details',
    closeCard: 'Close card details',
    action: 'One thing to try',
    reflection: 'A question to keep',
    themes: {
      self: 'Self card',
      love: 'Love card',
      work: 'Work card',
      choice: 'Choice card',
    } satisfies Record<GuardianDailyTheme, string>,
    loading: 'Loading saved cards…',
    error: 'Could not load your archive. Try again shortly.',
  },
  ja: {
    eyebrow: 'MY GUARDIAN ARCHIVE',
    title: 'カード保管箱',
    signedOutBody: 'Sobokアカウントに保存した守護霊カードをもう一度確認できます。',
    guestBody: 'このブラウザに接続されたゲストカードです。ログインは必要なときだけで構いません。',
    signIn: 'Sobokアカウントでログイン',
    saveToAccount: 'Sobokアカウントに安全に保存',
    signingIn: 'アカウントを開いています…',
    saving: 'アカウントに保存しています…',
    claimError: '現在アカウントに保存できません。ゲスト保管箱はそのまま閲覧できます。',
    signOut: 'Stellaからログアウト',
    accountSettings: 'Sobokアカウント設定',
    libraryBody: '先行公開で出会ったカードが日付別に保存されています。',
    emptyTitle: '保存したカードはまだありません',
    emptyBody: '有料の守護霊パスは現在韓国語版で提供しています。',
    start: '今日の運勢を見る',
    active: '先行公開パス利用中',
    expired: '利用中の先行公開パスはありません',
    summary: '最近7日間の流れ',
    cards: '保存したカード',
    openCard: 'カードの内容を見る',
    closeCard: 'カードの内容を閉じる',
    action: '試してみること',
    reflection: '心に残す問い',
    themes: {
      self: '自分を見つめるカード',
      love: '恋愛カード',
      work: '仕事カード',
      choice: '選択カード',
    } satisfies Record<GuardianDailyTheme, string>,
    loading: '保存したカードを読み込んでいます…',
    error: '保管箱を読み込めませんでした。しばらくしてからもう一度お試しください。',
  },
  zh: {
    eyebrow: 'MY GUARDIAN ARCHIVE',
    title: '我的卡片收藏',
    signedOutBody: '登录后可再次查看保存到 Sobok 账户的守护灵卡片。',
    guestBody: '这些访客卡片已连接到此浏览器；是否登录由您决定。',
    signIn: '使用 Sobok 账户登录',
    saveToAccount: '安全保存到 Sobok 账户',
    signingIn: '正在打开账户…',
    saving: '正在保存到账户…',
    claimError: '目前无法保存到账户，访客收藏仍可继续查看。',
    signOut: '退出 Stella',
    accountSettings: 'Sobok 账户设置',
    libraryBody: '使用提前查看权益时遇见的卡片会按日期保存在这里。',
    emptyTitle: '还没有保存的卡片',
    emptyBody: '付费守护灵通行证目前仅提供韩语版本。',
    start: '查看今日运势',
    active: '提前查看权益有效',
    expired: '当前没有有效的提前查看权益',
    summary: '最近七天的流势',
    cards: '保存的卡片',
    openCard: '查看卡片内容',
    closeCard: '收起卡片内容',
    action: '可以尝试的一件事',
    reflection: '留在心里的问题',
    themes: {
      self: '自我卡片',
      love: '爱情卡片',
      work: '工作卡片',
      choice: '选择卡片',
    } satisfies Record<GuardianDailyTheme, string>,
    loading: '正在加载保存的卡片…',
    error: '无法加载收藏，请稍后再试。',
  },
} as const

type Content = (typeof COPY)[Locale]
type LibraryState = { kind: 'loading' } | { kind: 'ready'; library: GuardianLibrary } | { kind: 'error' }
type ClaimState = 'idle' | 'saving' | 'error'

const EMPTY_LIBRARY: GuardianLibrary = {
  items: [],
  summary: null,
  access: { active: false, expiresAt: null },
}

export default function StellaAccount({ locale }: { locale: Locale }) {
  const content = COPY[locale]
  const paths = guardianPassPaths(locale)
  const { data: session, isPending } = stellaAuthClient.useSession()
  const [library, setLibrary] = useState<LibraryState>({ kind: 'loading' })
  const [guestSession, setGuestSession] = useState<GuardianPassSession | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [claimState, setClaimState] = useState<ClaimState>('idle')

  useEffect(() => {
    if (isPending) return
    let active = true
    const stored = readGuardianPassSession()
    const guest = stored?.accessToken ? stored : null
    setGuestSession(guest)
    setStorageReady(true)

    if (!session && !guest) {
      setLibrary({ kind: 'ready', library: EMPTY_LIBRARY })
      return
    }

    setLibrary({ kind: 'loading' })
    async function load() {
      let accessToken = guest?.accessToken

      if (session && guest && hasClaimIntent(guest.collectionPublicId)) {
        setClaimState('saving')
        clearClaimIntent()
        try {
          await claimGuardianCollection(guest)
          const claimed = { ...guest, accessToken: undefined, claimed: true }
          try {
            storeGuardianPassSession(claimed)
          } catch {
            // Server ownership is authoritative even when optional browser state cannot be refreshed.
          }
          accessToken = undefined
          if (active) {
            setGuestSession(null)
            setClaimState('idle')
            track('guardian_daily_collection_claimed', { surface: 'account' })
          }
        } catch {
          if (active) setClaimState('error')
        }
      }

      try {
        let value: GuardianLibrary
        try {
          value = await listGuardianCards(accessToken)
        } catch (error) {
          if (!(session && accessToken && error instanceof GuardianApiError && error.status === 401)) throw error
          value = await listGuardianCards()
          if (active) setGuestSession(null)
        }
        if (active) setLibrary({ kind: 'ready', library: value })
      } catch (error) {
        if (!active) return
        if (error instanceof GuardianApiError && error.status === 401) {
          void stellaAuthClient.getSession({ fetchOptions: { cache: 'no-store' } })
        }
        setLibrary({ kind: 'error' })
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [isPending, session])

  async function signIn() {
    setSigningIn(true)
    const guest = readGuardianPassSession()
    if (guest?.accessToken) {
      try {
        localStorage.setItem(GUARDIAN_CLAIM_INTENT_KEY, guest.collectionPublicId)
      } catch {
        // The signed-in screen still offers an explicit claim when intent storage is unavailable.
      }
    }
    const callbackURL = paths.account
    const result = await stellaAuthClient.signIn.oauth2({
      providerId: SOBOK_OIDC_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: callbackURL,
    })
    if (result.error) setSigningIn(false)
  }

  async function claimGuest() {
    if (!session || !guestSession?.accessToken || claimState === 'saving') return
    setClaimState('saving')
    try {
      await claimGuardianCollection(guestSession)
    } catch {
      setClaimState('error')
      return
    }

    const claimed = { ...guestSession, accessToken: undefined, claimed: true }
    try {
      storeGuardianPassSession(claimed)
    } catch {
      // Server ownership is authoritative even when optional browser state cannot be refreshed.
    }
    clearClaimIntent()
    setGuestSession(null)
    setClaimState('idle')
    track('guardian_daily_collection_claimed', { surface: 'account' })
    setLibrary({ kind: 'loading' })
    try {
      setLibrary({ kind: 'ready', library: await listGuardianCards() })
    } catch {
      setLibrary({ kind: 'error' })
    }
  }

  if (isPending || !storageReady) return <AccountLoading copy={content.loading} />

  const hasArchiveAccess = Boolean(session || guestSession)
  const headerBody = guestSession ? content.guestBody : session ? content.libraryBody : content.signedOutBody

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-24 pt-[calc(6rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{content.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black text-white">{content.title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-muted">{headerBody}</p>
        </header>

        {!session ? (
          <section className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-6 text-center shadow-2xl">
            <button
              className="w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              disabled={signingIn}
              onClick={() => void signIn()}
              type="button"
            >
              {signingIn ? content.signingIn : guestSession ? content.saveToAccount : content.signIn}
            </button>
          </section>
        ) : (
          <section className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-white">{session.user.name}</p>
              <p className="mt-1 text-xs text-foreground-subtle">{session.user.email}</p>
            </div>
            <div className="flex gap-2">
              <a
                className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-semibold text-foreground-secondary"
                href={`${session.user.issuer}/account`}
              >
                {content.accountSettings}
              </a>
              <button
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-foreground-secondary"
                onClick={() => stellaAuthClient.signOut()}
                type="button"
              >
                {content.signOut}
              </button>
            </div>
          </section>
        )}

        {session && guestSession ? (
          <section className="mt-4 rounded-2xl border border-pink-200/20 bg-pink-100/8 p-4 text-center">
            <button
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
              disabled={claimState === 'saving'}
              onClick={() => void claimGuest()}
              type="button"
            >
              {claimState === 'saving' ? content.saving : content.saveToAccount}
            </button>
            {claimState === 'error' ? <p className="mt-2 text-[11px] text-pink-200">{content.claimError}</p> : null}
          </section>
        ) : null}

        {hasArchiveAccess ? (
          <GuardianLibraryView content={content} library={library} locale={locale} todayPath={paths.today} />
        ) : null}
      </div>
    </main>
  )
}

function GuardianLibraryView({
  content,
  library,
  locale,
  todayPath,
}: {
  content: Content
  library: LibraryState
  locale: Locale
  todayPath: string
}) {
  if (library.kind === 'loading') {
    return <p className="mt-10 text-center text-sm text-foreground-muted">{content.loading}</p>
  }
  if (library.kind === 'error') {
    return <p className="mt-10 rounded-2xl bg-danger/10 p-4 text-center text-sm text-pink-200">{content.error}</p>
  }

  return (
    <>
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-4 text-center">
        <p
          className={`text-xs font-semibold ${library.library.access.active ? 'text-positive' : 'text-foreground-subtle'}`}
        >
          {library.library.access.active ? content.active : content.expired}
        </p>
        {library.library.access.expiresAt && (
          <p className="mt-1 text-[10px] text-foreground-faint">
            {formatDateTime(library.library.access.expiresAt, locale)}
          </p>
        )}
      </section>

      {library.library.summary && (
        <section className="mt-5 rounded-[2rem] border border-pink-200/15 bg-pink-100/8 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{content.summary}</p>
          <h2 className="mt-2 text-lg font-bold text-white">{library.library.summary.title}</h2>
          <p className="mt-2 text-xs leading-6 text-foreground-muted">{library.library.summary.body}</p>
        </section>
      )}

      {library.library.items.length === 0 ? (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-white">{content.emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.emptyBody}</p>
          <Link
            className="mt-6 block rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
            href={todayPath}
          >
            {content.start}
          </Link>
        </section>
      ) : (
        <section aria-labelledby="guardian-library-title" className="mt-7">
          <h2 className="text-sm font-bold text-white" id="guardian-library-title">
            {content.cards}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {library.library.items.map((card) => (
              <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/4" key={card.publicId}>
                <details className="group">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <Image
                      alt={card.artworkAlt}
                      className="aspect-[3/4] h-auto w-full object-cover"
                      height={480}
                      sizes="(max-width: 640px) 46vw, 14rem"
                      src={card.artworkPath}
                      width={360}
                    />
                    <div className="p-3">
                      <p className="text-[10px] text-accent">
                        {formatDateKey(card.dateKey, locale)} · {content.themes[card.theme]}
                      </p>
                      <h3 className="mt-1 text-sm font-bold text-white">{card.title}</h3>
                      <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-foreground-subtle">{card.oneLine}</p>
                      <span className="mt-2 block text-[10px] font-semibold text-accent group-open:hidden">
                        {content.openCard} ↓
                      </span>
                      <span className="mt-2 hidden text-[10px] font-semibold text-accent group-open:block">
                        {content.closeCard} ↑
                      </span>
                    </div>
                  </summary>
                  <div className="space-y-3 border-t border-white/8 px-3 py-4">
                    <p className="text-[10px] text-foreground-faint">{card.guardians}</p>
                    <div>
                      <p className="text-[10px] font-semibold text-accent">{content.action}</p>
                      <p className="mt-1 text-[10px] leading-5 text-foreground-secondary">{card.action}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-accent">{content.reflection}</p>
                      <p className="mt-1 text-[10px] leading-5 text-foreground-secondary">{card.reflection}</p>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function AccountLoading({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <p className="animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
    </main>
  )
}

function hasClaimIntent(collectionPublicId: string): boolean {
  try {
    return localStorage.getItem(GUARDIAN_CLAIM_INTENT_KEY) === collectionPublicId
  } catch {
    return false
  }
}

function clearClaimIntent(): void {
  try {
    localStorage.removeItem(GUARDIAN_CLAIM_INTENT_KEY)
  } catch {
    // A stale intent cannot claim without both the guest capability and an authenticated account.
  }
}

function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

function formatDateKey(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T12:00:00Z`),
  )
}
