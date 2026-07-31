import type { Locale } from '@sobok/domain/locale'

import type { CheckoutFailure } from '@/app/[locale]/deep-type/_lib/checkout-outcome'

/** The recoveries this screen can offer. Which ones a state gets, and in what order, is decided in the view. */
export type DeepTypeCheckoutReturnAction = 'contact' | 'payAgain' | 'reopen' | 'restart' | 'retry'

export type DeepTypeCheckoutReturnContent = {
  actions: Record<DeepTypeCheckoutReturnAction, string>
  checking: { body: string; hint: string; title: string }
  /** Subject line for the support mail, so the first reply already knows which order it is about. */
  contactSubject: string
  eyebrow: string
  metadata: { description: string; title: string }
  orderReference: string
  paid: { body: string; emailNote: string; title: string }
  paidElsewhere: { body: string; title: string }
  /** Frames the PG's own wording so it is never mistaken for ours. */
  pgMessage: string
  reasons: Record<CheckoutFailure, { body: string; title: string }>
}

export const DEEP_TYPE_CHECKOUT_RETURN = {
  ko: {
    metadata: { title: '겉속유형 결제 확인', description: '겉속유형 결제를 확인하고 심층 리포트를 이어서 만들어요.' },
    eyebrow: 'DeepType',
    checking: {
      title: '결제를 확인하고 있어요',
      body: '이 화면을 열어 두면 확인이 끝나는 대로 심화 문항으로 이어져요.',
      hint: '결제사 응답이 조금 늦어지고 있어요. 조금만 더 기다려 주세요.',
    },
    paid: {
      title: '결제가 끝났어요',
      body: '{price} 결제를 확인했어요. 완성된 리포트는 1년 동안 다시 열 수 있어요.',
      emailNote: '영수증과 재열람 링크는 {email}로 보내요.',
    },
    paidElsewhere: {
      title: '결제는 확인됐어요',
      body: '이 브라우저에는 이어서 열 정보가 남아 있지 않아요. 구매에 쓴 이메일로 열람 링크를 받아 리포트를 열어요.',
    },
    reasons: {
      declined: {
        title: '결제가 완료되지 않았어요',
        body: '결제사에서 결제를 끝내지 못했다고 알려 왔어요. 금액은 청구되지 않으니 다시 결제하면 돼요.',
      },
      pending: {
        title: '아직 결제 확인이 안 됐어요',
        body: '결제사에서 완료 응답이 오지 않았어요. 방금 결제했다면 잠시 뒤 다시 확인해 주세요.',
      },
      notFound: {
        title: '결제 번호를 찾지 못했어요',
        body: '이 화면이 들고 온 결제 번호가 서버에 없어요. 결제를 마친 적이 있다면 구매에 쓴 이메일로 리포트를 열어요.',
      },
      refunded: {
        title: '이미 환불된 결제예요',
        body: '이 결제는 취소돼서 열어 둘 리포트가 없어요. 다시 받고 싶으면 처음부터 시작해요.',
      },
      mismatch: {
        title: '결제 금액이 맞지 않아요',
        body: '결제된 금액이 주문 금액과 달라서 리포트를 열지 않았어요. 아래 주문 번호와 함께 문의하면 바로 확인해 드려요.',
      },
      unavailable: {
        title: '지금은 확인할 수 없어요',
        body: '연결이 끊겼거나 서버가 응답하지 않아요. 결제는 그대로 있으니 잠시 뒤 다시 확인해 주세요.',
      },
      noContext: {
        title: '여기서 확인할 결제가 없어요',
        body: '결제를 마치면 이 화면으로 돌아와요. 이미 결제했다면 구매에 쓴 이메일로 리포트를 열어요.',
      },
    },
    actions: {
      retry: '결제 다시 확인',
      payAgain: '다시 결제하기',
      reopen: '이메일로 내 리포트 열기',
      restart: '겉속유형 처음으로',
      contact: '문의하기',
    },
    orderReference: '주문 번호 {id}',
    pgMessage: '결제사 안내 · {message}',
    contactSubject: '겉속유형 결제 문의 ({id})',
  },
  en: {
    metadata: {
      title: 'Verify DeepType payment',
      description: 'Verify your DeepType payment and continue your report.',
    },
    eyebrow: 'DeepType',
    checking: {
      title: 'Verifying your payment',
      body: 'Keep this window open. The follow-up questions start as soon as the payment is confirmed.',
      hint: 'The payment provider is taking a little longer than usual. Hang on a moment.',
    },
    paid: {
      title: 'Payment complete',
      body: 'We confirmed your {price} payment. The finished report stays open to you for one year.',
      emailNote: 'The receipt and your re-open link go to {email}.',
    },
    paidElsewhere: {
      title: 'Your payment is confirmed',
      body: 'This browser no longer holds what it needs to continue. Request a link with your purchase email to open the report.',
    },
    reasons: {
      declined: {
        title: 'The payment did not go through',
        body: 'The payment provider reported that it was not completed. Nothing was charged, so you can pay again.',
      },
      pending: {
        title: 'Not confirmed yet',
        body: 'The provider has not reported a completed payment. If you just paid, check again in a moment.',
      },
      notFound: {
        title: 'We could not find that payment',
        body: 'The payment id this page arrived with is not on our side. If you did complete a purchase, open the report with your purchase email.',
      },
      refunded: {
        title: 'This payment was refunded',
        body: 'The purchase was cancelled, so there is no report to open. Start over if you would like one.',
      },
      mismatch: {
        title: 'The charged amount does not match',
        body: 'The amount charged differs from the order, so we have not opened the report. Contact us with the order number below and we will sort it out.',
      },
      unavailable: {
        title: 'We cannot check right now',
        body: 'The connection dropped or the server did not answer. Your payment is untouched — try again shortly.',
      },
      noContext: {
        title: 'There is no payment to verify here',
        body: 'You land on this screen after paying. If you already have, open your report with your purchase email.',
      },
    },
    actions: {
      retry: 'Check again',
      payAgain: 'Pay again',
      reopen: 'Open my report by email',
      restart: 'Back to DeepType',
      contact: 'Contact support',
    },
    orderReference: 'Order {id}',
    pgMessage: 'From the payment provider · {message}',
    contactSubject: 'DeepType payment enquiry ({id})',
  },
  ja: {
    metadata: { title: 'DeepType決済確認', description: 'DeepTypeの決済結果を確認し、鑑定書作成を続けます。' },
    eyebrow: 'DeepType',
    checking: {
      title: '決済を確認しています',
      body: 'この画面を閉じずにお待ちください。確認が済み次第、追加の質問へ進みます。',
      hint: '決済会社の応答が少し遅れています。もう少しお待ちください。',
    },
    paid: {
      title: '決済が完了しました',
      body: '{price}のお支払いを確認しました。完成した鑑定書は1年間いつでも開けます。',
      emailNote: '領収書と再閲覧リンクは{email}へお送りします。',
    },
    paidElsewhere: {
      title: '決済は確認できました',
      body: 'このブラウザには続きに必要な情報が残っていません。購入時のメールで閲覧リンクを受け取ってお開きください。',
    },
    reasons: {
      declined: {
        title: '決済が完了しませんでした',
        body: '決済会社から未完了と通知がありました。請求は発生しませんので、もう一度お支払いいただけます。',
      },
      pending: {
        title: 'まだ確認できていません',
        body: '決済会社から完了の応答が届いていません。お支払い直後の場合は、少し経ってから再確認してください。',
      },
      notFound: {
        title: '決済番号が見つかりません',
        body: 'この画面が持ってきた決済番号がサーバーにありません。お支払い済みの場合は、購入時のメールで鑑定書をお開きください。',
      },
      refunded: {
        title: '返金済みの決済です',
        body: 'この決済は取り消されているため、お開きできる鑑定書はありません。ご希望であれば最初からやり直せます。',
      },
      mismatch: {
        title: '決済金額が一致しません',
        body: '請求額と注文額が異なるため、鑑定書を開いていません。下記の注文番号を添えてお問い合わせください。',
      },
      unavailable: {
        title: '今は確認できません',
        body: '接続が切れたか、サーバーが応答していません。決済はそのままですので、少し経ってから再確認してください。',
      },
      noContext: {
        title: 'ここで確認する決済がありません',
        body: 'お支払いを終えるとこの画面に戻ります。お支払い済みの場合は、購入時のメールで鑑定書をお開きください。',
      },
    },
    actions: {
      retry: 'もう一度確認',
      payAgain: 'もう一度お支払い',
      reopen: 'メールで鑑定書を開く',
      restart: 'DeepTypeの最初へ',
      contact: 'お問い合わせ',
    },
    orderReference: '注文番号 {id}',
    pgMessage: '決済会社からのお知らせ · {message}',
    contactSubject: 'DeepType決済に関するお問い合わせ（{id}）',
  },
  zh: {
    metadata: { title: '确认DeepType付款', description: '确认DeepType付款结果并继续生成报告。' },
    eyebrow: 'DeepType',
    checking: {
      title: '正在确认付款',
      body: '请不要关闭此页面。确认完成后会立即进入进阶问题。',
      hint: '支付机构响应稍慢，请再稍等片刻。',
    },
    paid: {
      title: '付款已完成',
      body: '已确认{price}的付款。完成的报告可在一年内随时重新打开。',
      emailNote: '收据与重新查看链接将发送至{email}。',
    },
    paidElsewhere: {
      title: '付款已确认',
      body: '此浏览器已没有继续所需的信息。请用购买邮箱获取查看链接来打开报告。',
    },
    reasons: {
      declined: {
        title: '付款未完成',
        body: '支付机构告知付款未能完成。不会产生扣款，可以重新付款。',
      },
      pending: {
        title: '尚未确认付款',
        body: '支付机构还没有返回完成结果。若刚刚付款，请稍后再确认一次。',
      },
      notFound: {
        title: '找不到该付款编号',
        body: '此页面带来的付款编号在服务器上不存在。若确实已付款，请用购买邮箱打开报告。',
      },
      refunded: {
        title: '该付款已退款',
        body: '此付款已取消，没有可打开的报告。如需重新获取，可从头开始。',
      },
      mismatch: {
        title: '付款金额不一致',
        body: '扣款金额与订单金额不符，因此未开放报告。请附上下方订单号联系我们，会尽快核对。',
      },
      unavailable: {
        title: '目前无法确认',
        body: '连接中断或服务器没有响应。付款不受影响，请稍后再确认。',
      },
      noContext: {
        title: '这里没有需要确认的付款',
        body: '付款完成后会回到此页面。若已经付款，请用购买邮箱打开报告。',
      },
    },
    actions: {
      retry: '重新确认付款',
      payAgain: '重新付款',
      reopen: '用邮箱打开报告',
      restart: '返回DeepType首页',
      contact: '联系客服',
    },
    orderReference: '订单号 {id}',
    pgMessage: '支付机构提示 · {message}',
    contactSubject: 'DeepType付款咨询（{id}）',
  },
} satisfies Record<Locale, DeepTypeCheckoutReturnContent>
