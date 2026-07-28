import { Locale } from '@sobok/domain/locale'

import { LEGAL_CONTACT_EMAIL } from './legal'

// SNS handle declared in the site metadata (twitter:site in layout/page).
// Keep in sync if the handle ever changes.
export const SOBOK_X_URL = 'https://x.com/sobok_cc'
export const SOBOK_X_HANDLE = '@sobok_cc'

export type PageSection = {
  heading: string
  body: string[]
}

export type InfoPage = {
  title: string
  description: string
  updatedLabel: string
  updatedDate: string
  sections: PageSection[]
}

export type ContactChannel = {
  label: string
  description: string
  href: string
  value: string
}

export type ContactPage = InfoPage & {
  channelsHeading: string
  channels: ContactChannel[]
}

export type InfoNav = {
  home: string
  about: string
  contact: string
}

export type InfoContent = {
  nav: InfoNav
  about: InfoPage
  contact: ContactPage
}

const UPDATED = {
  [Locale.KO]: { label: '최종 업데이트', about: '2026년 7월 22일', contact: '2026년 7월 22일' },
  [Locale.EN]: { label: 'Last updated', about: 'July 22, 2026', contact: 'July 22, 2026' },
  [Locale.JA]: { label: '最終更新', about: '2026年7月22日', contact: '2026年7月22日' },
  [Locale.ZH]: { label: '最后更新', about: '2026年7月22日', contact: '2026年7月22日' },
} satisfies Record<Locale, { label: string; about: string; contact: string }>

export const PAGES = {
  [Locale.KO]: {
    nav: {
      home: '홈',
      about: '소개',
      contact: '문의하기',
    },
    about: {
      title: '소개',
      description: '결타레가 어떤 서비스이고 결과를 어떻게 계산하며 누가 만드는지 알려드립니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].about,
      sections: [
        {
          heading: '결타레는 어떤 서비스인가요',
          body: [
            '결타레는 세 가지를 제공합니다. 결지수 테스트와 대화 유형 테스트는 커플의 케미를 가볍게 확인해 보는 무료 테스트입니다. 겉속유형은 일에서 내 힘이 어디서 붙고 어디서 새는지 읽어 보는 자기탐구 도구이며 무료 검사와 유료 리포트로 이루어집니다.',
            '회원가입 없이 누구나 바로 이용할 수 있습니다.',
          ],
        },
        {
          heading: '무엇을 할 수 있나요',
          body: [
            '결지수 테스트는 16문항으로 애정 온도, 생활 템포, 관계 균형, 회복력을 종합해 결지수와 등급을 보여 줍니다. 대화 유형 테스트는 여러 문항의 답변을 조합해 우리 커플의 대화 유형 코드를 찾아 줍니다.',
            '겉속유형 무료 검사는 여덟 글자와 세계관 직업 그리고 지치는 조건 신호를 보여 줍니다. 유료 리포트는 그 여덟 글자를 다시 정하지 않고 각 축이 얼마나 선명한지를 확정해 일과 연결한 서술을 덧붙입니다.',
          ],
        },
        {
          heading: '어떻게 계산하나요',
          body: [
            '결지수와 대화 유형 무료 테스트의 답변은 이용자의 브라우저 안에서 계산되며 서버로 제출되지 않습니다. 겉속유형 무료 결과도 브라우저에서 계산됩니다.',
            '겉속유형 유료 리포트를 구매하면 이메일과 답변을 서버에서 처리합니다. 서버는 심층 문항의 답으로 각 축의 선명도를 확정하고 규칙 엔진이 리포트 본문을 씁니다.',
            '리포트의 일부 서술 문단은 Anthropic의 생성형 인공지능이 씁니다. 인공지능은 여덟 글자와 선명도를 정하지 않고 이미 정해진 값을 문장으로 옮기며 리포트 화면에서 해당 문단에 인공지능이 쓴 글이라고 표시합니다. 생성형 인공지능의 문장은 사실 확인을 거친 진술이 아닙니다.',
            '리포트는 결제일부터 1년 동안 구매 이메일로 다시 열 수 있으며 자세한 내용은 개인정보처리방침에서 확인할 수 있습니다.',
          ],
        },
        {
          heading: '누가 만드나요',
          body: ['결타레는 1인 개발자 소복(sobok)이 만들고 운영합니다.'],
        },
        {
          heading: '이용 시 유의해 주세요',
          body: [
            '무료 서비스는 연령 확인 없이 이용할 수 있으며 유료 구매는 만 14세 이상만 가능합니다.',
            '결타레의 결과는 자기 이해와 재미를 위한 참고 정보이며 관계 상담이나 진로 상담 또는 의학적 진단을 대신하지 않습니다. 겉속유형 리포트는 직업소개나 취업알선 서비스가 아니고 이직이나 퇴사 또는 창업을 권하는 조언도 아닙니다. 자세한 조건은 이용약관에서 확인할 수 있습니다.',
          ],
        },
      ],
    },
    contact: {
      title: '문의하기',
      description: '결타레에 관한 문의와 제안 그리고 오류 신고를 받는 곳입니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].contact,
      sections: [
        {
          heading: '이렇게 연락해 주세요',
          body: [
            '아래 채널로 알려 주세요. 결제·재열람 문의에는 구매 이메일을 적되 카드번호 전체나 일회용 재열람 링크는 보내지 마세요.',
          ],
        },
        {
          heading: '어떤 문의를 받나요',
          body: ['오류와 버그 신고, 오탈자나 어색한 번역 제보, 새 기능 제안, 광고·제휴 문의까지 모두 환영합니다.'],
        },
        {
          heading: '답변 안내',
          body: [
            '보내 주신 문의는 받은 순서대로 확인해 답변드립니다. 1인이 운영하다 보니 며칠 걸릴 수 있는 점 양해 부탁드립니다.',
          ],
        },
      ],
      channelsHeading: '연락 채널',
      channels: [
        {
          label: '이메일',
          description: '문의와 제안을 받는 가장 확실한 창구입니다. 보통 며칠 안에 확인합니다.',
          href: `mailto:${LEGAL_CONTACT_EMAIL}`,
          value: LEGAL_CONTACT_EMAIL,
        },
        {
          label: 'X (트위터)',
          description: '새 소식을 전합니다. 가벼운 문의는 멘션이나 DM으로도 받습니다.',
          href: SOBOK_X_URL,
          value: SOBOK_X_HANDLE,
        },
      ],
    },
  },

  [Locale.EN]: {
    nav: {
      home: 'Home',
      about: 'About',
      contact: 'Contact',
    },
    about: {
      title: 'About',
      description: 'What vibe is, how it calculates your result, and who builds it.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].about,
      sections: [
        {
          heading: 'What is vibe',
          body: [
            'vibe is a web tool for a light-hearted check of your couple chemistry through two short quizzes: a compatibility score and a communication type. Anyone can use it right away with no sign-up.',
          ],
        },
        {
          heading: 'What you can do',
          body: [
            'The Compatibility quiz combines answers to 16 questions on affection, pace of life, balance, and resilience into a score and a grade. The Talk Type quiz combines your answers into a communication-type code for your couple.',
          ],
        },
        {
          heading: 'How it calculates',
          body: [
            'Answers to the free Compatibility and Talk Type quizzes are calculated in your browser and are not submitted to a server. For a paid DeepType report, your email and answers are processed on the server, and a server-scored profile is narrated through the Anthropic API. You can reopen the report with the purchase email for 1 year from payment; see the Privacy Policy for details.',
          ],
        },
        {
          heading: 'Who builds it',
          body: ['vibe is built and run by sobok, a solo indie developer.'],
        },
        {
          heading: 'Please keep in mind',
          body: [
            'The free service is available without age confirmation, while paid purchases are limited to people aged 14 or older. vibe’s results are for fun and self-reflection and are not a substitute for professional relationship advice. See the Terms of Service for full conditions.',
          ],
        },
      ],
    },
    contact: {
      title: 'Contact',
      description: 'Where to send questions, suggestions, and bug reports about vibe.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].contact,
      sections: [
        {
          heading: 'How to reach us',
          body: [
            'Use a channel below. For payment or report-access help, include the purchase email but never send a full card number or one-time report link.',
          ],
        },
        {
          heading: 'What we welcome',
          body: [
            'Bug reports, typos or awkward translations, new feature ideas, and ad or partnership inquiries are all welcome.',
          ],
        },
        {
          heading: 'Response times',
          body: [
            'We read and reply to messages in the order they arrive. vibe is run by one person, so a reply may take a few days.',
          ],
        },
      ],
      channelsHeading: 'Channels',
      channels: [
        {
          label: 'Email',
          description: 'The most reliable way to reach us. We usually check within a few days.',
          href: `mailto:${LEGAL_CONTACT_EMAIL}`,
          value: LEGAL_CONTACT_EMAIL,
        },
        {
          label: 'X (Twitter)',
          description: 'News and updates. We also take quick questions by mention or DM.',
          href: SOBOK_X_URL,
          value: SOBOK_X_HANDLE,
        },
      ],
    },
  },

  [Locale.JA]: {
    nav: {
      home: 'ホーム',
      about: 'サービス紹介',
      contact: 'お問い合わせ',
    },
    about: {
      title: 'サービス紹介',
      description: 'vibeがどんなサービスで、どのように結果を計算し、誰が作っているのかをご案内します。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].about,
      sections: [
        {
          heading: 'vibeとは',
          body: [
            'vibeは相性診断と会話タイプ診断、2つの短い診断でカップルのケミストリーを気軽に確認できるウェブツールです。会員登録なしでどなたもすぐにご利用いただけます。',
          ],
        },
        {
          heading: 'できること',
          body: [
            '相性診断は16の設問への回答から愛情の温度・生活のテンポ・関係のバランス・回復力を総合し、スコアと等級を算出します。会話タイプ診断は複数の設問の回答を組み合わせ、おふたりの会話タイプコードを導き出します。',
          ],
        },
        {
          heading: 'どのように計算するのか',
          body: [
            '相性診断・会話タイプ診断（無料）の回答はブラウザ内で計算され、サーバーへ送信されません。有料DeepType鑑定書ではメールと回答をサーバーで処理し、サーバー採点済みプロファイルをAnthropic APIで文章化します。決済日から1年間、購入メールで再閲覧できます。詳しくはプライバシーポリシーをご確認ください。',
          ],
        },
        {
          heading: '運営者について',
          body: ['vibeは個人開発者のsobokが制作・運営しています。'],
        },
        {
          heading: 'ご利用にあたって',
          body: [
            '無料サービスは年齢確認なしで利用でき、有料購入は14歳以上の方に限られます。vibeの結果は娯楽と自己理解のための参考情報であり、専門的な相談や助言に代わるものではありません。詳しい条件は利用規約をご確認ください。',
          ],
        },
      ],
    },
    contact: {
      title: 'お問い合わせ',
      description: 'vibeに関するお問い合わせ・ご提案・不具合のご報告をお受けします。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].contact,
      sections: [
        {
          heading: 'ご連絡方法',
          body: [
            '下記のチャンネルからご連絡ください。決済・再閲覧のお問い合わせには購入メールを記載し、カード番号全体やワンタイム再閲覧リンクは送らないでください。',
          ],
        },
        {
          heading: 'お受けする内容',
          body: ['不具合のご報告、誤字や不自然な翻訳のご指摘、新機能のご提案、広告・提携のお問い合わせを歓迎します。'],
        },
        {
          heading: '返信について',
          body: [
            'いただいたお問い合わせは届いた順に確認して返信します。個人で運営しているため、ご返信までに数日いただくことがあります。',
          ],
        },
      ],
      channelsHeading: '連絡チャンネル',
      channels: [
        {
          label: 'メール',
          description: 'お問い合わせとご提案をお受けする、もっとも確実な窓口です。通常は数日以内に確認します。',
          href: `mailto:${LEGAL_CONTACT_EMAIL}`,
          value: LEGAL_CONTACT_EMAIL,
        },
        {
          label: 'X（Twitter）',
          description: '新しいお知らせをお届けします。ちょっとしたお問い合わせはメンションやDMでも受け付けます。',
          href: SOBOK_X_URL,
          value: SOBOK_X_HANDLE,
        },
      ],
    },
  },

  [Locale.ZH]: {
    nav: {
      home: '首页',
      about: '关于',
      contact: '联系我们',
    },
    about: {
      title: '关于',
      description: '介绍 vibe 是什么服务、如何计算结果，以及由谁制作。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].about,
      sections: [
        {
          heading: 'vibe是什么',
          body: [
            'vibe 是一款网页工具，通过默契指数测试和对话类型测试两项简短测试，轻松了解情侣间的默契。无需注册，任何人都能立即使用。',
          ],
        },
        {
          heading: '您可以做什么',
          body: [
            '默契指数测试通过16道题目综合情感温度、生活节奏、关系平衡与恢复力，得出分数与等级。对话类型测试通过组合多道题目的答案，得出你们的对话类型代码。',
          ],
        },
        {
          heading: '如何计算',
          body: [
            '默契指数与对话类型免费测试的答案在浏览器内计算，不会提交服务器。购买DeepType报告时，邮箱与答案会在服务器处理，并将服务器评分后的档案通过Anthropic API生成文字。自付款之日起1年内可用购买邮箱重新查看；详情请见隐私政策。',
          ],
        },
        {
          heading: '由谁制作',
          body: ['vibe 由独立开发者 sobok 一人制作并运营。'],
        },
        {
          heading: '使用提示',
          body: [
            '免费服务无需年龄确认即可使用，付费购买仅限年满14周岁的用户。vibe的结果仅供娱乐与自我了解参考，不能替代专业咨询或建议。详细条件请见服务条款。',
          ],
        },
      ],
    },
    contact: {
      title: '联系我们',
      description: '接收关于 vibe 的咨询、建议与错误反馈。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].contact,
      sections: [
        {
          heading: '如何联系',
          body: ['请通过以下渠道联系我们。支付或重新查看相关咨询可附上购买邮箱，但请勿发送完整卡号或一次性报告链接。'],
        },
        {
          heading: '我们欢迎哪些反馈',
          body: ['错误与漏洞反馈、错别字或生硬的翻译、新功能建议，以及广告与合作咨询，我们都非常欢迎。'],
        },
        {
          heading: '回复说明',
          body: ['我们会按照收到的顺序查看并回复。本服务由一人运营，回复可能需要几天时间。'],
        },
      ],
      channelsHeading: '联系渠道',
      channels: [
        {
          label: '电子邮件',
          description: '接收咨询与建议最可靠的渠道，通常会在几天内查看。',
          href: `mailto:${LEGAL_CONTACT_EMAIL}`,
          value: LEGAL_CONTACT_EMAIL,
        },
        {
          label: 'X（Twitter）',
          description: '发布最新消息。简单的咨询也可通过提及或私信联系。',
          href: SOBOK_X_URL,
          value: SOBOK_X_HANDLE,
        },
      ],
    },
  },
} satisfies Record<Locale, InfoContent>
