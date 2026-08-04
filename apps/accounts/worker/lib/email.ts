import type { SobokAuthorityEmail } from '@sobok/auth/authority'
import type { Bindings } from '../env'

const copy = {
  'email-verification': {
    subject: '소복 계정 이메일을 확인해 주세요',
    heading: '이메일 확인',
    body: '아래 버튼을 눌러 소복 계정의 이메일을 확인해 주세요.',
    action: '이메일 확인하기',
  },
  'magic-link': {
    subject: '소복 계정 로그인 링크',
    heading: '로그인 링크',
    body: '요청하신 소복 계정 로그인 링크예요. 링크는 잠시 후 만료됩니다.',
    action: '소복 계정에 로그인',
  },
  'password-reset': {
    subject: '소복 계정 비밀번호 재설정',
    heading: '비밀번호 재설정',
    body: '아래 버튼을 눌러 새 비밀번호를 설정해 주세요.',
    action: '비밀번호 재설정',
  },
} as const

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case "'":
        return '&#39;'
      default:
        return '&quot;'
    }
  })
}

export async function deliverAccountEmail(env: Bindings, message: SobokAuthorityEmail): Promise<void> {
  const apiKey = await env.ACCOUNTS_RESEND_API_KEY.get()
  if (!apiKey) throw new Error('ACCOUNTS_RESEND_API_KEY is empty')
  const content = copy[message.kind]
  const url = escapeHtml(message.url)
  const greeting = message.name ? `${escapeHtml(message.name)}님, ` : ''

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ACCOUNTS_EMAIL_FROM,
      reply_to: env.ACCOUNTS_EMAIL_REPLY_TO,
      to: [message.to],
      subject: content.subject,
      text: `${message.name ? `${message.name}님, ` : ''}${content.body}\n\n${message.url}`,
      html: `<main style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#17131f"><p>${greeting}${content.body}</p><p style="margin:32px 0"><a href="${url}" style="display:inline-block;border-radius:999px;background:#6b4eff;color:white;padding:13px 22px;text-decoration:none;font-weight:700">${content.action}</a></p><p style="font-size:13px;color:#6f6878;word-break:break-all">${url}</p></main>`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend rejected account email (${response.status})`)
  }
}
