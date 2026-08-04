'use client'

import { SOBOK_ACCOUNT_LABELS, SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import Starfield from '@/components/Starfield'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  GuardianApiError,
  type GuardianOwnedReport,
  guardianReportPaths,
  listOwnedGuardianReports,
} from '@/lib/guardian-paid'

const COPY = {
  ko: {
    eyebrow: 'MY STELLA LIBRARY',
    title: '내 카드 보관함',
    signedOutBody: '소복 계정에 보관한 리포트와 수호령 카드를 여기에서 다시 만날 수 있어요.',
    signIn: '소복 계정으로 로그인',
    signingIn: '계정 페이지를 여는 중…',
    signOut: 'Stella에서 로그아웃',
    accountSettings: '소복 계정 설정',
    libraryBody: '계정에 귀속한 리포트는 이 브라우저의 게스트 열쇠 없이도 다시 열 수 있어요.',
    emptyTitle: '아직 보관한 카드가 없어요',
    emptyBody: '유료 리포트의 카드를 모두 공개한 뒤 계정에 보관하면 이곳에 나타나요.',
    start: '수호령 리포트 시작하기',
    open: '전체 리포트 열기',
    loading: '보관한 카드를 불러오는 중…',
    error: '보관함을 불러오지 못했어요. 잠시 뒤 다시 확인해주세요.',
  },
  en: {
    eyebrow: '',
    title: '',
    signedOutBody: '',
    signIn: '',
    signingIn: '',
    signOut: '',
    accountSettings: '',
    libraryBody: '',
    emptyTitle: '',
    emptyBody: '',
    start: '',
    open: '',
    loading: '',
    error: '',
  },
  ja: {
    eyebrow: '',
    title: '',
    signedOutBody: '',
    signIn: '',
    signingIn: '',
    signOut: '',
    accountSettings: '',
    libraryBody: '',
    emptyTitle: '',
    emptyBody: '',
    start: '',
    open: '',
    loading: '',
    error: '',
  },
  zh: {
    eyebrow: '',
    title: '',
    signedOutBody: '',
    signIn: '',
    signingIn: '',
    signOut: '',
    accountSettings: '',
    libraryBody: '',
    emptyTitle: '',
    emptyBody: '',
    start: '',
    open: '',
    loading: '',
    error: '',
  },
} as const

type LibraryState = { kind: 'loading' } | { kind: 'ready'; reports: GuardianOwnedReport[] } | { kind: 'error' }

export default function StellaAccount({ locale }: { locale: Locale }) {
  const content = COPY[locale]
  const { data: session, isPending } = stellaAuthClient.useSession()
  const [library, setLibrary] = useState<LibraryState>({ kind: 'loading' })
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (isPending) return
    if (!session) {
      setLibrary({ kind: 'ready', reports: [] })
      return
    }
    let active = true
    setLibrary({ kind: 'loading' })
    void listOwnedGuardianReports()
      .then((reports) => {
        if (active) setLibrary({ kind: 'ready', reports })
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof GuardianApiError && error.status === 401) {
          void stellaAuthClient.getSession({ fetchOptions: { cache: 'no-store' } })
        }
        setLibrary({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [isPending, session])

  async function signIn() {
    setSigningIn(true)
    const callbackURL = `/${locale}/account`
    const result = await stellaAuthClient.signIn.oauth2({
      providerId: SOBOK_OIDC_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: callbackURL,
    })
    if (result.error) setSigningIn(false)
  }

  if (isPending) {
    return <AccountLoading copy={content.loading} />
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-24 pt-[calc(6rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{content.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black text-white">{content.title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-muted">
            {session ? content.libraryBody : content.signedOutBody}
          </p>
        </header>

        {!session ? (
          <section className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-6 text-center shadow-2xl">
            <button
              className="w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              disabled={signingIn}
              onClick={signIn}
              type="button"
            >
              {signingIn ? content.signingIn : content.signIn || SOBOK_ACCOUNT_LABELS[locale]}
            </button>
          </section>
        ) : (
          <>
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

            {library.kind === 'loading' && (
              <p className="mt-10 text-center text-sm text-foreground-muted">{content.loading}</p>
            )}
            {library.kind === 'error' && (
              <p className="mt-10 rounded-2xl bg-danger/10 p-4 text-center text-sm text-pink-200">{content.error}</p>
            )}
            {library.kind === 'ready' && library.reports.length === 0 && (
              <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-7 text-center">
                <h2 className="text-lg font-bold text-white">{content.emptyTitle}</h2>
                <p className="mt-2 text-sm leading-7 text-foreground-muted">{content.emptyBody}</p>
                <Link
                  className="mt-5 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  href={guardianReportPaths(locale).landing}
                >
                  {content.start}
                </Link>
              </section>
            )}
            {library.kind === 'ready' && library.reports.length > 0 && (
              <section className="mt-8 grid gap-4 sm:grid-cols-2">
                {library.reports.map((report) => (
                  <article
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#120b24]/86 shadow-xl"
                    key={report.reportPublicId}
                  >
                    <div className="grid grid-cols-4 gap-1 bg-black/15 p-3">
                      {report.artworkPaths.slice(0, 4).map((path) => (
                        <Image
                          alt=""
                          className="aspect-[3/4] w-full rounded-lg object-cover"
                          height={240}
                          key={path}
                          src={path}
                          width={180}
                        />
                      ))}
                    </div>
                    <div className="p-5">
                      <time className="text-[10px] text-foreground-faint" dateTime={report.createdAt}>
                        {new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { dateStyle: 'medium' }).format(
                          new Date(report.createdAt),
                        )}
                      </time>
                      <h2 className="mt-2 text-lg font-bold text-white">{report.title}</h2>
                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-foreground-muted">{report.oneLine}</p>
                      <Link
                        className="mt-4 inline-flex w-full justify-center rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
                        href={`${guardianReportPaths(report.locale).result}?report=${encodeURIComponent(report.reportPublicId)}`}
                      >
                        {content.open}
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function AccountLoading({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <p className="animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
    </main>
  )
}
