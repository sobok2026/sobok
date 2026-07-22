import { Locale } from '@sobok/domain/locale'

export type AgeGateContent = {
  title: string
  body: string
  confirmation: string
  continueCta: string
  leaveCta: string
  checkingLabel: string
}

export const AGE_GATE = {
  [Locale.KO]: {
    title: '만 14세 이상만 이용할 수 있어요',
    body: '초기 서비스는 만 14세 미만의 이용과 구매를 지원하지 않아요. 생년월일은 수집하지 않고, 확인 여부만 이 브라우저에 저장해요.',
    confirmation: '만 14세 이상임을 확인해요.',
    continueCta: '확인하고 계속하기',
    leaveCta: '홈으로 돌아가기',
    checkingLabel: '이용 가능 여부를 확인하고 있어요.',
  },
  [Locale.EN]: {
    title: 'You must be at least 14',
    body: 'The initial service does not support use or purchases by anyone under 14. We do not collect your date of birth; only this confirmation is saved in this browser.',
    confirmation: 'I confirm that I am at least 14 years old.',
    continueCta: 'Confirm and continue',
    leaveCta: 'Return home',
    checkingLabel: 'Checking your access.',
  },
  [Locale.JA]: {
    title: '14歳以上の方のみ利用できます',
    body: '初期サービスでは、14歳未満の方の利用・購入には対応していません。生年月日は収集せず、確認した事実のみをこのブラウザに保存します。',
    confirmation: '14歳以上であることを確認します。',
    continueCta: '確認して続ける',
    leaveCta: 'ホームに戻る',
    checkingLabel: '利用可否を確認しています。',
  },
  [Locale.ZH]: {
    title: '仅限年满14周岁的用户',
    body: '初始版本不支持未满14周岁的用户使用或购买。我们不会收集出生日期，只会在此浏览器中保存本次确认记录。',
    confirmation: '我确认自己已年满14周岁。',
    continueCta: '确认并继续',
    leaveCta: '返回首页',
    checkingLabel: '正在确认访问资格。',
  },
} satisfies Record<Locale, AgeGateContent>
