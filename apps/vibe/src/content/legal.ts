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
  updatedDate: string
  sections: LegalSection[]
}

export type LegalNav = {
  privacy: string
  terms: string
}

export type LegalContent = {
  updatedLabel: string
  contactLabel: string
  nav: LegalNav
  privacy: LegalDoc
  terms: LegalDoc
}

export const LEGAL = {
  [Locale.KO]: {
    updatedLabel: '최종 업데이트',
    contactLabel: '문의',
    nav: {
      privacy: '개인정보처리방침',
      terms: '이용약관',
    },
    privacy: {
      title: '개인정보처리방침',
      description: '결타레(소복)가 이용자의 정보를 어떻게 다루는지 안내합니다.',
      updatedDate: '2026년 7월 18일',
      sections: [
        {
          heading: '테스트 답변 처리',
          body: [
            '결타레는 결지수 테스트와 대화 유형 테스트의 문항 답변을 이용자의 브라우저 안에서만 계산합니다. 답변 내용은 결타레 서버로 전송되거나 저장되지 않으며 회원가입도 필요하지 않습니다.',
          ],
        },
        {
          heading: '쿠키와 광고',
          body: [
            '결타레는 Google AdSense를 통해 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 관심사 기반 광고를 제공할 수 있습니다.',
            '이용자는 https://adssettings.google.com 에서 맞춤 광고를 해제할 수 있으며, https://www.aboutads.info 에서 제3자 사업자의 광고 쿠키를 관리할 수 있습니다. Google의 광고 데이터 처리에 대한 자세한 내용은 https://policies.google.com/technologies/ads 에서 확인할 수 있습니다.',
          ],
        },
        {
          heading: '이용 통계 및 분석',
          body: [
            '결타레는 서비스 개선을 위해 Google 태그 매니저 및 분석 도구를 사용할 수 있습니다. 이 과정에서 방문 페이지, 기기·브라우저 정보, 서비스 내 상호작용, 쿠키 또는 온라인 식별자 등이 각 도구 제공자의 정책에 따라 처리될 수 있습니다. 분석 이벤트에는 테스트 문항의 구체적인 답변 내용을 넣지 않습니다.',
          ],
        },
        {
          heading: '결과 공유',
          body: [
            '결지수 테스트에서 결과를 공유하면 계산된 결과 코드(등급·지수)가 공유 링크의 URL 파라미터에 포함되어 전달됩니다. 어떤 문항에 어떻게 답했는지는 링크에 포함되지 않습니다.',
            '공유 링크에는 만료나 철회 기능이 없습니다. 신뢰할 수 있는 상대에게만 공유해 주세요.',
          ],
        },
        {
          heading: '아동의 개인정보',
          body: ['결타레는 특정 연령을 대상으로 개인정보를 수집하기 위한 서비스가 아닙니다.'],
        },
        {
          heading: '방침의 변경',
          body: ['본 방침은 법령이나 서비스 변경에 따라 개정될 수 있으며 변경 시 본 페이지를 통해 안내합니다.'],
        },
      ],
    },
    terms: {
      title: '이용약관',
      description: '결타레(소복) 서비스 이용에 적용되는 약관입니다.',
      updatedDate: '2026년 7월 18일',
      sections: [
        {
          heading: '서비스 소개',
          body: ['결타레는 커플 케미를 가볍게 확인해보는 테스트 도구이며 소복이 운영합니다.'],
        },
        {
          heading: '오락·참고 목적',
          body: [
            '결타레가 제공하는 모든 결과는 오락과 자기 이해를 돕기 위한 참고 정보이며 관계에 관한 전문적인 상담이나 조언을 대신하지 않습니다.',
            '이용자는 서비스의 내용을 중요한 의사결정의 유일한 근거로 삼지 않아야 하며 서비스 이용에 따른 판단과 책임은 이용자 본인에게 있습니다.',
          ],
        },
        {
          heading: '광고',
          body: [
            '결타레에는 제3자 광고가 표시될 수 있습니다. 광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
          ],
        },
        {
          heading: '지식재산권',
          body: [
            '서비스에 포함된 텍스트, 디자인, 로고 등 콘텐츠에 대한 권리는 소복 또는 정당한 권리자에게 있으며 무단 복제·배포를 금지합니다.',
          ],
        },
        {
          heading: '책임의 제한',
          body: [
            "서비스는 '있는 그대로' 제공되며 서비스 이용 또는 이용 불가로 발생한 손해에 대해 관련 법령이 허용하는 범위에서 책임을 지지 않습니다.",
          ],
        },
        {
          heading: '약관의 변경',
          body: ['본 약관은 필요에 따라 변경될 수 있으며 변경된 약관은 본 페이지에 게시된 시점부터 효력이 발생합니다.'],
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
    contactLabel: 'Contact',
    nav: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'How vibe (sobok) handles your information.',
      updatedDate: 'July 18, 2026',
      sections: [
        {
          heading: 'Quiz answer processing',
          body: [
            'vibe calculates your answers to the Compatibility and Talk Type quizzes entirely in your browser. Answers are never sent to or stored on vibe’s server, and no sign-up is required.',
          ],
        },
        {
          heading: 'Cookies and advertising',
          body: [
            'vibe shows ads through Google AdSense. Third-party vendors, including Google, may use cookies to serve interest-based ads based on your prior visits to this and other sites.',
            'You can opt out of personalized advertising at https://adssettings.google.com, and manage third-party advertising cookies at https://www.aboutads.info. Learn more about how Google uses advertising data at https://policies.google.com/technologies/ads.',
          ],
        },
        {
          heading: 'Usage analytics',
          body: [
            'vibe may use Google Tag Manager and analytics tools to improve the service. Pages viewed, device and browser information, interactions within the service, cookies, or online identifiers may be processed under each provider’s policy. Analytics events never include the specific answers you gave.',
          ],
        },
        {
          heading: 'Sharing results',
          body: [
            'When you share a Compatibility quiz result, the computed result code (grade and score) is included as a URL parameter in the shared link. The individual answers behind that result are not included.',
            'Shared links do not expire and cannot be revoked. Share only with people you trust.',
          ],
        },
        {
          heading: "Children's privacy",
          body: ['vibe is not directed at collecting personal information from any specific age group.'],
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
      description: 'The terms that apply to using vibe (sobok).',
      updatedDate: 'July 18, 2026',
      sections: [
        {
          heading: 'About the service',
          body: ['vibe is a quiz tool for a light-hearted check of your couple chemistry. It is operated by sobok.'],
        },
        {
          heading: 'For entertainment and reference',
          body: [
            'All results provided by vibe are for entertainment and self-reflection only and are not a substitute for professional relationship advice or counseling.',
            'You should not rely on the service as the sole basis for important decisions; any decisions and responsibility arising from your use of the service are your own.',
          ],
        },
        {
          heading: 'Advertising',
          body: [
            'vibe may display third-party ads. External sites reached through those ads are responsible for their own content and transactions.',
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
    contactLabel: 'お問い合わせ',
    nav: {
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
    },
    privacy: {
      title: 'プライバシーポリシー',
      description: 'vibe（sobok）が利用者の情報をどのように扱うかについてご案内します。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '診断結果の処理',
          body: [
            'vibeは相性診断・会話タイプ診断の回答を利用者のブラウザ内でのみ計算します。回答内容がvibeのサーバーへ送信・保存されることはなく、会員登録も不要です。',
          ],
        },
        {
          heading: 'Cookieと広告',
          body: [
            'vibeはGoogle AdSenseを通じて広告を表示します。Googleを含む第三者配信事業者は、Cookieを使用して、利用者の過去の閲覧履歴に基づく関心に応じた広告を配信することがあります。',
            '利用者は https://adssettings.google.com でパーソナライズ広告を無効にでき、https://www.aboutads.info で第三者事業者の広告Cookieを管理できます。Googleによる広告データの利用について詳しくは https://policies.google.com/technologies/ads をご覧ください。',
          ],
        },
        {
          heading: '利用状況の分析',
          body: [
            'vibeはサービス改善のためにGoogleタグマネージャーおよび分析ツールを使用することがあります。閲覧ページ、端末・ブラウザ情報、サービス内での操作、Cookieまたはオンライン識別子などが各提供者のポリシーに従って処理される場合がありますが、分析イベントに診断の具体的な回答内容を含めることはありません。',
          ],
        },
        {
          heading: '結果の共有',
          body: [
            '相性診断の結果を共有すると、計算された結果コード（等級・スコア）が共有リンクのURLパラメータに含まれます。どの設問にどう回答したかはリンクに含まれません。',
            '共有リンクに有効期限や取り消し機能はありません。信頼できる相手にのみ共有してください。',
          ],
        },
        {
          heading: '子どものプライバシー',
          body: ['vibeは特定の年齢層から個人情報を収集することを目的としたサービスではありません。'],
        },
        {
          heading: 'ポリシーの変更',
          body: ['本ポリシーは法令やサービスの変更に応じて改定されることがあり、変更時は本ページでお知らせします。'],
        },
      ],
    },
    terms: {
      title: '利用規約',
      description: 'vibe（sobok）のご利用に適用される規約です。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: 'サービスについて',
          body: ['vibeはカップルのケミストリーを気軽に確認できる診断ツールです。sobokが運営しています。'],
        },
        {
          heading: '娯楽・参考目的',
          body: [
            'vibeが提供するすべての診断結果は、娯楽および自己理解のための参考情報であり、関係性に関する専門的な助言やカウンセリングに代わるものではありません。',
            '利用者は本サービスの内容を重要な意思決定の唯一の根拠とすべきではなく、サービス利用に伴う判断と責任は利用者ご自身にあります。',
          ],
        },
        {
          heading: '広告',
          body: [
            'vibeには第三者の広告が表示される場合があります。広告を通じて遷移する外部サイトのコンテンツや取引については当該サイトが責任を負います。',
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
    contactLabel: '联系方式',
    nav: {
      privacy: '隐私政策',
      terms: '服务条款',
    },
    privacy: {
      title: '隐私政策',
      description: '说明 vibe（sobok）如何处理您的信息。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '测试结果的处理',
          body: [
            'vibe 仅在您的浏览器内计算默契指数测试和对话类型测试的答案。答案内容不会被发送或保存到 vibe 的服务器，也无需注册账号。',
          ],
        },
        {
          heading: 'Cookie 与广告',
          body: [
            'vibe 通过 Google AdSense 展示广告。包括 Google 在内的第三方供应商可能会使用 Cookie，根据您以往的访问记录投放基于兴趣的广告。',
            '您可以在 https://adssettings.google.com 关闭个性化广告，并在 https://www.aboutads.info 管理第三方供应商的广告 Cookie。有关 Google 如何使用广告数据的更多信息，请访问 https://policies.google.com/technologies/ads。',
          ],
        },
        {
          heading: '使用分析',
          body: [
            'vibe 可能使用 Google 跟踪代码管理器和分析工具来改进服务。访问页面、设备与浏览器信息、服务内操作、Cookie 或在线标识符等可能会按照各工具提供方的政策进行处理，但分析事件中不会包含测试的具体答案内容。',
          ],
        },
        {
          heading: '结果分享',
          body: [
            '分享默契指数测试结果时，计算得出的结果代码（等级与分数）会包含在分享链接的 URL 参数中。具体答了哪些题目不会包含在链接中。',
            '共享链接不会过期，也无法撤回。请只分享给您信任的人。',
          ],
        },
        {
          heading: '儿童隐私',
          body: ['vibe 并非旨在面向特定年龄群体收集个人信息。'],
        },
        {
          heading: '政策变更',
          body: ['我们可能会根据法律或服务的变化更新本政策，并在本页面公布任何变更。'],
        },
      ],
    },
    terms: {
      title: '服务条款',
      description: '适用于使用 vibe（sobok）的条款。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '关于服务',
          body: ['vibe 是一款轻松测试情侣默契的工具，由 sobok 运营。'],
        },
        {
          heading: '娱乐与参考目的',
          body: [
            'vibe 提供的所有测试结果仅供娱乐和自我了解参考，不能替代专业的关系咨询或建议。',
            '您不应将本服务作为重要决策的唯一依据；因使用本服务而做出的判断与责任由您自行承担。',
          ],
        },
        {
          heading: '广告',
          body: ['vibe 可能会展示第三方广告。通过广告跳转的外部网站，其内容与交易由该网站负责。'],
        },
        {
          heading: '知识产权',
          body: ['服务中包含的文本、设计、徽标等内容的权利归 sobok 或合法权利人所有，禁止未经授权的复制或传播。'],
        },
        {
          heading: '责任限制',
          body: ['本服务按"现状"提供，在法律允许的范围内，我们不对因使用或无法使用本服务而产生的损失承担责任。'],
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
