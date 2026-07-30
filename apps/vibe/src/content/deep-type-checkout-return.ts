import type { Locale } from '@sobok/domain/locale'

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
  ko: {
    metadata: { title: '겉속유형 결제 확인', description: '겉속유형 결제를 확인하고 심층 리포트를 이어서 만들어요.' },
    eyebrow: 'DeepType',
    checkingTitle: '결제를 확인하고 바로 이어가요',
    checkingBody: '이 화면을 열어 두면 확인이 끝나는 대로 심화 문항으로 이어져요.',
    errorTitle: '결제 확인을 아직 못 끝냈어요',
    errorBody: '결제가 됐다면 리포트는 그대로 있어요. 아래에서 다시 확인하거나 구매에 쓴 이메일로 열람 링크를 받아요.',
    retryCta: '결제 다시 확인',
    reopenCta: '이메일로 내 리포트 찾기',
    startOverCta: '겉속유형 처음으로',
  },
  en: {
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
  ja: {
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
  zh: {
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
