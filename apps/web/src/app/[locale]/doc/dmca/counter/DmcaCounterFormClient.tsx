'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  dmcaEmail: string
}

const inputClass =
  'w-full rounded-xl border border-border bg-overlay/60 p-3 text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-border-2'
const textareaClass = `${inputClass} min-h-28 resize-y`

export default function DmcaCounterFormClient({ dmcaEmail }: Props) {
  const locale = useLocale()
  const t = useTranslations('Doc.dmca.counter.form')
  const formRef = useRef<HTMLFormElement | null>(null)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const formAction = `/api/v1/dmca/counter?${new URLSearchParams({ locale })}`

  const mailtoHref = template
    ? `mailto:${dmcaEmail}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(template)}`
    : `mailto:${dmcaEmail}`

  async function handleCopyTemplate() {
    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    const form = formRef.current

    if (!form?.reportValidity()) {
      setIsGenerating(false)
      return
    }

    const formData = new FormData(form)

    const nextTemplate = [
      t('mailSubject'),
      `[${t('title')}]`,
      '',
      t('claimantSection'),
      `- ${t('claimantName')}: ${getValue(formData, 'claimant-name')}`,
      `- ${t('claimantEmail')}: ${getValue(formData, 'claimant-email')}`,
      `- ${t('claimantPhone')}: ${getValue(formData, 'claimant-phone')}`,
      `- ${t('claimantAddress')}:`,
      getValue(formData, 'claimant-address') || t('empty'),
      '',
      t('relatedSection'),
      `- ${t('relatedNoticeId')}: ${getValue(formData, 'related-notice-id') || t('optional')}`,
      `- ${t('infringingReferences')}:`,
      getValue(formData, 'infringing-references') || t('empty'),
      '',
      t('claimSection'),
      `- ${t('claimDetails')}:`,
      getValue(formData, 'claim-details') || t('empty'),
      `- ${t('evidenceLinks')}:`,
      getValue(formData, 'evidence-links') || t('optional'),
      '',
      t('statementsSection'),
      `- ${t('goodFaith')}: ${isChecked(formData, 'good-faith-confirmed') ? 'Y' : 'N'}`,
      `- ${t('perjury')}: ${isChecked(formData, 'perjury-confirmed') ? 'Y' : 'N'}`,
      `- ${t('signature')}: ${getValue(formData, 'signature')}`,
    ].join('\n')

    setTemplate(nextTemplate)

    try {
      await navigator.clipboard.writeText(nextTemplate)
      toast.success(t('copySuccess'))
    } catch {
      toast.error(t('copyError'))
    }

    setIsGenerating(false)
  }

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-6" method="post" ref={formRef}>
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t('claimantSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="claimant-name">
              {t('claimantName')}
            </label>
            <input className={inputClass} id="claimant-name" name="claimant-name" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="claimant-email">
              {t('claimantEmail')}
            </label>
            <input className={inputClass} id="claimant-email" name="claimant-email" required type="email" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="claimant-address">
              {t('claimantAddress')}
            </label>
            <textarea className={textareaClass} id="claimant-address" name="claimant-address" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="claimant-phone">
              {t('claimantPhone')}
            </label>
            <input className={inputClass} id="claimant-phone" name="claimant-phone" required />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t('relatedSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="related-notice-id">
              {t('relatedNoticeId')}
            </label>
            <input className={inputClass} id="related-notice-id" name="related-notice-id" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="infringing-references">
              {t('infringingReferences')}
            </label>
            <textarea className={textareaClass} id="infringing-references" name="infringing-references" required />
            <p className="text-xs text-foreground-subtle">{t('infringingHelp')}</p>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t('claimSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="claim-details">
              {t('claimDetails')}
            </label>
            <textarea className={textareaClass} id="claim-details" name="claim-details" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="evidence-links">
              {t('evidenceLinks')}
            </label>
            <textarea className={textareaClass} id="evidence-links" name="evidence-links" />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t('statementsSection')}</h2>

          <label className="flex gap-2 text-sm text-foreground-secondary">
            <input
              className="mt-0.5 accent-foreground"
              id="good-faith-confirmed"
              name="good-faith-confirmed"
              required
              type="checkbox"
            />
            <span>{t('goodFaith')}</span>
          </label>

          <label className="flex gap-2 text-sm text-foreground-secondary">
            <input
              className="mt-0.5 accent-foreground"
              id="perjury-confirmed"
              name="perjury-confirmed"
              required
              type="checkbox"
            />
            <span>{t('perjury')}</span>
          </label>

          <div className="grid gap-2">
            <label className="text-xs text-foreground-muted" htmlFor="signature">
              {t('signature')}
            </label>
            <input className={inputClass} id="signature" name="signature" required />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-disabled={isGenerating}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-foreground-faint hover:bg-surface-2 aria-disabled:opacity-60"
            type="submit"
          >
            {t('submit')}
          </button>
          <button
            aria-disabled={isGenerating}
            className="rounded-xl border border-border bg-overlay/30 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface aria-disabled:opacity-60"
            onClick={handleCopyTemplate}
            type="button"
          >
            {t('copyTemplate')}
          </button>
          <a
            className="rounded-xl border border-border bg-overlay/30 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface"
            href={mailtoHref}
          >
            {t('openEmailApp')}
          </a>
        </div>
      </form>

      {template && (
        <div className="rounded-2xl border border-border bg-overlay/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">{t('emailTemplate')}</div>
            <a
              className="text-xs underline underline-offset-4 text-foreground-secondary hover:text-foreground"
              href={mailtoHref}
            >
              {dmcaEmail}
            </a>
          </div>
          <textarea className={`${textareaClass} mt-3`} readOnly value={template} />
        </div>
      )}
    </div>
  )
}

function getValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}
