'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track, trackEcommerce } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_LOVE_REDRAW_UI } from '@/content/guardian-love-redraw-ui'
import {
  clearGuardianDrawRequest,
  clearGuardianRedrawCheckoutSession,
  confirmGuardianPayment,
  createGuardianLoveRedrawCheckout,
  drawGuardianLoveCard,
  equipGuardianLoveCard,
  GUARDIAN_PAY_METHODS,
  GUARDIAN_REDRAW_CHECKOUT_ACTION,
  GuardianApiError,
  type GuardianLoveRedrawResult,
  type GuardianLoveRedrawState,
  type GuardianPayMethod,
  type GuardianRedrawCheckoutSession,
  type GuardianReportAccess,
  getGuardianLoveRedraw,
  guardianReportPaths,
  readGuardianRedrawCheckoutSession,
  readOrCreateGuardianDrawRequest,
  storeGuardianRedrawCheckoutSession,
} from '@/lib/guardian-paid'
import GuardianAccountRequired from '../_components/GuardianAccountRequired'
import GuardianMissingSession from '../_components/GuardianMissingSession'
import { useGuardianReportAccess } from '../_components/useGuardianReportAccess'
import revealStyles from '../paid-report.module.css'

type PageState =
  | { kind: 'loading'; confirming: boolean }
  | { kind: 'ready'; redraw: GuardianLoveRedrawState }
  | { kind: 'error'; message: string }

const RARITY_STYLE = {
  orbit: 'border-white/12 bg-white/5 text-foreground-secondary',
  nebula: 'border-violet-300/20 bg-violet-300/8 text-violet-100',
  eclipse: 'border-amber-200/20 bg-amber-200/8 text-amber-100',
  stella: 'border-pink-200/30 bg-pink-200/12 text-pink-50',
} as const

export default function GuardianLoveRedraw({ locale }: { locale: Locale }) {
  const content = GUARDIAN_LOVE_REDRAW_UI[locale]
  const access = useGuardianReportAccess(locale)

  if (access.kind === 'loading') {
    return <LoadingScreen copy={content.states.loading} />
  }
  if (access.kind === 'account-required') {
    return <GuardianAccountRequired locale={locale} />
  }
  if (access.kind === 'missing' || !access.access.email) {
    return <GuardianMissingSession locale={locale} />
  }
  return <GuardianLoveRedrawExperience session={{ ...access.access, email: access.access.email }} />
}

function GuardianLoveRedrawExperience({ session }: { session: GuardianReportAccess & { email: string } }) {
  const content = GUARDIAN_LOVE_REDRAW_UI[session.locale]
  const paths = guardianReportPaths(session.locale)
  const [state, setState] = useState<PageState>({ kind: 'loading', confirming: false })
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [payMethod, setPayMethod] = useState<GuardianPayMethod>(GUARDIAN_PAY_METHODS[0])
  const [checkoutSku, setCheckoutSku] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [equippingId, setEquippingId] = useState<string | null>(null)
  const [reveal, setReveal] = useState<GuardianLoveRedrawResult | null>(null)
  const [flipped, setFlipped] = useState(false)
  const turnstile = useRef<TurnstileInstance>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true
    void openCollection()
  }, [])

  async function openCollection() {
    const pending = readGuardianRedrawCheckoutSession(session.reportPublicId)
    if (pending) {
      setPayMethod(pending.payMethod)
    }
    setState({ kind: 'loading', confirming: Boolean(pending?.paymentId) })
    setError(null)
    try {
      if (pending?.paymentId) {
        const confirmation = await confirmGuardianPayment(session.accessToken, pending.paymentId)
        if (confirmation.status === 'paid') {
          trackConfirmedPayment(pending)
          clearGuardianRedrawCheckoutSession()
        } else if (confirmation.status !== 'pending') {
          clearGuardianRedrawCheckoutSession()
          setError(content.errors.paymentInterrupted)
        } else {
          setError(content.errors.paymentPending)
        }
      }

      const redraw = await getGuardianLoveRedraw(session)
      setState({ kind: 'ready', redraw })
      track('guardian_redraw_opened', {
        available_credits: redraw.credits.available,
        locale: session.locale,
        owned_cards: redraw.cards.length,
      })
    } catch (caught) {
      setState({
        kind: 'error',
        message: redrawErrorMessage(
          caught,
          content.errors.unavailable,
          content.errors.noCredit,
          content.errors.generic,
        ),
      })
    }
  }

  async function beginCheckout(product: GuardianLoveRedrawState['products'][number]) {
    if (!turnstileToken || checkoutSku) {
      return
    }
    setCheckoutSku(product.sku)
    setError(null)

    const previous = readGuardianRedrawCheckoutSession(session.reportPublicId)
    const checkout: GuardianRedrawCheckoutSession =
      previous?.sku === product.sku && previous.payMethod === payMethod
        ? previous
        : {
            reportPublicId: session.reportPublicId,
            requestId: crypto.randomUUID(),
            paymentId: null,
            sku: product.sku,
            payMethod,
            credits: product.credits,
            amount: product.price.amount,
            currency: product.price.currency,
            createdAt: Date.now(),
          }

    try {
      storeGuardianRedrawCheckoutSession(checkout)
      const response = await createGuardianLoveRedrawCheckout(session, {
        requestId: checkout.requestId,
        sku: product.sku,
        payMethod,
        turnstileToken,
      })
      const persisted = {
        ...checkout,
        paymentId: response.payment.paymentId,
        amount: response.payment.amount,
        currency: response.payment.currency,
      }
      storeGuardianRedrawCheckoutSession(persisted)

      trackEcommerce(
        'begin_checkout',
        redrawEcommerce(product.sku, product.credits, response.payment.amount, response.payment.currency),
        { locale: session.locale },
      )
      track('guardian_redraw_checkout_started', {
        credits: product.credits,
        locale: session.locale,
        sku: product.sku,
      })

      if (response.payment.status === 'paid') {
        trackConfirmedPayment(persisted)
        clearGuardianRedrawCheckoutSession()
        await openCollection()
        return
      }

      const redirectUrl = `${window.location.origin}${paths.loveRedraw}?report=${encodeURIComponent(session.reportPublicId)}`
      const { requestPayment } = await import('@portone/browser-sdk/v2')
      const result = await requestPayment({
        channelKey: response.payment.channelKey,
        currency: response.payment.currency,
        customer: { email: session.email },
        forceRedirect: true,
        orderName: response.payment.orderName,
        paymentId: response.payment.paymentId,
        payMethod: response.payment.payMethod,
        redirectUrl,
        storeId: response.payment.storeId,
        totalAmount: response.payment.amount,
      })

      if (result?.code != null) {
        const confirmation = await confirmGuardianPayment(session.accessToken, response.payment.paymentId).catch(
          () => null,
        )
        if (confirmation?.status === 'paid') {
          trackConfirmedPayment(persisted)
          clearGuardianRedrawCheckoutSession()
          await openCollection()
          return
        }
        if (confirmation && confirmation.status !== 'pending') {
          clearGuardianRedrawCheckoutSession()
        }
        track('guardian_redraw_payment_interrupted', { code: result.code, locale: session.locale })
        setError(result.message || content.errors.paymentInterrupted)
        return
      }

      window.location.assign(redirectUrl)
    } catch (caught) {
      if (caught instanceof GuardianApiError && caught.slug === 'checkout-conflict') {
        clearGuardianRedrawCheckoutSession()
      }
      setError(redrawErrorMessage(caught, content.errors.unavailable, content.errors.noCredit, content.errors.generic))
    } finally {
      setCheckoutSku(null)
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  async function drawCard() {
    if (state.kind !== 'ready' || drawing || state.redraw.credits.available < 1) {
      if (state.kind === 'ready' && state.redraw.credits.available < 1) {
        setError(content.errors.noCredit)
      }
      return
    }
    setDrawing(true)
    setError(null)
    try {
      const requestId = readOrCreateGuardianDrawRequest(session.reportPublicId)
      const result = await drawGuardianLoveCard(session, requestId)
      clearGuardianDrawRequest(session.reportPublicId)
      setState({ kind: 'ready', redraw: result.state })
      setReveal(result)
      setFlipped(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      track('guardian_redraw_created', {
        duplicate: result.duplicate,
        guaranteed: result.guaranteedUnowned,
        locale: session.locale,
        rarity: result.acquisition.rarity,
      })
    } catch (caught) {
      setError(redrawErrorMessage(caught, content.errors.unavailable, content.errors.noCredit, content.errors.generic))
    } finally {
      setDrawing(false)
    }
  }

  function trackConfirmedPayment(checkout: GuardianRedrawCheckoutSession) {
    trackEcommerce(
      'purchase',
      redrawEcommerce(checkout.sku, checkout.credits, checkout.amount, checkout.currency, checkout.paymentId),
      { locale: session.locale },
    )
    track('guardian_redraw_payment_confirmed', {
      credits: checkout.credits,
      locale: session.locale,
      sku: checkout.sku,
    })
  }

  async function equip(acquisitionPublicId: string) {
    if (equippingId) {
      return
    }
    setEquippingId(acquisitionPublicId)
    setError(null)
    try {
      const redraw = await equipGuardianLoveCard(session, acquisitionPublicId)
      setState({ kind: 'ready', redraw })
      if (reveal?.acquisition.acquisitionPublicId === acquisitionPublicId) {
        setReveal({
          ...reveal,
          acquisition: { ...reveal.acquisition, equipped: true },
          state: redraw,
        })
      }
      track('guardian_redraw_equipped', {
        acquisition_id: acquisitionPublicId,
        locale: session.locale,
      })
    } catch (caught) {
      setError(redrawErrorMessage(caught, content.errors.unavailable, content.errors.noCredit, content.errors.generic))
    } finally {
      setEquippingId(null)
    }
  }

  if (state.kind === 'loading') {
    return <LoadingScreen copy={state.confirming ? content.states.confirming : content.states.loading} />
  }
  if (state.kind === 'error') {
    return <ErrorScreen copy={state.message} onRetry={openCollection} retry={content.errors.retry} />
  }

  const { redraw } = state
  if (reveal) {
    return (
      <RevealScreen
        content={content}
        equipping={equippingId === reveal.acquisition.acquisitionPublicId}
        flipped={flipped}
        onBack={() => setReveal(null)}
        onDrawAgain={drawCard}
        onEquip={() => equip(reveal.acquisition.acquisitionPublicId)}
        onFlip={() => {
          if (!flipped) {
            setFlipped(true)
            track('guardian_redraw_revealed', {
              locale: session.locale,
              rarity: reveal.acquisition.rarity,
            })
          }
        }}
        paths={paths}
        reportPublicId={session.reportPublicId}
        result={reveal}
      />
    )
  }

  const recommendedCredits = redraw.products.reduce((maximum, product) => Math.max(maximum, product.credits), 0)

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(6rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          className="text-xs text-foreground-subtle hover:text-white"
          href={`${paths.result}?report=${encodeURIComponent(session.reportPublicId)}`}
        >
          ← {content.navigation.backToReport}
        </Link>

        <header className="mx-auto mt-7 max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.hero.eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight text-white sm:text-4xl">
            {content.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-foreground-muted">{content.hero.body}</p>
        </header>

        {error && <ErrorNotice copy={error} />}

        <section className="mt-8 grid gap-5 rounded-[2rem] border border-pink-200/15 bg-[#120b24]/88 p-5 shadow-2xl sm:grid-cols-[11rem_1fr] sm:p-7">
          <Image
            alt={redraw.equippedCard.artworkAlt}
            className="mx-auto aspect-[3/4] w-44 rounded-3xl object-cover shadow-2xl sm:w-full"
            height={480}
            priority
            src={redraw.equippedCard.artworkPath}
            width={360}
          />
          <div className="self-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              {content.current.eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">{content.current.title}</h2>
            <p className="mt-1 text-xs text-pink-200/80">{redraw.equippedCard.guardians}</p>
            <p className="mt-4 text-sm font-semibold leading-7 text-pink-50">{redraw.equippedCard.oneLine}</p>
            <span className="mt-4 inline-flex rounded-full border border-pink-200/20 bg-pink-200/8 px-3 py-1 text-[10px] font-semibold text-pink-100">
              {content.current.equipped}
            </span>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/4 p-5">
            <p className="text-sm font-bold text-white">{content.wallet.credits(redraw.credits.available)}</p>
            <button
              className="mt-4 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
              disabled={drawing || redraw.credits.available < 1}
              onClick={drawCard}
              type="button"
            >
              {drawing ? content.wallet.drawing : content.wallet.draw}
            </button>
          </article>
          <article className="rounded-[2rem] border border-white/10 bg-white/4 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white">{content.wallet.guaranteeTitle}</p>
              <span className="text-xs font-semibold text-pink-100">
                {content.wallet.guaranteeProgress(redraw.guarantee.paidDrawsInCycle, redraw.guarantee.interval)}
              </span>
            </div>
            <div
              className="mt-4 grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${redraw.guarantee.interval}, minmax(0, 1fr))` }}
              aria-hidden
            >
              {Array.from({ length: redraw.guarantee.interval }, (_, index) => (
                <span
                  className={`h-2 rounded-full ${index < redraw.guarantee.paidDrawsInCycle ? 'bg-pink-200' : 'bg-white/10'}`}
                  key={index}
                />
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-foreground-subtle">
              {content.wallet.guaranteeNext(redraw.guarantee.paidDrawsUntilGuarantee)}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{content.offer.eyebrow}</p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.offer.title}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.offer.body}</p>
          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-foreground-secondary">{content.offer.methodLabel}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GUARDIAN_PAY_METHODS.map((method) => (
                <label
                  className={`flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border px-3 text-xs font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pink-200/40 ${
                    payMethod === method
                      ? 'border-pink-200/45 bg-pink-100/12 text-pink-50'
                      : 'border-white/10 bg-white/3 text-foreground-secondary hover:border-white/20 hover:text-white'
                  }`}
                  key={method}
                >
                  <input
                    checked={payMethod === method}
                    className="sr-only"
                    disabled={Boolean(checkoutSku)}
                    name="guardian-redraw-pay-method"
                    onChange={() => setPayMethod(method)}
                    type="radio"
                    value={method}
                  />
                  {content.offer.methodLabels[method]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {redraw.products.map((product) => {
              const price = money(session.locale, product.price.currency, product.price.amount)
              const unitPrice = money(
                session.locale,
                product.price.currency,
                Math.round(product.price.amount / product.credits),
              )
              const recommended = product.credits === recommendedCredits
              return (
                <article
                  className={`relative rounded-3xl border p-5 ${recommended ? 'border-pink-200/30 bg-pink-100/8' : 'border-white/10 bg-white/3'}`}
                  key={product.sku}
                >
                  {recommended && (
                    <span className="absolute right-4 top-4 rounded-full bg-pink-200 px-2.5 py-1 text-[9px] font-black text-[#29122f]">
                      {content.offer.recommended}
                    </span>
                  )}
                  <p className="text-2xl font-black text-white">{content.offer.credits(product.credits)}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">{content.offer.perDraw(unitPrice)}</p>
                  <button
                    className="mt-5 w-full rounded-2xl border border-pink-200/20 bg-white/7 px-4 py-3 text-xs font-bold text-pink-50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!turnstileToken || Boolean(checkoutSku)}
                    onClick={() => beginCheckout(product)}
                    type="button"
                  >
                    {checkoutSku === product.sku ? content.offer.processing : content.offer.buy(product.credits, price)}
                  </button>
                </article>
              )
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/12 p-3">
            <Turnstile
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
              onSuccess={setTurnstileToken}
              options={{
                action: GUARDIAN_REDRAW_CHECKOUT_ACTION,
                language: LOCALE_LANGUAGE_TAGS[session.locale],
                theme: 'dark',
              }}
              ref={turnstile}
              siteKey={TURNSTILE_SITE_KEY}
            />
            <p className="mt-2 text-center text-[10px] text-foreground-faint">{content.offer.security}</p>
          </div>
        </section>

        <OddsPanel content={content} redraw={redraw} />
        <CollectionPanel content={content} equippingId={equippingId} onEquip={equip} redraw={redraw} />
      </div>
    </main>
  )
}

function RevealScreen({
  content,
  equipping,
  flipped,
  onBack,
  onDrawAgain,
  onEquip,
  onFlip,
  paths,
  reportPublicId,
  result,
}: {
  content: (typeof GUARDIAN_LOVE_REDRAW_UI)[Locale]
  equipping: boolean
  flipped: boolean
  onBack: () => void
  onDrawAgain: () => void
  onEquip: () => void
  onFlip: () => void
  paths: ReturnType<typeof guardianReportPaths>
  reportPublicId: string
  result: GuardianLoveRedrawResult
}) {
  const card = result.acquisition
  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(6rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-65" />
      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.reveal.eyebrow}</p>
        <h1 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.reveal.title}</h1>

        <div className={`${revealStyles.revealStage} mt-6`}>
          <button
            aria-label={flipped ? card.artworkAlt : content.reveal.tap}
            className={revealStyles.revealButton}
            onClick={onFlip}
            type="button"
          >
            <span className={`${revealStyles.revealInner} ${flipped ? revealStyles.revealFlipped : ''}`}>
              <span className={`${revealStyles.revealFace} ${revealStyles.revealBack}`}>
                <span className="relative z-10 text-5xl">♡</span>
                <span className="absolute bottom-8 z-10 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  LOVE
                </span>
              </span>
              <span className={`${revealStyles.revealFace} ${revealStyles.revealFront}`}>
                <Image
                  alt={card.artworkAlt}
                  className="h-full w-full object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 82vw, 21rem"
                  src={card.artworkPath}
                />
              </span>
            </span>
          </button>
        </div>

        {!flipped ? (
          <p className="mt-5 animate-pulse text-xs font-semibold text-pink-100 motion-reduce:animate-none">
            {content.reveal.tap}
          </p>
        ) : (
          <section className="mx-auto mt-6 max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-5 shadow-2xl">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${card.rarity ? RARITY_STYLE[card.rarity] : RARITY_STYLE.orbit}`}
            >
              {card.rarity ? content.odds.rarityLabels[card.rarity] : ''}
            </span>
            <h2 className="mt-3 text-xl font-bold text-white">{card.title}</h2>
            <p className="mt-1 text-xs text-pink-200/80">{card.guardians}</p>
            <p className="mt-4 text-sm font-semibold leading-7 text-pink-50">{card.oneLine}</p>
            {result.guaranteedUnowned && (
              <p className="mt-4 rounded-xl bg-amber-200/8 px-3 py-2 text-xs font-semibold text-amber-100">
                {content.reveal.guaranteed}
              </p>
            )}
            {result.duplicate && (
              <p className="mt-3 text-xs text-foreground-subtle">{content.reveal.duplicate(card.acquisitionCount)}</p>
            )}
            <button
              className="mt-5 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              disabled={equipping || card.equipped}
              onClick={onEquip}
              type="button"
            >
              {card.equipped ? content.reveal.equipped : equipping ? content.reveal.equipping : content.reveal.equip}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold text-foreground-secondary disabled:opacity-40"
                disabled={result.state.credits.available < 1}
                onClick={onDrawAgain}
                type="button"
              >
                {content.reveal.drawAgain}
              </button>
              <button
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold text-foreground-secondary"
                onClick={onBack}
                type="button"
              >
                {result.state.credits.available < 1 ? content.reveal.buyMore : content.collection.title}
              </button>
            </div>
          </section>
        )}

        {flipped && (
          <aside className="mx-auto mt-5 max-w-md rounded-2xl border border-white/8 bg-white/4 p-4 text-left">
            <h2 className="text-sm font-bold text-white">{content.reveal.accountTitle}</h2>
            <p className="mt-2 text-xs leading-6 text-foreground-subtle">{content.reveal.accountBody}</p>
          </aside>
        )}
        <Link
          className="mt-6 inline-block text-xs text-foreground-subtle hover:text-white"
          href={`${paths.result}?report=${encodeURIComponent(reportPublicId)}`}
        >
          ← {content.navigation.backToReport}
        </Link>
      </div>
    </main>
  )
}

function OddsPanel({
  content,
  redraw,
}: {
  content: (typeof GUARDIAN_LOVE_REDRAW_UI)[Locale]
  redraw: GuardianLoveRedrawState
}) {
  return (
    <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/4 p-5 sm:p-7">
      <h2 className="text-sm font-bold text-white">{content.odds.title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {redraw.odds.map(({ rarity, weight, weightScale }) => (
          <div className={`rounded-2xl border p-3 ${RARITY_STYLE[rarity]}`} key={rarity}>
            <p className="text-[10px] font-bold">{content.odds.rarityLabels[rarity]}</p>
            <p className="mt-1 text-lg font-black">{percent(redraw.locale, weight / weightScale)}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-foreground-subtle">
        {content.odds.guarantee(redraw.guarantee.interval)}
      </p>
    </section>
  )
}

function CollectionPanel({
  content,
  equippingId,
  onEquip,
  redraw,
}: {
  content: (typeof GUARDIAN_LOVE_REDRAW_UI)[Locale]
  equippingId: string | null
  onEquip: (acquisitionPublicId: string) => void
  redraw: GuardianLoveRedrawState
}) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{content.collection.eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold text-white">{content.collection.title}</h2>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.collection.body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {redraw.cards.map((card) => (
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/4" key={card.cardEditionId}>
            <Image
              alt={card.artworkAlt}
              className="aspect-[3/4] w-full object-cover"
              height={480}
              src={card.artworkPath}
              width={360}
            />
            <div className="p-3">
              <div className="flex items-center justify-between gap-2 text-[9px]">
                <span className="font-bold text-pink-100">
                  {card.rarity ? content.odds.rarityLabels[card.rarity] : ''}
                </span>
                <span className="text-foreground-faint">{content.collection.ownedCount(card.acquisitionCount)}</span>
              </div>
              <button
                className="mt-3 w-full rounded-xl border border-white/10 px-2 py-2 text-[10px] font-bold text-foreground-secondary disabled:border-pink-200/15 disabled:bg-pink-200/8 disabled:text-pink-100"
                disabled={card.equipped || Boolean(equippingId)}
                onClick={() => onEquip(card.acquisitionPublicId)}
                type="button"
              >
                {card.equipped
                  ? content.reveal.equipped
                  : equippingId === card.acquisitionPublicId
                    ? content.reveal.equipping
                    : content.collection.equip}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function LoadingScreen({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <div className="text-center">
        <span aria-hidden className="text-3xl text-pink-100">
          ♡
        </span>
        <p className="mt-3 animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
      </div>
    </main>
  )
}

function ErrorScreen({ copy, onRetry, retry }: { copy: string; onRetry: () => void; retry: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <section className="max-w-sm rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-6 text-center">
        <p className="text-sm leading-6 text-foreground-muted">{copy}</p>
        <button
          className="mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          onClick={onRetry}
          type="button"
        >
          {retry}
        </button>
      </section>
    </main>
  )
}

function ErrorNotice({ copy }: { copy: string }) {
  return (
    <p
      className="mx-auto mt-5 max-w-xl rounded-2xl border border-rose-300/20 bg-rose-300/8 px-4 py-3 text-center text-xs leading-5 text-rose-100"
      role="alert"
    >
      {copy}
    </p>
  )
}

function money(locale: Locale, currency: string, amount: number): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function percent(locale: Locale, value: number): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], { style: 'percent', maximumFractionDigits: 1 }).format(
    value,
  )
}

function redrawEcommerce(
  sku: string,
  credits: number,
  amount: number,
  currency: string,
  transactionId?: string | null,
) {
  return {
    currency,
    ...(transactionId ? { transaction_id: transactionId } : {}),
    value: amount,
    items: [
      {
        item_id: sku,
        item_name: `Guardian love redraw ${credits}`,
        item_category: 'guardian_card_redraw',
        price: amount,
        quantity: 1,
      },
    ],
  }
}

function redrawErrorMessage(error: unknown, unavailable: string, noCredit: string, generic: string): string {
  if (error instanceof GuardianApiError) {
    if (error.slug === 'redraw-credit-required') {
      return noCredit
    }
    if (error.slug === 'forbidden' || error.slug === 'report-not-found' || error.slug === 'payment-required') {
      return unavailable
    }
  }
  return generic
}
