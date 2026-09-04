import type { Locale } from '@sobok/domain/locale'

type GuardianReopenEmailLink = { paidAt: Date; timeZone: string; url: string }

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
    accessExpiresAt: Date
    paymentId: string
    timeZone: string
  }
  replyTo: string
  to: string
}

const COPY = {
  purchaseSubject: '결제가 완료됐어요 · 수호령 내일 선공개 7일권',
  requestSubject: '수호령 카드 보관함 다시 열기',
  preview: '선공개권과 보관한 수호령 카드를 안전하게 이어서 볼 수 있어요.',
  purchaseIntro: '결제가 완료됐어요. 아래 버튼을 누르면 내일의 수호령 카드와 카드 보관함을 열 수 있어요.',
  requestIntro: '요청하신 수호령 카드 보관함 재열람 링크예요.',
  cta: '수호령 카드 열기',
  linkExpiry: '각 링크는 15분 동안 한 번만 사용할 수 있어요.',
  ignore: '직접 요청하지 않은 메일이라면 이 메일을 무시해 주세요.',
  purchased: '구매일',
  passUntil: '선공개권 만료',
  receiptTitle: '결제 내역',
  order: '상품',
  amount: '결제 금액',
  orderNumber: '주문 번호',
} as const

export class GuardianReopenEmailError extends Error {
  readonly code: string

  constructor(code: string) {
    super(`Guardian pass recovery email failed: ${code}`)
    this.name = 'GuardianReopenEmailError'
    this.code = code
  }
}

export async function sendGuardianReopenEmail(
  input: GuardianReopenEmailInput,
): Promise<{ providerMessageId: string | null }> {
  const rows = input.links
    .map(
      ({ paidAt, timeZone, url }) => `
        <div style="margin:20px 0;padding:18px;border:1px solid #eadff2;border-radius:18px;background:#fff">
          <p style="margin:0 0 14px;color:#75687d;font-size:13px">${COPY.purchased}: ${dateLabel(paidAt, timeZone)}</p>
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#6f4a86;color:#fff;text-decoration:none;font-weight:700">${COPY.cta}</a>
        </div>`,
    )
    .join('')
  const textLinks = input.links
    .map(({ paidAt, timeZone, url }) => `${COPY.purchased}: ${dateLabel(paidAt, timeZone)}\n${COPY.cta}: ${url}`)
    .join('\n\n')
  const intro = input.reason === 'purchase' ? COPY.purchaseIntro : COPY.requestIntro
  const subject = input.reason === 'purchase' ? COPY.purchaseSubject : COPY.requestSubject
  const receiptHtml = input.receipt
    ? `<div style="margin:20px 0;padding:18px;border-radius:18px;background:#efe6f4">
        <p style="margin:0 0 12px;font-size:14px;font-weight:700">${COPY.receiptTitle}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${COPY.order}: ${escapeHtml(input.receipt.orderName)}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${COPY.amount}: ${escapeHtml(amountLabel(input.receipt.amount, input.receipt.currency))}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${COPY.purchased}: ${dateLabel(input.receipt.paidAt, input.receipt.timeZone)}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${COPY.passUntil}: ${dateTimeLabel(input.receipt.accessExpiresAt, input.receipt.timeZone)}</p>
        <p style="margin:5px 0;color:#75687d;font-size:13px">${COPY.orderNumber}: ${escapeHtml(input.receipt.paymentId)}</p>
      </div>`
    : ''
  const receiptText = input.receipt
    ? `${COPY.receiptTitle}\n${COPY.order}: ${input.receipt.orderName}\n${COPY.amount}: ${amountLabel(input.receipt.amount, input.receipt.currency)}\n${COPY.purchased}: ${dateLabel(input.receipt.paidAt, input.receipt.timeZone)}\n${COPY.passUntil}: ${dateTimeLabel(input.receipt.accessExpiresAt, input.receipt.timeZone)}\n${COPY.orderNumber}: ${input.receipt.paymentId}\n\n`
    : ''
  const body = JSON.stringify({
    from: input.from,
    to: [input.to],
    reply_to: input.replyTo,
    subject,
    tags: [
      { name: 'product', value: 'stella_guardian_pass' },
      { name: 'reason', value: input.reason },
    ],
    html: `<!doctype html><html><body style="margin:0;background:#f8f3fb;font-family:Arial,sans-serif;color:#261a2c"><div style="display:none;max-height:0;overflow:hidden">${COPY.preview}</div><main style="max-width:560px;margin:0 auto;padding:40px 20px"><h1 style="margin:0;font-size:24px">Stella · 오늘의 수호령</h1><p style="margin:18px 0 0;line-height:1.7">${intro}</p>${receiptHtml}${rows}<p style="margin:24px 0 0;color:#75687d;font-size:13px;line-height:1.7">${COPY.linkExpiry}<br>${COPY.ignore}</p></main></body></html>`,
    text: `Stella · 오늘의 수호령\n\n${intro}\n\n${receiptText}${textLinks}\n\n${COPY.linkExpiry}\n${COPY.ignore}`,
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
      if (attempt < backoff.length - 1) await sleep(backoff[attempt] ?? 4000)
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
    if (attempt < backoff.length - 1) await sleep(backoff[attempt] ?? 4000)
  }

  throw new GuardianReopenEmailError(lastCode)
}

function amountLabel(amount: number, currency: string): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function dateLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone }).format(date)
}

function dateTimeLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date)
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
