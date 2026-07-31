import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import { cn } from '@/utils/cn'

import { FOCUS_CLASS_NAME } from '../../../../../components/focus'
import { CARD_CLASS_NAME, REPORT_TYPE } from '../../_lib/surface'
import type { DeepTypeContent } from '../../_lib/types'

/**
 * The order record, at the foot of the document where records belong.
 *
 * It replaces a receipt at the top and an access note at the bottom, which were two halves of one answer to
 * "something is wrong with this, now what": the number to quote, how long it stays open, and where to write.
 * Splitting them meant the top of a paid document opened on a transaction rather than on the document, and the
 * one reader who needed the number most — someone opening a re-open link months later — got neither half,
 * because `/reopen/exchange` never handed the payment id back.
 *
 * Every field is optional and the card renders whatever it was given. A report reached without an order id
 * still owes the reader the access sentence, and a row with no settlement timestamp still owes them the rest.
 */
export function ReportRecord({
  accessExpiresAt,
  content,
  locale,
  orderId,
}: {
  accessExpiresAt: string | null
  content: DeepTypeContent
  locale: Locale
  orderId?: string | null
}) {
  const { ui } = content
  const expiry = accessExpiresAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(accessExpiresAt))
    : null

  return (
    <section aria-labelledby="report-record-title" className={cn(CARD_CLASS_NAME, 'bg-page-soft/60')}>
      <h2 className="font-black text-base text-page-ink" id="report-record-title">
        {ui.reportRecordTitle}
      </h2>

      {expiry ? (
        <p className={cn('mt-2', REPORT_TYPE.meta)}>{ui.reportRecordAccess.replace('{date}', expiry)}</p>
      ) : null}

      {orderId ? (
        <dl className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="text-page-ink-muted text-sm">{ui.reportRecordOrderLabel}</dt>
          {/* Selectable and figure-aligned: this is the string a buyer pastes into a support message. */}
          <dd className="min-w-0 break-all font-bold text-page-ink text-sm tabular-nums">{orderId}</dd>
        </dl>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 print:hidden">
        <Link
          className={cn(
            'inline-flex min-h-11 items-center font-bold text-page-accent-strong text-sm underline underline-offset-4',
            FOCUS_CLASS_NAME,
          )}
          href={`/${locale}/deep-type/reopen`}
        >
          {ui.reopenCta}
        </Link>
        <Link
          className={cn(
            'inline-flex min-h-11 items-center font-bold text-page-ink-soft text-sm underline underline-offset-4',
            FOCUS_CLASS_NAME,
          )}
          href={`/${locale}/contact`}
        >
          {ui.reportRecordSupportCta}
        </Link>
      </div>
    </section>
  )
}
