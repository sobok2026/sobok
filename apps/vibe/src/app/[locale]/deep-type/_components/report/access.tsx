import { CheckCircle } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import { cn } from '@/utils/cn'

import { FOCUS_CLASS_NAME } from '../../../../../components/focus'
import { CARD_CLASS_NAME, REPORT_TYPE } from '../../_lib/surface'
import type { DeepTypeContent } from '../../_lib/types'

/**
 * The post-payment acknowledgement, shown on the two screens a purchase can land on.
 *
 * A report that opens straight into its first section says nothing about the transaction that produced it: no
 * confirmation, no order id to quote, and — the one that costs support tickets — no statement of how to open
 * it again. The paywall promises a year of access against the buyer's e-mail and this is the first screen
 * after that promise, so it is where the promise has to be repeated.
 *
 * The e-mail itself is deliberately not printed. It would have to be carried through the PortOne redirect in
 * browser storage to get here, and the sentence works without it — the address is the buyer's own and they
 * typed it two screens ago.
 */
export function PurchaseReceipt({
  content,
  locale,
  orderId,
}: {
  content: DeepTypeContent
  locale: Locale
  orderId: string
}) {
  const { ui } = content

  return (
    <section
      aria-labelledby="report-receipt-title"
      className={cn(CARD_CLASS_NAME, 'border-page-success/30 bg-page-success/6')}
    >
      <div className="flex items-start gap-3">
        <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-page-success" stroke={1.8} />
        <div className="min-w-0">
          <h2 className="font-black text-lg text-page-ink" id="report-receipt-title">
            {ui.reportReceiptTitle}
          </h2>
          <p className={cn('mt-1.5', REPORT_TYPE.copy)}>{ui.reportReceiptBody}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-page-border border-t pt-4">
        <dl className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <dt className="text-page-ink-muted text-sm">{ui.reportReceiptOrderLabel}</dt>
          {/* Selectable and figure-aligned: this is the string a buyer pastes into a support message. */}
          <dd className="min-w-0 break-all font-bold text-page-ink text-sm tabular-nums">{orderId}</dd>
        </dl>
        <Link
          className={cn(
            'ml-auto inline-flex min-h-11 items-center font-bold text-page-accent-strong text-sm underline underline-offset-4 print:hidden',
            FOCUS_CLASS_NAME,
          )}
          href={`/${locale}/contact`}
        >
          {ui.reportReceiptSupportCta}
        </Link>
      </div>
    </section>
  )
}

/**
 * How to get back in, said on every copy of the report rather than only after a purchase. A reader who closed
 * the tab a week ago is the person who needs this sentence, and they are never on the checkout return.
 */
export function ReportAccessNote({ content, locale }: { content: DeepTypeContent; locale: Locale }) {
  const { ui } = content

  return (
    <section aria-labelledby="report-access-title" className={cn(CARD_CLASS_NAME, 'bg-page-soft/60')}>
      <h2 className="font-black text-base text-page-ink" id="report-access-title">
        {ui.reportAccessTitle}
      </h2>
      <p className={cn('mt-2', REPORT_TYPE.meta)}>{ui.reportAccessBody}</p>
      <Link
        className={cn(
          'mt-3 inline-flex min-h-11 items-center font-bold text-page-accent-strong text-sm underline underline-offset-4 print:hidden',
          FOCUS_CLASS_NAME,
        )}
        href={`/${locale}/deep-type/reopen`}
      >
        {ui.reopenCta}
      </Link>
    </section>
  )
}
