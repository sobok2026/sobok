import { Locale } from '@sobok/domain/locale'

// Contact shown on the legal pages. Keep this a mailbox that is actually
// monitored (or swap it) — AdSense reviewers and users may write to it.
export const LEGAL_CONTACT_EMAIL = 'sobok2026@gmail.com'

export type LegalSection = {
  heading: string
  body: string[]
}

export type LegalDoc = {
  title: string
  description: string
  sections: LegalSection[]
}

export type LegalContent = {
  updatedLabel: string
  updatedDate: string
  contactLabel: string
  nav: {
    privacy: string
    terms: string
  }
  privacy: LegalDoc
  terms: LegalDoc
}

export const LEGAL = {
  [Locale.KO]: {
    updatedLabel: '최종 업데이트',
    updatedDate: '2026년 7월 12일',
    contactLabel: '문의',
    nav: {
      privacy: '개인정보처리방침',
      terms: '이용약관',
    },
    privacy: {
      title: '개인정보처리방침',
      description: '별무리(소복)가 이용자의 정보를 어떻게 다루는지 안내합니다.',
      sections: [
        {
          heading: '수집하는 정보',
          body: [
            '별무리는 별자리 계산을 위해 이용자가 입력한 생년월일, 태어난 시각, 출생지 정보를 사용합니다. 이 정보는 이용자의 브라우저 안에서만 처리·저장되며 별도의 서버로 전송되지 않습니다.',
            '서비스 이용 과정에서 접속 기기, 브라우저 종류, 방문 페이지 등 일반적인 이용 통계가 익명화된 형태로 수집될 수 있습니다.',
          ],
        },
        {
          heading: '쿠키와 광고',
          body: [
            '별무리는 Google AdSense를 통해 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 관심사 기반 광고를 제공할 수 있습니다.',
            '이용자는 https://adssettings.google.com 에서 맞춤 광고를 해제할 수 있으며, https://www.aboutads.info 에서 제3자 사업자의 광고 쿠키를 관리할 수 있습니다. Google의 광고 데이터 처리에 대한 자세한 내용은 https://policies.google.com/technologies/ads 에서 확인할 수 있습니다.',
          ],
        },
        {
          heading: '이용 통계 및 분석',
          body: [
            '별무리는 서비스 개선을 위해 Google 태그 매니저 및 분석 도구를 사용할 수 있습니다. 이 과정에서 개인을 식별하지 않는 범위의 이용 데이터가 처리됩니다.',
          ],
        },
        {
          heading: '정보의 보관과 삭제',
          body: [
            '입력한 출생 정보는 이용자의 브라우저 로컬 저장소에 보관되며, 브라우저의 기록·저장 데이터를 삭제하면 함께 삭제됩니다.',
          ],
        },
        {
          heading: '아동의 개인정보',
          body: [
            '별무리는 특정 연령을 대상으로 개인정보를 수집하기 위한 서비스가 아닙니다. 보호자의 동의가 필요한 경우 관련 법령을 따릅니다.',
          ],
        },
        {
          heading: '방침의 변경',
          body: ['본 방침은 법령이나 서비스 변경에 따라 개정될 수 있으며, 변경 시 본 페이지를 통해 안내합니다.'],
        },
      ],
    },
    terms: {
      title: '이용약관',
      description: '별무리(소복) 서비스 이용에 적용되는 약관입니다.',
      sections: [
        {
          heading: '서비스 소개',
          body: [
            '별무리는 생년월일 등 이용자가 입력한 정보를 바탕으로 별자리와 운세 해석을 제공하는 참고용 도구이며, 소복이 운영합니다.',
          ],
        },
        {
          heading: '오락·참고 목적',
          body: [
            '별무리가 제공하는 모든 별자리·운세 해석은 오락과 자기 이해를 돕기 위한 참고 정보이며, 의학·법률·재무 등 전문적인 조언을 대신하지 않습니다.',
            '이용자는 서비스의 내용을 중요한 의사결정의 유일한 근거로 삼지 않아야 하며, 서비스 이용에 따른 판단과 책임은 이용자 본인에게 있습니다.',
          ],
        },
        {
          heading: '광고',
          body: [
            '별무리에는 제3자 광고가 표시될 수 있습니다. 광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
          ],
        },
        {
          heading: '지식재산권',
          body: [
            '서비스에 포함된 텍스트, 디자인, 로고 등 콘텐츠에 대한 권리는 소복 또는 정당한 권리자에게 있으며, 무단 복제·배포를 금지합니다.',
          ],
        },
        {
          heading: '책임의 제한',
          body: [
            "서비스는 '있는 그대로' 제공되며, 서비스 이용 또는 이용 불가로 발생한 손해에 대해 관련 법령이 허용하는 범위에서 책임을 지지 않습니다.",
          ],
        },
        {
          heading: '약관의 변경',
          body: [
            '본 약관은 필요에 따라 변경될 수 있으며, 변경된 약관은 본 페이지에 게시된 시점부터 효력이 발생합니다.',
          ],
        },
        {
          heading: '준거법',
          body: ['본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.'],
        },
      ],
    },
  },

  [Locale.EN]: {
    updatedLabel: 'Last updated',
    updatedDate: 'July 12, 2026',
    contactLabel: 'Contact',
    nav: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'How Stella (sobok) handles your information.',
      sections: [
        {
          heading: 'Information we collect',
          body: [
            'Stella uses the birth date, time, and place you enter to calculate your astrological chart. This information is processed and stored only within your browser and is not sent to any server.',
            'General, anonymized usage statistics — such as device type, browser, and pages visited — may be collected while you use the service.',
          ],
        },
        {
          heading: 'Cookies and advertising',
          body: [
            'Stella shows ads through Google AdSense. Third-party vendors, including Google, may use cookies to serve interest-based ads based on your prior visits to this and other sites.',
            'You can opt out of personalized advertising at https://adssettings.google.com, and manage third-party advertising cookies at https://www.aboutads.info. Learn more about how Google uses advertising data at https://policies.google.com/technologies/ads.',
          ],
        },
        {
          heading: 'Usage analytics',
          body: [
            'Stella may use Google Tag Manager and analytics tools to improve the service. Only non-identifying usage data is processed in this context.',
          ],
        },
        {
          heading: 'Data retention and deletion',
          body: [
            "The birth details you enter are stored in your browser's local storage and are removed when you clear your browser's history or site data.",
          ],
        },
        {
          heading: "Children's privacy",
          body: [
            'Stella is not directed at collecting personal information from any specific age group. Where guardian consent is required, we follow applicable law.',
          ],
        },
        {
          heading: 'Changes to this policy',
          body: [
            'We may update this policy to reflect changes in law or the service, and will post any changes on this page.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      description: 'The terms that apply to using Stella (sobok).',
      sections: [
        {
          heading: 'About the service',
          body: [
            'Stella is a reference tool that provides astrological and horoscope interpretations based on information you enter, such as your birth date. It is operated by sobok.',
          ],
        },
        {
          heading: 'For entertainment and reference',
          body: [
            'All astrological and horoscope interpretations provided by Stella are for entertainment and self-reflection only and are not a substitute for professional medical, legal, or financial advice.',
            'You should not rely on the service as the sole basis for important decisions; any decisions and responsibility arising from your use of the service are your own.',
          ],
        },
        {
          heading: 'Advertising',
          body: [
            'Stella may display third-party ads. External sites reached through those ads are responsible for their own content and transactions.',
          ],
        },
        {
          heading: 'Intellectual property',
          body: [
            'Rights to the text, design, logos, and other content in the service belong to sobok or their rightful owners, and unauthorized reproduction or distribution is prohibited.',
          ],
        },
        {
          heading: 'Limitation of liability',
          body: [
            'The service is provided “as is,” and to the extent permitted by law we are not liable for damages arising from your use of, or inability to use, the service.',
          ],
        },
        {
          heading: 'Changes to these terms',
          body: ['We may change these terms as needed, and changes take effect when posted on this page.'],
        },
        {
          heading: 'Governing law',
          body: ['These terms are governed by and interpreted under the laws of the Republic of Korea.'],
        },
      ],
    },
  },

  [Locale.JA]: {
    updatedLabel: '最終更新',
    updatedDate: '2026年7月12日',
    contactLabel: 'お問い合わせ',
    nav: {
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
    },
    privacy: {
      title: 'プライバシーポリシー',
      description: '星屑（sobok）が利用者の情報をどのように扱うかについてご案内します。',
      sections: [
        {
          heading: '収集する情報',
          body: [
            '星屑は星座を計算するために、利用者が入力した生年月日・出生時刻・出生地の情報を使用します。これらの情報は利用者のブラウザ内でのみ処理・保存され、サーバーに送信されることはありません。',
            'サービスの利用中に、デバイスの種類・ブラウザ・閲覧ページなどの一般的な利用統計が匿名化された形で収集される場合があります。',
          ],
        },
        {
          heading: 'Cookieと広告',
          body: [
            '星屑はGoogle AdSenseを通じて広告を表示します。Googleを含む第三者配信事業者は、Cookieを使用して、利用者の過去の閲覧履歴に基づく関心に応じた広告を配信することがあります。',
            '利用者は https://adssettings.google.com でパーソナライズ広告を無効にでき、https://www.aboutads.info で第三者事業者の広告Cookieを管理できます。Googleによる広告データの利用について詳しくは https://policies.google.com/technologies/ads をご覧ください。',
          ],
        },
        {
          heading: '利用状況の分析',
          body: [
            '星屑はサービス改善のためにGoogleタグマネージャーおよび分析ツールを使用することがあります。この際、個人を特定しない範囲の利用データが処理されます。',
          ],
        },
        {
          heading: '情報の保存と削除',
          body: [
            '入力された出生情報は利用者のブラウザのローカルストレージに保存され、ブラウザの履歴やサイトデータを削除すると併せて削除されます。',
          ],
        },
        {
          heading: '子どものプライバシー',
          body: [
            '星屑は特定の年齢層から個人情報を収集することを目的としたサービスではありません。保護者の同意が必要な場合は関連法令に従います。',
          ],
        },
        {
          heading: 'ポリシーの変更',
          body: ['本ポリシーは法令やサービスの変更に応じて改定されることがあり、変更時は本ページでお知らせします。'],
        },
      ],
    },
    terms: {
      title: '利用規約',
      description: '星屑（sobok）のご利用に適用される規約です。',
      sections: [
        {
          heading: 'サービスについて',
          body: [
            '星屑は、生年月日など利用者が入力した情報に基づいて星座や運勢の解釈を提供する参考用ツールです。sobokが運営しています。',
          ],
        },
        {
          heading: '娯楽・参考目的',
          body: [
            '星屑が提供するすべての星座・運勢の解釈は、娯楽および自己理解のための参考情報であり、医学・法律・財務などの専門的な助言に代わるものではありません。',
            '利用者は本サービスの内容を重要な意思決定の唯一の根拠とすべきではなく、サービス利用に伴う判断と責任は利用者ご自身にあります。',
          ],
        },
        {
          heading: '広告',
          body: [
            '星屑には第三者の広告が表示される場合があります。広告を通じて遷移する外部サイトのコンテンツや取引については、当該サイトが責任を負います。',
          ],
        },
        {
          heading: '知的財産権',
          body: [
            'サービスに含まれるテキスト・デザイン・ロゴなどのコンテンツに関する権利はsobokまたは正当な権利者に帰属し、無断での複製・配布を禁じます。',
          ],
        },
        {
          heading: '責任の制限',
          body: [
            '本サービスは「現状有姿」で提供され、法令が認める範囲において、サービスの利用または利用不能によって生じた損害について責任を負いません。',
          ],
        },
        {
          heading: '規約の変更',
          body: [
            '本規約は必要に応じて変更されることがあり、変更後の規約は本ページに掲載された時点から効力を生じます。',
          ],
        },
        {
          heading: '準拠法',
          body: ['本規約は大韓民国の法令に従って解釈・適用されます。'],
        },
      ],
    },
  },

  [Locale.ZH]: {
    updatedLabel: '最后更新',
    updatedDate: '2026年7月12日',
    contactLabel: '联系方式',
    nav: {
      privacy: '隐私政策',
      terms: '服务条款',
    },
    privacy: {
      title: '隐私政策',
      description: '说明 星黛洛（sobok）如何处理您的信息。',
      sections: [
        {
          heading: '我们收集的信息',
          body: [
            '星黛洛使用您输入的出生日期、出生时间和出生地点来计算星盘。这些信息仅在您的浏览器内处理和存储，不会发送到任何服务器。',
            '在您使用服务时，可能会以匿名方式收集设备类型、浏览器和访问页面等一般使用统计信息。',
          ],
        },
        {
          heading: 'Cookie 与广告',
          body: [
            '星黛洛通过 Google AdSense 展示广告。包括 Google 在内的第三方供应商可能会使用 Cookie，根据您以往的访问记录投放基于兴趣的广告。',
            '您可以在 https://adssettings.google.com 关闭个性化广告，并在 https://www.aboutads.info 管理第三方供应商的广告 Cookie。有关 Google 如何使用广告数据的更多信息，请访问 https://policies.google.com/technologies/ads。',
          ],
        },
        {
          heading: '使用分析',
          body: [
            '星黛洛可能使用 Google 跟踪代码管理器和分析工具来改进服务。在此过程中仅处理无法识别个人身份的使用数据。',
          ],
        },
        {
          heading: '信息的存储与删除',
          body: ['您输入的出生信息存储在您浏览器的本地存储中，清除浏览器的历史记录或网站数据时会一并删除。'],
        },
        {
          heading: '儿童隐私',
          body: ['星黛洛并非旨在面向特定年龄群体收集个人信息。在需要监护人同意的情况下，我们将遵守适用法律。'],
        },
        {
          heading: '政策变更',
          body: ['我们可能会根据法律或服务的变化更新本政策，并在本页面公布任何变更。'],
        },
      ],
    },
    terms: {
      title: '服务条款',
      description: '适用于使用 星黛洛（sobok）的条款。',
      sections: [
        {
          heading: '关于服务',
          body: ['星黛洛是一款参考工具，根据您输入的出生日期等信息提供星座与运势解读，由 sobok 运营。'],
        },
        {
          heading: '娱乐与参考目的',
          body: [
            '星黛洛提供的所有星座与运势解读仅供娱乐和自我了解参考，不能替代医学、法律、财务等专业建议。',
            '您不应将本服务作为重要决策的唯一依据；因使用本服务而做出的判断与责任由您自行承担。',
          ],
        },
        {
          heading: '广告',
          body: ['星黛洛可能会展示第三方广告。通过广告跳转的外部网站，其内容与交易由该网站负责。'],
        },
        {
          heading: '知识产权',
          body: ['服务中包含的文本、设计、徽标等内容的权利归 sobok 或合法权利人所有，禁止未经授权的复制或传播。'],
        },
        {
          heading: '责任限制',
          body: ['本服务按“现状”提供，在法律允许的范围内，我们不对因使用或无法使用本服务而产生的损失承担责任。'],
        },
        {
          heading: '条款变更',
          body: ['我们可能会根据需要变更本条款，变更后的条款自在本页面公布之时起生效。'],
        },
        {
          heading: '适用法律',
          body: ['本条款受大韩民国法律管辖并据其解释。'],
        },
      ],
    },
  },
} satisfies Record<Locale, LegalContent>
