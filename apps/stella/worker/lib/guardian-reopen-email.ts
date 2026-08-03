import type { Locale } from '@sobok/domain/locale'

type GuardianReopenEmailLink = {
  paidAt: Date
  url: string
}

type GuardianReopenEmailInput = {
  apiKey: string
  from: string
  idempotencyKey: string
  links: GuardianReopenEmailLink[]
  locale: Locale
  reason: 'purchase' | 'request'
  receipt?: {
    amount: number
    currency: string
    orderName: string
    paidAt: Date
    paymentId: string
  }
  replyTo: string
  to: string
}

const EMPTY_COPY = {
  purchaseSubject: '',
  requestSubject: '',
  preview: '',
  purchaseIntro: '',
  requestIntro: '',
  cta: '',
  expiry: '',
  ignore: '',
  purchased: '',
  receiptTitle: '',
  order: '',
  amount: '',
  orderNumber: '',
}

const COPY = {
  ko: {
    purchaseSubject: '결제가 완료됐어요 · 별자리 수호령 리포트',
    requestSubject: '별자리 수호령 리포트 재열람 링크',
    preview: '결제한 별자리 수호령 리포트를 안전하게 이어서 볼 수 있어요.',
    purchaseIntro: '결제가 완료됐어요. 아래 버튼을 눌러 맞춤 질문을 이어가거나 완성된 리포트를 열어보세요.',
    requestIntro: '요청하신 별자리 수호령 리포트 재열람 링크예요.',
    cta: '내 리포트 열기',
    expiry: '각 링크는 15분 동안 한 번만 사용할 수 있어요.',
    ignore: '직접 요청하지 않은 재열람 메일이라면 이 메일을 무시해 주세요.',
    purchased: '구매일',
    receiptTitle: '결제 내역',
    order: '상품',
    amount: '결제 금액',
    orderNumber: '주문 번호',
  },
  en: EMPTY_COPY,
  ja: EMPTY_COPY,
  zh: EMPTY_COPY,
} satisfies Record<Locale, typeof EMPTY_COPY>

export class GuardianReopenEmailError extends Error {
  readonly code: string

  constructor(code: string) {
    super(`Guardian reopen email failed: ${code}`)
    this.name = 'GuardianReopenEmailError'
    this.code = code
  }
}

export async function sendGuardianReopenEmail(
  input: GuardianReopenEmailInput,
): Promise<{ providerMessageId: string | null }> {
  const copy = COPY[input.locale]
  const rows = input.links
    .map(
      ({ paidAt, url }) => `
        <div style="margin:20px 0;padding:18px;border:1px solid #eadff2;border-radius:18px;background:#fff">
          <p style="margin:0 0 14px;color:#75687d;font-size:13px">${copy.purchased}: ${dateLabel(paidAt, input.locale)}</p>
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6f4a86;color:#fff;text-decoration:none;font-weight:700">${copy.cta}</a>
        </div>`,
    )
    .join('')
  const textLinks = input.links
    .map(({ paidAt, url }) => `${copy.purchased}: ${dateLabel(paidAt, input.locale)}\n${copy.cta}: ${url}`)
    .join('\n\n')
  const intro = input.reason === 'purchase' ? copy.purchaseIntro : copy.requestIntro
  const subject = input.reason === 'purchase' ? copy.purchaseSubject : copy.requestSubject
  const receiptHtml = input.receipt
    ? `<div style="margin:20px 0;padding:18px;border-radius:18px;background:#efe6f4">
        <p style="margin:0 0 12px;font-size:14px;font-weight:700">${copy.receiptTitle}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${copy.order}: ${escapeHtml(input.receipt.orderName)}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${copy.amount}: ${escapeHtml(amountLabel(input.receipt.amount, input.receipt.currency, input.locale))}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${copy.purchased}: ${dateLabel(input.receipt.paidAt, input.locale)}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${copy.orderNumber}: ${escapeHtml(input.receipt.paymentId)}</p>
      </div>`
    : ''
  const receiptText = input.receipt
    ? `${copy.receiptTitle}\n${copy.order}: ${input.receipt.orderName}\n${copy.amount}: ${amountLabel(input.receipt.amount, input.receipt.currency, input.locale)}\n${copy.purchased}: ${dateLabel(input.receipt.paidAt, input.locale)}\n${copy.orderNumber}: ${input.receipt.paymentId}\n\n`
    : ''
  const body = JSON.stringify({
    from: input.from,
    to: [input.to],
    reply_to: input.replyTo,
    subject,
    tags: [
      { name: 'product', value: 'stella_guardian' },
      { name: 'reason', value: input.reason },
    ],
    html: `<!doctype html><html><body style="margin:0;background:#f8f3fb;font-family:Arial,sans-serif;color:#261a2c"><div style="display:none;max-height:0;overflow:hidden">${copy.preview}</div><main style="max-width:560px;margin:0 auto;padding:40px 20px"><h1 style="margin:0;font-size:24px">Stella · 별자리 수호령</h1><p style="margin:18px 0 0;line-height:1.7">${intro}</p>${receiptHtml}${rows}<p style="margin:24px 0 0;color:#75687d;font-size:13px;line-height:1.7">${copy.expiry}<br>${copy.ignore}</p></main></body></html>`,
    text: `Stella · 별자리 수호령\n\n${intro}\n\n${receiptText}${textLinks}\n\n${copy.expiry}\n${copy.ignore}`,
  })

  const backoff = [500, 1500, 4000]
  let lastCode = 'unknown'
  for (let attempt = 0; attempt < backoff.length; attempt++) {
    let response: Response
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': input.idempotencyKey,
        },
        body,
      })
    } catch {
      lastCode = 'network'
      if (attempt < backoff.length - 1) {
        await sleep(backoff[attempt] ?? 4000)
      }
      continue
    }

    if (response.ok) {
      const payload = (await response.json().catch(() => null)) as { id?: unknown } | null
      return { providerMessageId: typeof payload?.id === 'string' ? payload.id : null }
    }

    lastCode = `resend_${response.status}`
    await response.body?.cancel()
    if (response.status !== 409 && response.status !== 429 && response.status < 500) {
      throw new GuardianReopenEmailError(lastCode)
    }
    if (attempt < backoff.length - 1) {
      await sleep(backoff[attempt] ?? 4000)
    }
  }

  throw new GuardianReopenEmailError(lastCode)
}

function amountLabel(amount: number, currency: string, locale: Locale): string {
  const languageTag = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' }[locale]
  return new Intl.NumberFormat(languageTag, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function dateLabel(date: Date, locale: Locale): string {
  const languageTag = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' }[locale]
  return new Intl.DateTimeFormat(languageTag, { dateStyle: 'medium', timeZone: 'Asia/Seoul' }).format(date)
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return entities[character] ?? character
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
