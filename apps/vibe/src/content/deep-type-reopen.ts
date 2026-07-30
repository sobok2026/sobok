import type { Locale } from '@sobok/domain/locale'

export type DeepTypeReopenContent = {
  metadata: { title: string; description: string }
  eyebrow: string
  title: string
  body: string
  emailLabel: string
  emailPlaceholder: string
  requestCta: string
  requesting: string
  deliveryNote: string
  acceptedTitle: string
  acceptedBody: string
  linkTitle: string
  linkBody: string
  linkCta: string
  opening: string
  invalidTitle: string
  invalidBody: string
  genericError: string
  // 보안 확인 실패는 만료(다시 풀면 됨)와 거절(다시 풀어도 안 됨)을 나눠서 안내한다. verificationUnavailable
  // 은 Cloudflare 가 답하지 않아 fail closed 로 막은 경우다.
  verificationExpiredError: string
  verificationFailedError: string
  verificationUnavailableError: string
  generatingTitle: string
  generatingBody: string
  reportFailedTitle: string
  reportFailedBody: string
  accessUntil: string
  startOverCta: string
}

export const DEEP_TYPE_REOPEN = {
  ko: {
    metadata: {
      title: '겉속유형 감정서 다시 열기',
      description: '구매에 사용한 이메일로 1년 이내의 겉속유형 감정서를 다시 열 수 있습니다.',
    },
    eyebrow: '겉속유형 · 재열람',
    title: '구매한 감정서를 다시 열어드려요',
    body: '구매에 사용한 이메일을 입력하면 열람 가능한 감정서의 일회용 링크를 보내드려요.',
    emailLabel: '구매 이메일',
    emailPlaceholder: 'you@example.com',
    requestCta: '재열람 링크 받기',
    requesting: '요청하고 있어요...',
    deliveryNote: '링크는 15분 동안 한 번만 사용할 수 있어요. 감정서는 결제일로부터 1년 동안 다시 열 수 있어요.',
    acceptedTitle: '메일함을 확인해 주세요',
    acceptedBody: '일치하는 구매가 있으면 재열람 링크를 보냈어요. 메일이 보이지 않으면 스팸함도 확인해 주세요.',
    linkTitle: '재열람 링크를 확인했어요',
    linkBody: '아래 버튼을 누르면 이 링크가 사용 처리되고 감정서가 열려요.',
    linkCta: '감정서 열기',
    opening: '감정서를 확인하고 있어요...',
    invalidTitle: '이 링크를 사용할 수 없어요',
    invalidBody: '이미 사용했거나 15분이 지난 링크일 수 있어요. 이메일로 새 링크를 요청해 주세요.',
    genericError: '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
    verificationExpiredError: '보안 확인이 만료됐어요. 아래에서 한 번 더 확인하고 보내 주세요.',
    verificationFailedError: '보안 확인을 통과하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    verificationUnavailableError: '보안 확인 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
    generatingTitle: '감정서를 준비하고 있어요',
    generatingBody: '저장된 감정서를 확인하고 있어요. 잠시만 기다려 주세요.',
    reportFailedTitle: '감정서를 열지 못했어요',
    reportFailedBody: '잠시 후 새 링크로 다시 시도하거나 고객센터에 문의해 주세요.',
    accessUntil: '{date}까지 다시 열 수 있어요.',
    startOverCta: '겉속유형 처음부터 하기',
  },
  en: {
    metadata: {
      title: 'Reopen your DeepType report',
      description: 'Reopen a DeepType report within one year using the email address used for purchase.',
    },
    eyebrow: 'DeepType · Report access',
    title: 'Reopen a report you purchased',
    body: 'Enter the email used for purchase and we will send one-time links for reports still available.',
    emailLabel: 'Purchase email',
    emailPlaceholder: 'you@example.com',
    requestCta: 'Send report link',
    requesting: 'Sending request…',
    deliveryNote: 'Each link works once for 15 minutes. Reports remain available for one year from payment.',
    acceptedTitle: 'Check your inbox',
    acceptedBody:
      'If we found a matching purchase, we sent a report link. Check your spam folder if it does not arrive.',
    linkTitle: 'Your report link is ready',
    linkBody: 'Selecting the button below will use this one-time link and open your report.',
    linkCta: 'Open report',
    opening: 'Checking your report…',
    invalidTitle: 'This link cannot be used',
    invalidBody: 'It may have been used already or expired after 15 minutes. Request a new link by email.',
    genericError: 'We could not process the request. Please try again shortly.',
    verificationExpiredError: 'The security check expired. Please confirm once more below and resend.',
    verificationFailedError: 'The security check did not pass. Please refresh the page and try again.',
    verificationUnavailableError: 'The security check service is not responding. Please try again shortly.',
    generatingTitle: 'Preparing your report',
    generatingBody: 'We are retrieving your saved report. This should only take a moment.',
    reportFailedTitle: 'We could not open the report',
    reportFailedBody: 'Try again shortly with a new link or contact support.',
    accessUntil: 'Available to reopen until {date}.',
    startOverCta: 'Start DeepType again',
  },
  ja: {
    metadata: {
      title: 'DeepType鑑定書をもう一度開く',
      description: '購入時のメールアドレスを使って、決済日から1年以内のDeepType鑑定書を再閲覧できます。',
    },
    eyebrow: 'DeepType · 再閲覧',
    title: '購入した鑑定書をもう一度開く',
    body: '購入時のメールアドレスを入力すると、再閲覧できる鑑定書のワンタイムリンクを送信します。',
    emailLabel: '購入時のメールアドレス',
    emailPlaceholder: 'you@example.com',
    requestCta: '再閲覧リンクを受け取る',
    requesting: 'リクエストを送信しています…',
    deliveryNote: 'リンクは15分以内に1回だけ使用できます。鑑定書は決済日から1年間再閲覧できます。',
    acceptedTitle: '受信トレイをご確認ください',
    acceptedBody:
      '一致する購入がある場合は再閲覧リンクを送信しました。届かない場合は迷惑メールフォルダもご確認ください。',
    linkTitle: '再閲覧リンクを確認しました',
    linkBody: '下のボタンを押すと、このワンタイムリンクを使用して鑑定書を開きます。',
    linkCta: '鑑定書を開く',
    opening: '鑑定書を確認しています…',
    invalidTitle: 'このリンクは使用できません',
    invalidBody: 'すでに使用されたか、15分の有効期限が切れた可能性があります。新しいリンクをメールでご依頼ください。',
    genericError: 'リクエストを処理できませんでした。しばらくしてからもう一度お試しください。',
    verificationExpiredError: 'セキュリティ確認の有効期限が切れました。下でもう一度確認して送信してください。',
    verificationFailedError: 'セキュリティ確認を通過できませんでした。ページを再読み込みしてお試しください。',
    verificationUnavailableError: 'セキュリティ確認サーバーが応答していません。しばらくしてから再度お試しください。',
    generatingTitle: '鑑定書を準備しています',
    generatingBody: '保存済みの鑑定書を確認しています。少々お待ちください。',
    reportFailedTitle: '鑑定書を開けませんでした',
    reportFailedBody: 'しばらくしてから新しいリンクで再試行するか、サポートへお問い合わせください。',
    accessUntil: '{date}まで再閲覧できます。',
    startOverCta: 'DeepTypeを最初から行う',
  },
  zh: {
    metadata: {
      title: '重新打开 DeepType 报告',
      description: '使用购买时的电子邮箱，可在付款后一年内重新查看 DeepType 报告。',
    },
    eyebrow: 'DeepType · 重新查看',
    title: '重新打开已购买的报告',
    body: '输入购买时使用的电子邮箱，我们会发送仍可查看报告的一次性链接。',
    emailLabel: '购买邮箱',
    emailPlaceholder: 'you@example.com',
    requestCta: '获取重新查看链接',
    requesting: '正在提交申请…',
    deliveryNote: '每个链接在15分钟内只能使用一次。报告自付款之日起可重新查看一年。',
    acceptedTitle: '请检查收件箱',
    acceptedBody: '如果存在匹配的购买记录，我们已发送报告链接。如未收到，请同时检查垃圾邮件文件夹。',
    linkTitle: '重新查看链接已就绪',
    linkBody: '点击下方按钮后，此一次性链接将被使用，并打开您的报告。',
    linkCta: '打开报告',
    opening: '正在确认报告…',
    invalidTitle: '此链接无法使用',
    invalidBody: '链接可能已被使用，或已超过15分钟有效期。请通过邮箱申请新链接。',
    genericError: '暂时无法处理申请，请稍后重试。',
    verificationExpiredError: '安全验证已过期，请在下方再确认一次后发送。',
    verificationFailedError: '安全验证未通过，请刷新页面后重试。',
    verificationUnavailableError: '安全验证服务暂无响应，请稍后重试。',
    generatingTitle: '正在准备报告',
    generatingBody: '正在读取已保存的报告，请稍候。',
    reportFailedTitle: '无法打开报告',
    reportFailedBody: '请稍后使用新链接重试，或联系客服。',
    accessUntil: '可重新查看至 {date}。',
    startOverCta: '重新开始 DeepType',
  },
} satisfies Record<Locale, DeepTypeReopenContent>
