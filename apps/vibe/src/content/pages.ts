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
  [Locale.KO]: { label: '최종 업데이트', about: '2026년 7월 18일', contact: '2026년 7월 18일' },
  [Locale.EN]: { label: 'Last updated', about: 'July 18, 2026', contact: 'July 18, 2026' },
  [Locale.JA]: { label: '最終更新', about: '2026年7月18日', contact: '2026年7月18日' },
  [Locale.ZH]: { label: '最后更新', about: '2026年7月18日', contact: '2026年7月18日' },
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
            '결타레는 결지수 테스트와 대화 유형 테스트, 두 가지 짧은 테스트로 커플의 케미를 가볍게 확인해보는 웹 도구입니다. 회원가입 없이 누구나 바로 이용할 수 있습니다.',
          ],
        },
        {
          heading: '무엇을 할 수 있나요',
          body: [
            '결지수 테스트는 16문항으로 애정 온도, 생활 템포, 관계 균형, 회복력을 종합해 결지수와 등급을 보여 줍니다. 대화 유형 테스트는 여러 문항의 답변을 조합해 우리 커플의 대화 유형 코드를 찾아 줍니다.',
          ],
        },
        {
          heading: '어떻게 계산하나요',
          body: ['테스트 문항의 답변은 이용자의 브라우저 안에서 계산되며 결타레 서버로 직접 제출되지 않습니다.'],
        },
        {
          heading: '누가 만드나요',
          body: ['결타레는 1인 개발자 소복(sobok)이 만들고 운영합니다.'],
        },
        {
          heading: '이용 시 유의해 주세요',
          body: [
            '결타레의 결과는 재미와 관계 참고를 위한 정보이며 전문적인 관계 상담이나 조언을 대신하지 않습니다. 서비스 이용에 관한 자세한 조건은 이용약관에서 확인할 수 있으니 궁금한 점이나 제안이 있으면 문의하기 페이지로 연락해 주세요.',
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
          body: ['결타레를 쓰다가 생긴 궁금한 점이나 제안이 있으면 아래 채널로 편하게 알려 주세요.'],
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
          body: ['Your quiz answers are calculated in your browser and are not directly submitted to vibe’s server.'],
        },
        {
          heading: 'Who builds it',
          body: ['vibe is built and run by sobok, a solo indie developer.'],
        },
        {
          heading: 'Please keep in mind',
          body: [
            'vibe’s results are for fun and self-reflection, and are not a substitute for professional relationship advice. The full terms for using the service are in the Terms of Service, and if you have a question or suggestion, reach out through the Contact page.',
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
            'If you have a question or suggestion while using vibe, let us know through one of the channels below.',
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
          body: ['診断の回答は利用者のブラウザ内で計算され、vibeのサーバーへ直接送信されません。'],
        },
        {
          heading: '運営者について',
          body: ['vibeは個人開発者のsobokが制作・運営しています。'],
        },
        {
          heading: 'ご利用にあたって',
          body: [
            'vibeの結果は娯楽と自己理解のための参考情報であり、専門的な関係性の相談やアドバイスに代わるものではありません。サービス利用に関する詳しい条件は利用規約でご確認いただけますので、ご質問やご提案があればお問い合わせページからご連絡ください。',
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
          body: ['vibeをご利用中に気になる点やご提案があれば、下記のチャンネルよりお気軽にお知らせください。'],
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
          body: ['测试答案在您的浏览器内计算，不会直接提交到 vibe 的服务器。'],
        },
        {
          heading: '由谁制作',
          body: ['vibe 由独立开发者 sobok 一人制作并运营。'],
        },
        {
          heading: '使用提示',
          body: [
            'vibe 的结果仅供娱乐与自我了解参考，不能替代专业的关系咨询或建议。有关使用服务的详细条款请见服务条款，如有疑问或建议，欢迎通过联系我们页面与我们联系。',
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
          body: ['在使用 vibe 时如有疑问或建议，欢迎通过以下渠道告诉我们。'],
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
