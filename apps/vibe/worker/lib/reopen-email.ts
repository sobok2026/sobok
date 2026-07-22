type Locale = 'ko' | 'en' | 'ja' | 'zh'

type ReopenEmailLink = {
  paidAt: Date
  url: string
}

type ReopenEmailInput = {
  apiKey: string
  from: string
  idempotencyKey: string
  links: ReopenEmailLink[]
  locale: Locale
  replyTo: string
  to: string
}

const COPY = {
  ko: {
    subject: '딥타입 감정서 재열람 링크',
    preview: '요청하신 감정서를 다시 열 수 있는 링크예요.',
    intro: '요청하신 딥타입 감정서 재열람 링크입니다.',
    cta: '감정서 열기',
    expiry: '이 링크는 15분 동안 한 번만 사용할 수 있어요.',
    ignore: '직접 요청하지 않았다면 이 메일을 무시해 주세요.',
    purchased: '구매일',
  },
  en: {
    subject: 'Your DeepType report link',
    preview: 'Use this link to re-open your DeepType report.',
    intro: 'Here is the link you requested to re-open your DeepType report.',
    cta: 'Open report',
    expiry: 'Each link can be used once and expires in 15 minutes.',
    ignore: 'If you did not request this email, you can ignore it.',
    purchased: 'Purchased',
  },
  ja: {
    subject: 'DeepType鑑定書の再閲覧リンク',
    preview: 'DeepType鑑定書をもう一度開くためのリンクです。',
    intro: 'ご依頼のDeepType鑑定書再閲覧リンクです。',
    cta: '鑑定書を開く',
    expiry: '各リンクは15分以内に1回だけ使用できます。',
    ignore: 'ご自身で依頼していない場合は、このメールを無視してください。',
    purchased: '購入日',
  },
  zh: {
    subject: 'DeepType 报告重新查看链接',
    preview: '使用此链接重新打开您的 DeepType 报告。',
    intro: '这是您申请的 DeepType 报告重新查看链接。',
    cta: '打开报告',
    expiry: '每个链接只能使用一次，并将在15分钟后失效。',
    ignore: '如果并非您本人申请，请忽略此邮件。',
    purchased: '购买日期',
  },
} satisfies Record<Locale, Record<string, string>>

export async function sendReopenEmail(input: ReopenEmailInput): Promise<void> {
  const copy = COPY[input.locale]
  const rows = input.links
    .map(
      ({ paidAt, url }) => `
        <div style="margin:20px 0;padding:18px;border:1px solid #eadfda;border-radius:16px;background:#fff">
          <p style="margin:0 0 14px;color:#786a68;font-size:13px">${copy.purchased}: ${dateLabel(paidAt, input.locale)}</p>
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#ff4d6d;color:#fff;text-decoration:none;font-weight:700">${copy.cta}</a>
        </div>`,
    )
    .join('')

  const textLinks = input.links
    .map(({ paidAt, url }) => `${copy.purchased}: ${dateLabel(paidAt, input.locale)}\n${copy.cta}: ${url}`)
    .join('\n\n')

  const body = JSON.stringify({
    from: input.from,
    to: [input.to],
    reply_to: input.replyTo,
    subject: copy.subject,
    html: `<!doctype html><html><body style="margin:0;background:#fdfaf6;font-family:Arial,sans-serif;color:#241617"><div style="display:none;max-height:0;overflow:hidden">${copy.preview}</div><main style="max-width:560px;margin:0 auto;padding:40px 20px"><h1 style="margin:0;font-size:24px">vibe · DeepType</h1><p style="margin:18px 0 0;line-height:1.7">${copy.intro}</p>${rows}<p style="margin:24px 0 0;color:#786a68;font-size:13px;line-height:1.7">${copy.expiry}<br>${copy.ignore}</p></main></body></html>`,
    text: `vibe · DeepType\n\n${copy.intro}\n\n${textLinks}\n\n${copy.expiry}\n${copy.ignore}`,
  })

  const backoff = [500, 1500, 4000]
  let lastError = 'unknown'
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
    } catch (error) {
      lastError = String(error)
      if (attempt === backoff.length - 1) {
        break
      }
      await sleep(backoff[attempt] ?? 4000)
      continue
    }

    if (response.ok) {
      return
    }
    lastError = `resend ${response.status}`
    if (response.status !== 409 && response.status !== 429 && response.status < 500) {
      throw new Error(lastError)
    }
    if (attempt < backoff.length - 1) {
      await sleep(backoff[attempt] ?? 4000)
    }
  }

  throw new Error(lastError)
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
