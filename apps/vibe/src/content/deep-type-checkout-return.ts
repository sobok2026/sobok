import { Locale } from '@sobok/domain/locale'

export type DeepTypeCheckoutReturnContent = {
  checkingBody: string
  checkingTitle: string
  errorBody: string
  errorTitle: string
  eyebrow: string
  metadata: { description: string; title: string }
  reopenCta: string
  retryCta: string
  startOverCta: string
}

export const DEEP_TYPE_CHECKOUT_RETURN = {
  [Locale.KO]: {
    metadata: { title: '딥타입 결제 확인', description: '딥타입 결제 결과를 확인하고 감정서를 이어서 만듭니다.' },
    eyebrow: 'DeepType',
    checkingTitle: '결제를 확인하고 있어요',
    checkingBody: '창을 닫지 말아 주세요. 결제 상태를 안전하게 확인한 뒤 다음 단계로 이어집니다.',
    errorTitle: '결제 확인을 완료하지 못했어요',
    errorBody: '잠시 후 다시 확인하거나, 결제가 완료됐다면 구매 이메일로 감정서 재열람 링크를 요청해 주세요.',
    retryCta: '결제 다시 확인',
    reopenCta: '이메일로 감정서 찾기',
    startOverCta: '딥타입 처음으로',
  },
  [Locale.EN]: {
    metadata: {
      title: 'Verify DeepType payment',
      description: 'Verify your DeepType payment and continue your report.',
    },
    eyebrow: 'DeepType',
    checkingTitle: 'Verifying your payment',
    checkingBody: 'Please keep this window open. We will continue once the payment is safely verified.',
    errorTitle: 'We could not verify the payment',
    errorBody: 'Try again shortly. If payment completed, request a report link using your purchase email.',
    retryCta: 'Verify again',
    reopenCta: 'Find report by email',
    startOverCta: 'Back to DeepType',
  },
  [Locale.JA]: {
    metadata: { title: 'DeepType決済確認', description: 'DeepTypeの決済結果を確認し、鑑定書作成を続けます。' },
    eyebrow: 'DeepType',
    checkingTitle: '決済を確認しています',
    checkingBody: 'この画面を閉じずにお待ちください。安全に確認でき次第、次の手順へ進みます。',
    errorTitle: '決済確認を完了できませんでした',
    errorBody: 'しばらくして再確認してください。決済済みの場合は、購入メールで鑑定書リンクをリクエストできます。',
    retryCta: 'もう一度確認',
    reopenCta: 'メールで鑑定書を探す',
    startOverCta: 'DeepTypeの最初へ',
  },
  [Locale.ZH]: {
    metadata: { title: '确认DeepType付款', description: '确认DeepType付款结果并继续生成报告。' },
    eyebrow: 'DeepType',
    checkingTitle: '正在确认付款',
    checkingBody: '请不要关闭此页面。安全确认付款后将继续下一步。',
    errorTitle: '无法完成付款确认',
    errorBody: '请稍后重试。若已完成付款，可使用购买邮箱申请报告链接。',
    retryCta: '重新确认付款',
    reopenCta: '通过邮箱查找报告',
    startOverCta: '返回DeepType首页',
  },
} satisfies Record<Locale, DeepTypeCheckoutReturnContent>
