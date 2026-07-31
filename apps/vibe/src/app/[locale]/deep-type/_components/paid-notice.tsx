'use client'

import { CheckCircle } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'

import type { SettledPayment } from '../_lib/pending-checkout'
import { formatPrice } from '../_lib/price'
import type { DeepTypeContent } from '../_lib/types'

/**
 * The moment the money moves, said on the screen that follows it.
 *
 * This is one half of the purchase; the order record at the foot of the report is the other. The split is what
 * the two were owed: a buyer who has just paid wants to know the amount was right and where the receipt is
 * going, and a buyer opening the document six months later wants a number to quote and a way back in. Saying
 * both things in both places was how the redirect flow ended up confirming the same purchase twice while the
 * e-mail re-open confirmed it never.
 *
 * The address is here and nowhere else. A mistyped e-mail is the one mistake that permanently costs somebody
 * the report they paid for, and this is the last screen where anybody can still catch it.
 */
export function PaidNotice({
  content,
  locale,
  payment,
}: {
  content: DeepTypeContent
  locale: Locale
  payment: SettledPayment
}) {
  const { ui } = content

  return (
    <div className="mx-auto mb-9 flex max-w-md items-start gap-3 rounded-3xl border border-page-success/24 bg-page-success/8 p-4 text-left">
      <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-page-success" stroke={1.8} />
      <div className="min-w-0">
        <p className="font-black text-sm">{ui.reportPaidTitle}</p>
        <p className="mt-1 break-prose text-page-ink-soft text-sm leading-6">
          {ui.reportPaidBody.replace('{price}', formatPrice(locale, payment.currency, payment.amount))}
        </p>
        <p className="mt-1 break-prose text-page-ink-soft text-sm leading-6">
          {ui.reportPaidEmailNote.replace('{email}', payment.email)}
        </p>
      </div>
    </div>
  )
}
