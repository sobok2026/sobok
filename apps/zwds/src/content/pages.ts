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
      description: '자미원이 어떤 서비스이고 명반을 어떻게 계산하며 누가 만드는지 알려드립니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].about,
      sections: [
        {
          heading: '자미원은 어떤 서비스인가요',
          body: [
            '자미원은 생년월일과 태어난 시각 그리고 출생지를 바탕으로 자미두수 명반을 그려 풀어 주는 웹 도구입니다. 회원가입 없이 누구나 바로 이용할 수 있으며 태양 별자리 하나만 보는 일반 운세와 달리 태어난 순간을 열두 궁으로 펼쳐 더 입체적인 나를 보여 줍니다.',
          ],
        },
        {
          heading: '자미두수 명반이란 무엇인가요',
          body: [
            '자미두수는 태어난 연·월·일·시를 간지로 바꿔 자미성을 비롯한 별을 열두 궁에 배치하는 동양의 별자리입니다. 명반은 그 배치를 그린 지도로, 명궁을 중심으로 형제·부부·재백·관록 같은 열두 궁에 놓인 주성과 사화를 함께 읽어 나의 성향과 삶의 영역을 그려 줍니다.',
          ],
        },
        {
          heading: '무엇을 할 수 있나요',
          body: [
            '태어난 순간의 명반을 열두 궁으로 한눈에 보여 주며, 명궁과 신궁, 14주성과 길성·살성, 화록·화권·화과·화기의 사화, 오행국과 대한의 흐름을 함께 읽습니다. 완성한 명반은 이미지로 저장하거나 공유할 수 있고, 모든 표기와 풀이는 한국어와 영어 그리고 일본어와 중국어로 제공합니다.',
          ],
        },
        {
          heading: '어떻게 계산하나요',
          body: [
            '자미원은 오픈소스 자미두수 라이브러리를 계산 엔진으로 사용하고, 그 위에 자체 표기층을 얹어 한글을 우선하고 한자를 함께 보여 줍니다. 입력한 시각은 출생지의 경도와 균시차를 반영한 진태양시로 자동 보정해 시진을 정하며, 모든 계산은 이용자의 브라우저 안에서 이루어집니다. 태어난 시각이 궁의 배치를 좌우하므로 시각을 정확히 알수록 명반이 실제에 가까워집니다.',
          ],
        },
        {
          heading: '입력한 정보는 어떻게 다루나요',
          body: [
            '입력 폼의 생년월일과 시각 그리고 출생지는 이용자의 브라우저 안에서 계산되며 자미원 서버에 직접 제출되지 않습니다. 저장을 선택하면 이 브라우저에 보관되고, 링크 공유를 선택하면 명반 재현에 필요한 출생 정보가 공유 URL에 포함되어 링크를 받은 사람에게 전달됩니다. 자세한 저장·삭제·공유 방식은 개인정보처리방침에서 확인할 수 있습니다.',
          ],
        },
        {
          heading: '누가 만드나요',
          body: [
            '자미원은 1인 개발자 소복(sobok)이 만들고 운영하며 자미두수를 어렵지 않게 즐길 수 있게 하자는 생각으로 시작했습니다.',
          ],
        },
        {
          heading: '이용 시 유의해 주세요',
          body: [
            '자미원의 풀이는 자기 이해와 즐거움을 위한 참고 정보이며 의학·법률·재무 같은 전문적인 판단을 대신하지 않습니다. 서비스 이용에 관한 자세한 조건은 이용약관에서 확인할 수 있으니 궁금한 점이나 제안이 있으면 문의하기 페이지로 연락해 주세요.',
          ],
        },
      ],
    },
    contact: {
      title: '문의하기',
      description: '자미원에 관한 문의와 제안 그리고 오류 신고를 받는 곳입니다.',
      updatedLabel: UPDATED[Locale.KO].label,
      updatedDate: UPDATED[Locale.KO].contact,
      sections: [
        {
          heading: '이렇게 연락해 주세요',
          body: [
            '자미원을 쓰다가 생긴 궁금한 점이나 제안이 있으면 아래 채널로 편하게 알려 주세요. 작은 의견도 서비스를 다듬는 데 큰 도움이 됩니다.',
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
      description: 'What Ziwei is, how it calculates your chart, and who builds it.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].about,
      sections: [
        {
          heading: 'What is Ziwei',
          body: [
            'Ziwei is a web tool that draws and reads your Zi Wei Dou Shu chart from your birth date, time, and place. Anyone can use it right away with no sign-up, and unlike a plain horoscope that looks at your Sun sign alone, Ziwei unfolds the moment you were born across twelve palaces for a fuller picture of you.',
          ],
        },
        {
          heading: 'What is a Zi Wei Dou Shu chart',
          body: [
            'Zi Wei Dou Shu is an Eastern form of astrology that converts the year, month, day, and hour of your birth into the sexagenary cycle to place the Purple Star and other stars across twelve palaces. The chart maps that arrangement: centered on the Life Palace, it reads the major stars and four transformations in palaces such as Siblings, Spouse, Wealth, and Career to describe your character and the areas of your life.',
          ],
        },
        {
          heading: 'What you can do',
          body: [
            'Ziwei shows your birth chart across twelve palaces at a glance, reading the Life and Body Palaces, the 14 major stars with their auspicious and inauspicious companions, the four transformations (Lu, Quan, Ke, Ji), the Five Elements class, and the flow of the decade cycles. You can save or share your finished chart as an image, and every label and reading is available in Korean, English, Japanese, and Chinese.',
          ],
        },
        {
          heading: 'How it calculates',
          body: [
            'Ziwei uses an open-source Zi Wei Dou Shu library as its calculation engine, with a notation layer on top that leads with the local language and shows the Chinese characters alongside. The time you enter is automatically corrected to true solar time using your birthplace’s longitude and the equation of time to fix the two-hour period, and every calculation runs entirely in your browser. Because birth time decides how the palaces are arranged, the more precisely you know the time, the closer the chart is to reality.',
          ],
        },
        {
          heading: 'How your data is handled',
          body: [
            'The birth date, time, and place entered in the form are calculated in your browser and are not directly submitted to Ziwei’s server. If you choose to save them, they stay in this browser. If you choose link sharing, the birth details needed to reproduce the chart are included in the shared URL and delivered to anyone who receives it. See the Privacy Policy for storage, deletion, and sharing details.',
          ],
        },
        {
          heading: 'Who builds it',
          body: [
            'Ziwei is built and run by sobok, a solo indie developer. It began with a simple goal: make Zi Wei Dou Shu easy to enjoy.',
          ],
        },
        {
          heading: 'Please keep in mind',
          body: [
            'Ziwei’s readings are for self-reflection and fun, and are not a substitute for professional medical, legal, or financial advice. The full terms for using the service are in the Terms of Service, and if you have a question or suggestion, reach out through the Contact page.',
          ],
        },
      ],
    },
    contact: {
      title: 'Contact',
      description: 'Where to send questions, suggestions, and bug reports about Ziwei.',
      updatedLabel: UPDATED[Locale.EN].label,
      updatedDate: UPDATED[Locale.EN].contact,
      sections: [
        {
          heading: 'How to reach us',
          body: [
            'If you have a question or suggestion while using Ziwei, let us know through one of the channels below. Even small notes help us make the service better.',
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
            'We read and reply to messages in the order they arrive. Ziwei is run by one person, though, so a reply may take a few days — thank you for your patience.',
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
      description: '紫微垣がどんなサービスで、どのように命盤を計算し、誰が作っているのかをご案内します。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].about,
      sections: [
        {
          heading: '紫微垣とは',
          body: [
            '紫微垣は、生年月日・出生時刻・出生地をもとに紫微斗数の命盤を描いて読み解くウェブツールです。会員登録なしでどなたもすぐにご利用いただけ、太陽星座だけを見る一般的な運勢と違い、生まれた瞬間を十二宮に展開して、より立体的なあなたを映し出します。',
          ],
        },
        {
          heading: '紫微斗数の命盤とは',
          body: [
            '紫微斗数は、生まれた年・月・日・時を干支に変換し、紫微星をはじめとする星を十二宮に配置する東洋の星占いです。命盤はその配置を描いた地図で、命宮を中心に兄弟・夫妻・財帛・官禄などの十二宮に置かれた主星と四化を併せて読み、あなたの性質と人生の領域を描きます。',
          ],
        },
        {
          heading: 'できること',
          body: [
            '生まれた瞬間の命盤を十二宮でひと目に表示し、命宮と身宮、十四主星と吉星・煞星、化禄・化権・化科・化忌の四化、五行局と大限の流れを併せて読みます。完成した命盤は画像として保存・共有でき、すべての表記と解説は韓国語・英語・日本語・中国語でご利用いただけます。',
          ],
        },
        {
          heading: 'どのように計算するのか',
          body: [
            '紫微垣はオープンソースの紫微斗数ライブラリを計算エンジンに用い、その上に独自の表記層を重ねて、現地の言語を優先しつつ漢字も併記します。入力した時刻は出生地の経度と均時差を反映した真太陽時に自動補正して時辰を定め、すべての計算は利用者のブラウザ内で行われます。出生時刻が宮の配置を左右するため、時刻が正確なほど命盤は実際に近づきます。',
          ],
        },
        {
          heading: '入力情報の取り扱い',
          body: [
            '入力フォームの生年月日・出生時刻・出生地は利用者のブラウザ内で計算され、紫微垣のサーバーへ直接送信されません。保存を選ぶとこのブラウザに保管され、リンク共有を選ぶと、命盤の再現に必要な出生情報が共有URLに含まれ、リンクを受け取った人へ渡ります。保存・削除・共有の詳細はプライバシーポリシーでご確認いただけます。',
          ],
        },
        {
          heading: '運営者について',
          body: [
            '紫微垣は個人開発者の sobok が制作・運営しています。紫微斗数を難しく感じさせず、気軽に楽しめるようにしたいという思いから始めました。',
          ],
        },
        {
          heading: 'ご利用にあたって',
          body: [
            '紫微垣の解説は自己理解と娯楽のための参考情報であり、医学・法律・財務などの専門的な判断に代わるものではありません。サービス利用に関する詳しい条件は利用規約でご確認いただけますので、ご質問やご提案があればお問い合わせページからご連絡ください。',
          ],
        },
      ],
    },
    contact: {
      title: 'お問い合わせ',
      description: '紫微垣に関するお問い合わせ・ご提案・不具合のご報告をお受けします。',
      updatedLabel: UPDATED[Locale.JA].label,
      updatedDate: UPDATED[Locale.JA].contact,
      sections: [
        {
          heading: 'ご連絡方法',
          body: [
            '紫微垣をご利用中に気になる点やご提案があれば、下記のチャンネルよりお気軽にお知らせください。小さなご意見もサービスを磨く大きな助けになります。',
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
      description: '介绍 紫微垣 是什么服务、如何排盘，以及由谁制作。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].about,
      sections: [
        {
          heading: '紫微垣是什么',
          body: [
            '紫微垣是一款网页工具，根据您的出生日期、出生时间和出生地点排布并解读紫微斗数命盘。无需注册，任何人都能立即使用；与只看太阳星座的普通运势不同，紫微垣会把您出生的瞬间展开为十二宫，呈现更立体的您。',
          ],
        },
        {
          heading: '什么是紫微斗数命盘',
          body: [
            '紫微斗数是一种东方占星术，把出生的年、月、日、时换算为干支，将紫微星等星曜排入十二宫。命盘就是描绘这一排布的地图：以命宫为中心，结合兄弟、夫妻、财帛、官禄等十二宫中的主星与四化，描绘您的性格与人生领域。',
          ],
        },
        {
          heading: '您可以做什么',
          body: [
            '紫微垣会以十二宫一目了然地展示您出生瞬间的命盘，解读命宫与身宫、十四主星及吉星与煞星、化禄化权化科化忌的四化、五行局以及大限的走向。排好的命盘可以保存或分享为图片，所有标注与解读均支持韩语、英语、日语和中文。',
          ],
        },
        {
          heading: '如何排盘',
          body: [
            '紫微垣以开源的紫微斗数库作为计算引擎，并在其上叠加自有的标注层，优先显示本地语言并同时标注汉字。您输入的时间会根据出生地的经度与均时差校正为真太阳时以确定时辰，所有计算都完全在您的浏览器内完成。由于出生时间决定宫位的排布，时间越准确，命盘越接近实际。',
          ],
        },
        {
          heading: '如何处理您的信息',
          body: [
            '输入表单中的出生日期、时间和地点在您的浏览器内计算，不会直接提交到紫微垣的服务器。选择保存时，信息会保留在此浏览器中；选择链接分享时，重现命盘所需的出生信息会包含在共享 URL 中，并传递给收到链接的人。有关存储、删除与分享的详情，请参阅隐私政策。',
          ],
        },
        {
          heading: '由谁制作',
          body: [
            '紫微垣由独立开发者 sobok 一人制作并运营。它源于一个简单的想法：让紫微斗数变得不再高深，可以轻松体验。',
          ],
        },
        {
          heading: '使用提示',
          body: [
            '紫微垣的解读仅供自我了解与娱乐参考，不能替代医学、法律、财务等专业判断。有关使用服务的详细条款请见服务条款，如有疑问或建议，欢迎通过联系我们页面与我们联系。',
          ],
        },
      ],
    },
    contact: {
      title: '联系我们',
      description: '接收关于 紫微垣 的咨询、建议与错误反馈。',
      updatedLabel: UPDATED[Locale.ZH].label,
      updatedDate: UPDATED[Locale.ZH].contact,
      sections: [
        {
          heading: '如何联系',
          body: [
            '在使用 紫微垣 时如有疑问或建议，欢迎通过以下渠道告诉我们。哪怕是很小的意见，也是我们打磨服务的重要帮助。',
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
