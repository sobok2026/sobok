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

export type InfoContent = {
  nav: {
    home: string
    about: string
    contact: string
  }
  about: InfoPage
  contact: ContactPage
}

const UPDATED = {
  [Locale.KO]: { label: '최종 업데이트', date: '2026년 7월 15일' },
  [Locale.EN]: { label: 'Last updated', date: 'July 15, 2026' },
  [Locale.JA]: { label: '最終更新', date: '2026年7月15日' },
  [Locale.ZH]: { label: '最后更新', date: '2026年7月15日' },
} satisfies Record<Locale, { label: string; date: string }>

export const PAGES = {
  [Locale.KO]: {
    nav: {
      home: '홈',
      about: '소개',
      contact: '문의하기',
    },
    about: {
      title: '소개',
      description: '별무리가 어떤 서비스이고 별자리를 어떻게 계산하며 누가 만드는지 알려드립니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].date,
      sections: [
        {
          heading: '별무리는 어떤 서비스인가요',
          body: [
            '별무리는 생년월일과 태어난 시각 그리고 출생지를 바탕으로 서양 점성술의 탄생 별자리(네이탈 차트)와 운세를 풀어 주는 웹 도구입니다. 회원가입 없이 누구나 바로 이용할 수 있으며 태양 별자리 하나만 보는 일반 운세와 달리 태어난 순간의 하늘 전체를 계산해 더 입체적인 나를 보여 줍니다.',
          ],
        },
        {
          heading: '탄생 별자리(네이탈 차트)란 무엇인가요',
          body: [
            '네이탈 차트는 태어난 순간 하늘에 놓인 태양과 달 그리고 행성의 위치를 그린 지도입니다. 흔히 아는 "무슨 자리"는 그중 태양 별자리 하나이며 별무리는 여기에 달 별자리와 상승 별자리 그리고 열두 하우스까지 함께 읽어 나의 성향과 삶의 영역을 더 자세히 그려 줍니다.',
          ],
        },
        {
          heading: '무엇을 할 수 있나요',
          body: [
            '태어난 순간의 하늘을 계산해 해와 달 그리고 상승궁을 비롯한 별자리 배치를 한눈에 보여 줍니다. 오늘의 운세는 지금 하늘을 지나는 행성을 내 차트에 겹쳐 그날의 흐름을 읽고 연애운은 금성과 화성 그리고 관계의 하우스를 살펴 사랑하는 방식과 어울리는 시기를 읽어 줍니다. 모든 해석은 한국어와 영어 그리고 일본어와 중국어로 제공합니다.',
          ],
        },
        {
          heading: '어떻게 계산하나요',
          body: [
            '별무리는 태어난 순간의 천체 위치를 트로피컬 황도대와 플라시두스 하우스 방식으로 계산합니다. 계산에는 공개 도메인 천체력 라이브러리를 사용해 태양부터 명왕성까지 열 개 천체의 위치를 지구 중심 기준으로 구하며 그 정확도는 천문학적으로 정밀한 수준입니다.',
          ],
        },
        {
          heading: '입력한 정보는 어떻게 다루나요',
          body: [
            '생년월일과 시각 그리고 출생지는 이용자의 브라우저 안에서만 계산되며 별도의 서버로 전송되지 않습니다. 개인정보를 어떻게 보관하고 삭제하는지는 개인정보처리방침에서 자세히 확인할 수 있습니다.',
          ],
        },
        {
          heading: '누가 만드나요',
          body: [
            '별무리는 1인 개발자 소복(sobok)이 만들고 운영하며 점성술을 어렵지 않게 즐길 수 있게 하자는 생각으로 시작했습니다.',
          ],
        },
        {
          heading: '이용 시 유의해 주세요',
          body: [
            '별무리의 해석은 자기 이해와 즐거움을 위한 참고 정보이며 의학·법률·재무 같은 전문적인 판단을 대신하지 않습니다. 서비스 이용에 관한 자세한 조건은 이용약관에서 확인할 수 있으니 궁금한 점이나 제안이 있으면 문의하기 페이지로 연락해 주세요.',
          ],
        },
      ],
    },
    contact: {
      title: '문의하기',
      description: '별무리에 관한 문의와 제안 그리고 오류 신고를 받는 곳입니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].date,
      sections: [
        {
          heading: '이렇게 연락해 주세요',
          body: [
            '별무리를 쓰다가 생긴 궁금한 점이나 제안이 있으면 아래 채널로 편하게 알려 주세요. 작은 의견도 서비스를 다듬는 데 큰 도움이 됩니다.',
          ],
        },
        {
          heading: '어떤 문의를 받나요',
          body: [
            '오류와 버그 신고, 오탈자나 어색한 번역 제보, 새 기능 제안, 광고·제휴 문의, 개인정보 관련 요청까지 모두 환영합니다. 오류를 알려 주실 때는 사용하신 기기와 브라우저 그리고 어떤 상황에서 문제가 생겼는지 함께 적어 주시면 원인을 빨리 찾을 수 있습니다.',
          ],
        },
        {
          heading: '답변 안내',
          body: [
            '보내 주신 문의는 받은 순서대로 확인해 답변드립니다. 다만 1인이 운영하다 보니 답변까지 며칠이 걸릴 수 있는 점 양해 부탁드립니다.',
          ],
        },
        {
          heading: '개인정보 관련 문의',
          body: [
            '개인정보 처리에 관한 문의는 이메일로 보내 주시면 확인 후 안내해 드립니다. 자세한 내용은 개인정보처리방침을 참고해 주세요.',
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
          description: '새 기능과 업데이트 소식을 전합니다. 가벼운 문의는 멘션이나 DM으로도 받습니다.',
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
      description: 'What Stella is, how it calculates your chart, and who builds it.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].date,
      sections: [
        {
          heading: 'What is Stella',
          body: [
            'Stella is a web tool that reads your Western astrology birth chart (natal chart) and horoscope from your birth date, time, and place. Anyone can use it right away with no sign-up, and unlike a plain horoscope that looks at your Sun sign alone, Stella calculates the whole sky at the moment you were born for a fuller picture of you.',
          ],
        },
        {
          heading: 'What is a birth chart',
          body: [
            'A birth chart is a map of where the Sun, Moon, and planets sat in the sky the moment you were born. The sign you usually know is just one of them — your Sun sign — and Stella adds your Moon sign, Rising sign, and the twelve houses so it can describe your character and the areas of your life in far more detail.',
          ],
        },
        {
          heading: 'What you can do',
          body: [
            'Stella maps the sky at the moment you were born and shows at a glance where the Sun, Moon, rising sign, and planets fall. Your daily horoscope overlays the planets moving through the sky right now onto your chart to read the day’s flow, while your love outlook looks at Venus, Mars, and the relationship houses to read how you love and when the timing is right. Every reading is available in Korean, English, Japanese, and Chinese.',
          ],
        },
        {
          heading: 'How it calculates',
          body: [
            'Stella computes the positions of the planets at your moment of birth using the tropical zodiac and the Placidus house system. It relies on a public-domain ephemeris library, resolving the geocentric positions of ten bodies from the Sun to Pluto with astronomically precise accuracy.',
          ],
        },
        {
          heading: 'How your data is handled',
          body: [
            'Your birth date, time, and place are calculated entirely within your browser and are never sent to a server. You can read exactly how personal data is stored and deleted in our Privacy Policy.',
          ],
        },
        {
          heading: 'Who builds it',
          body: [
            'Stella is built and run by sobok, a solo indie developer. It began with a simple goal: make astrology easy to enjoy.',
          ],
        },
        {
          heading: 'Please keep in mind',
          body: [
            'Stella’s readings are for self-reflection and fun, and are not a substitute for professional medical, legal, or financial advice. The full terms for using the service are in the Terms of Service, and if you have a question or suggestion, reach out through the Contact page.',
          ],
        },
      ],
    },
    contact: {
      title: 'Contact',
      description: 'Where to send questions, suggestions, and bug reports about Stella.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].date,
      sections: [
        {
          heading: 'How to reach us',
          body: [
            'If you have a question or suggestion while using Stella, let us know through one of the channels below. Even small notes help us make the service better.',
          ],
        },
        {
          heading: 'What we welcome',
          body: [
            'Bug reports, typos or awkward translations, new feature ideas, ad and partnership inquiries, and privacy requests are all welcome. When you report a bug, telling us your device, browser, and what you were doing when it happened helps us track down the cause quickly.',
          ],
        },
        {
          heading: 'Response times',
          body: [
            'We read and reply to messages in the order they arrive. Stella is run by one person, though, so a reply may take a few days — thank you for your patience.',
          ],
        },
        {
          heading: 'Privacy questions',
          body: [
            'For questions about how your data is handled, email us and we’ll follow up. See the Privacy Policy for details.',
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
      description: '星屑がどんなサービスで、どのように星を計算し、誰が作っているのかをご案内します。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].date,
      sections: [
        {
          heading: '星屑とは',
          body: [
            '星屑は、生年月日・出生時刻・出生地をもとに西洋占星術の出生図（ネイタルチャート）と運勢を読み解くウェブツールです。会員登録なしでどなたもすぐにご利用いただけ、太陽星座だけを見る一般的な運勢と違い、生まれた瞬間の空全体を計算して、より立体的なあなたを映し出します。',
          ],
        },
        {
          heading: '出生図とは',
          body: [
            '出生図は、生まれた瞬間に空にあった太陽・月・惑星の位置を描いた地図です。一般に知られている「◯◯座」はそのうちの太陽星座ひとつにすぎず、星屑はここに月星座・上昇星座（アセンダント）と十二ハウスまで加えて読み、あなたの性質や人生の領域をより詳しく描きます。',
          ],
        },
        {
          heading: 'できること',
          body: [
            '生まれた瞬間の空を計算し、太陽・月・上昇宮をはじめとする天体の配置をひと目で表示します。今日の運勢はいま空を運行する惑星をあなたの出生図に重ねてその日の流れを読み、恋愛運は金星・火星と関係のハウスから愛し方や巡ってくる好機を読み解きます。すべての解釈は韓国語・英語・日本語・中国語でご利用いただけます。',
          ],
        },
        {
          heading: 'どのように計算するのか',
          body: [
            '星屑は生まれた瞬間の天体の位置を、トロピカル方式の黄道帯とプラシーダス・ハウスシステムで計算します。計算にはパブリックドメインの天体暦ライブラリを用い、太陽から冥王星までの十天体の位置を地球中心で求めます。その精度は天文学的に厳密な水準です。',
          ],
        },
        {
          heading: '入力情報の取り扱い',
          body: [
            '生年月日・出生時刻・出生地は利用者のブラウザ内でのみ計算され、サーバーに送信されることはありません。個人情報をどのように保存・削除するかは、プライバシーポリシーで詳しくご確認いただけます。',
          ],
        },
        {
          heading: '運営者について',
          body: [
            '星屑は個人開発者の sobok が制作・運営しています。占星術を難しく感じさせず、気軽に楽しめるようにしたいという思いから始めました。',
          ],
        },
        {
          heading: 'ご利用にあたって',
          body: [
            '星屑の解釈は自己理解と娯楽のための参考情報であり、医学・法律・財務などの専門的な判断に代わるものではありません。サービス利用に関する詳しい条件は利用規約でご確認いただけますので、ご質問やご提案があればお問い合わせページからご連絡ください。',
          ],
        },
      ],
    },
    contact: {
      title: 'お問い合わせ',
      description: '星屑に関するお問い合わせ・ご提案・不具合のご報告をお受けします。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].date,
      sections: [
        {
          heading: 'ご連絡方法',
          body: [
            '星屑をご利用中に気になる点やご提案があれば、下記のチャンネルよりお気軽にお知らせください。小さなご意見もサービスを磨く大きな助けになります。',
          ],
        },
        {
          heading: 'お受けする内容',
          body: [
            '不具合のご報告、誤字や不自然な翻訳のご指摘、新機能のご提案、広告・提携のお問い合わせ、個人情報に関するご請求まで、すべて歓迎します。不具合をお知らせいただく際は、ご使用の端末・ブラウザと、どのような状況で問題が起きたかを併せてお書きいただくと、原因を早く特定できます。',
          ],
        },
        {
          heading: '返信について',
          body: [
            'いただいたお問い合わせは、届いた順に確認して返信します。ただし個人で運営しているため、ご返信までに数日いただくことがあります。あらかじめご了承ください。',
          ],
        },
        {
          heading: '個人情報に関するお問い合わせ',
          body: [
            '個人情報の取り扱いに関するお問い合わせはメールにてお送りください。確認のうえご案内します。詳しくはプライバシーポリシーをご覧ください。',
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
          description: '新機能やアップデートをお届けします。ちょっとしたお問い合わせはメンションやDMでも受け付けます。',
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
      description: '介绍 星黛洛 是什么服务、如何计算星盘，以及由谁制作。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].date,
      sections: [
        {
          heading: '星黛洛是什么',
          body: [
            '星黛洛是一款网页工具，根据您的出生日期、出生时间和出生地点解读西方占星学的星盘（本命盘）与运势。无需注册，任何人都能立即使用；与只看太阳星座的普通运势不同，星黛洛会计算您出生瞬间的整片星空，呈现更立体的您。',
          ],
        },
        {
          heading: '什么是星盘',
          body: [
            '星盘是描绘您出生瞬间太阳、月亮和行星在天空中位置的地图。人们常说的“某某座”只是其中的太阳星座，星黛洛在此基础上加入月亮星座、上升星座以及十二宫，更细致地描绘您的性格与人生领域。',
          ],
        },
        {
          heading: '您可以做什么',
          body: [
            '星黛洛会计算您出生瞬间的星空，一目了然地展示太阳、月亮、上升星座及各行星的分布。每日运势会把此刻运行于天空的行星叠加到您的星盘上解读当天的走向，爱情运则从金星、火星与关系宫位出发，解读您爱的方式与合适的时机。所有解读均支持韩语、英语、日语和中文。',
          ],
        },
        {
          heading: '如何计算',
          body: [
            '星黛洛采用回归黄道（tropical）与普拉西德斯宫位制，计算您出生瞬间的天体位置。计算使用公有领域的星历库，以地心为基准求得从太阳到冥王星共十颗天体的位置，其精度达到天文学上的严谨水平。',
          ],
        },
        {
          heading: '如何处理您的信息',
          body: [
            '您的出生日期、时间和地点仅在您的浏览器内计算，不会发送到任何服务器。关于个人信息如何存储与删除，您可在隐私政策中详细查看。',
          ],
        },
        {
          heading: '由谁制作',
          body: ['星黛洛由独立开发者 sobok 一人制作并运营。它源于一个简单的想法：让占星变得不再高深，可以轻松体验。'],
        },
        {
          heading: '使用提示',
          body: [
            '星黛洛的解读仅供自我了解与娱乐参考，不能替代医学、法律、财务等专业判断。有关使用服务的详细条款请见服务条款，如有疑问或建议，欢迎通过联系我们页面与我们联系。',
          ],
        },
      ],
    },
    contact: {
      title: '联系我们',
      description: '接收关于 星黛洛 的咨询、建议与错误反馈。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].date,
      sections: [
        {
          heading: '如何联系',
          body: [
            '在使用 星黛洛 时如有疑问或建议，欢迎通过以下渠道告诉我们。哪怕是很小的意见，也是我们打磨服务的重要帮助。',
          ],
        },
        {
          heading: '我们欢迎哪些反馈',
          body: [
            '错误与漏洞反馈、错别字或生硬的翻译、新功能建议、广告与合作咨询，以及个人信息相关请求，我们都非常欢迎。反馈错误时，如果一并说明您使用的设备、浏览器以及问题出现的情形，我们能更快找到原因。',
          ],
        },
        {
          heading: '回复说明',
          body: ['我们会按照收到的顺序查看并回复。不过本服务由一人运营，回复可能需要几天时间，敬请谅解。'],
        },
        {
          heading: '隐私相关咨询',
          body: ['有关个人信息处理的咨询请发送邮件，我们确认后会与您联系。详情请参阅隐私政策。'],
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
          description: '发布新功能与更新消息。简单的咨询也可通过提及或私信联系。',
          href: SOBOK_X_URL,
          value: SOBOK_X_HANDLE,
        },
      ],
    },
  },
} satisfies Record<Locale, InfoContent>
