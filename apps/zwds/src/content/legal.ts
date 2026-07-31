import type { Locale } from '@sobok/domain/locale'

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

export type LegalContent = {
  updatedLabel: string
  contactLabel: string
  nav: {
    privacy: string
    terms: string
  }
  privacy: LegalDoc
  terms: LegalDoc
}

export const LEGAL = {
  ko: {
    updatedLabel: '최종 업데이트',
    contactLabel: '문의',
    nav: {
      privacy: '개인정보처리방침',
      terms: '이용약관',
    },
    privacy: {
      title: '개인정보처리방침',
      description: '자미원(소복)이 이용자의 정보를 어떻게 다루는지 안내합니다.',
      updatedDate: '2026년 7월 18일',
      sections: [
        {
          heading: '출생 정보와 브라우저 처리',
          body: [
            '자미원은 자미두수 명반을 계산하기 위해 이용자가 입력한 생년월일, 태어난 시각, 출생지 정보를 사용합니다. 계산은 이용자의 브라우저 안에서 이루어지며, 자미원은 입력 폼의 출생 정보를 자미원 서버에 직접 제출받거나 계정에 저장하지 않습니다.',
            '“이 브라우저에 저장”을 선택하면 출생 정보가 브라우저의 로컬 저장소에 보관됩니다. 선택하지 않으면 현재 탭에서 결과를 이어 보기 위해 세션 저장소에 임시 보관됩니다.',
          ],
        },
        {
          heading: '쿠키와 광고',
          body: [
            '자미원은 Google AdSense를 통해 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 관심사 기반 광고를 제공할 수 있습니다.',
            '이용자는 https://adssettings.google.com 에서 맞춤 광고를 해제할 수 있으며, https://www.aboutads.info 에서 제3자 사업자의 광고 쿠키를 관리할 수 있습니다. Google의 광고 데이터 처리에 대한 자세한 내용은 https://policies.google.com/technologies/ads 에서 확인할 수 있습니다.',
          ],
        },
        {
          heading: '이용 통계 및 분석',
          body: [
            '자미원은 서비스 개선을 위해 Google 태그 매니저 및 분석 도구를 사용할 수 있습니다. 이 과정에서 방문 페이지, 기기·브라우저 정보, 서비스 내 상호작용, 쿠키 또는 온라인 식별자 등이 각 도구 제공자의 정책에 따라 처리될 수 있습니다.',
            '자미원이 직접 구성하는 분석 이벤트에는 생년월일, 태어난 시각, 출생지를 별도 항목으로 넣지 않습니다. 다만 공유 결과 URL에는 출생 정보가 포함되며, 아래 “결과 공유”에 설명한 범위에서 처리될 수 있습니다.',
          ],
        },
        {
          heading: '결과 공유',
          body: [
            '이용자가 링크 공유를 선택하면 명반 재현에 필요한 생년월일, 태어난 시각, 성별, 출생지 식별 정보가 URL의 “#” 뒤 프래그먼트에 인코딩되어 포함됩니다. 인코딩은 암호화가 아닙니다.',
            'URI 표준상 프래그먼트는 일반적인 페이지 요청에서 웹 서버로 전송되지 않습니다. 그러나 전체 링크는 이용자가 선택한 공유 대상과 링크를 받은 사람에게 전달되고, 공유 결과 페이지에서 실행되는 스크립트가 접근할 수 있습니다. 공유 대상과 분석·광고 도구는 각자의 정책에 따라 URL을 처리할 수 있습니다.',
            '공유 링크에는 만료나 철회 기능이 없습니다. 신뢰할 수 있는 상대에게만 공유해 주세요. 이미지 공유를 선택하면 생성된 명반 이미지와 공유 문구가 이용자가 선택한 대상으로 전달됩니다.',
          ],
        },
        {
          heading: '정보의 보관과 삭제',
          body: [
            '브라우저에 저장된 출생 정보는 서비스의 “저장된 정보 지우기” 기능을 사용하거나 해당 사이트의 저장 데이터를 삭제하면 제거됩니다. 세션 저장소의 임시 정보는 현재 탭의 세션이 끝나면 제거됩니다.',
            '기기에 저장된 정보를 삭제해도 이미 공유한 링크는 무효화되지 않으며, 자미원은 공유 대상이나 링크·이미지를 받은 사람이 보관한 사본을 삭제할 수 없습니다.',
          ],
        },
        {
          heading: '아동의 개인정보',
          body: [
            '자미원은 특정 연령을 대상으로 개인정보를 수집하기 위한 서비스가 아닙니다. 보호자의 동의가 필요한 경우 관련 법령을 따릅니다.',
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
      description: '자미원(소복) 서비스 이용에 적용되는 약관입니다.',
      updatedDate: '2026년 7월 18일',
      sections: [
        {
          heading: '서비스 소개',
          body: [
            '자미원은 생년월일과 태어난 시각 등 이용자가 입력한 정보를 바탕으로 자미두수 명반과 풀이를 제공하는 참고용 도구이며, 소복이 운영합니다.',
          ],
        },
        {
          heading: '오락·참고 목적',
          body: [
            '자미원이 제공하는 모든 명반과 풀이는 오락과 자기 이해를 돕기 위한 참고 정보이며, 의학·법률·재무 등 전문적인 조언을 대신하지 않습니다.',
            '이용자는 서비스의 내용을 중요한 의사결정의 유일한 근거로 삼지 않아야 하며, 서비스 이용에 따른 판단과 책임은 이용자 본인에게 있습니다.',
          ],
        },
        {
          heading: '광고',
          body: [
            '자미원에는 제3자 광고가 표시될 수 있습니다. 광고를 통해 연결되는 외부 사이트의 콘텐츠와 거래에 대한 책임은 해당 사이트에 있습니다.',
          ],
        },
        {
          heading: '지식재산권',
          body: [
            '서비스에 포함된 텍스트, 디자인, 로고 등 콘텐츠에 대한 권리는 소복 또는 정당한 권리자에게 있으며, 무단 복제·배포를 금지합니다. 명반 계산에는 오픈소스 라이브러리가 사용되며, 해당 라이브러리의 권리는 각 저작권자에게 있습니다.',
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

  en: {
    updatedLabel: 'Last updated',
    contactLabel: 'Contact',
    nav: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'How Ziwei (sobok) handles your information.',
      updatedDate: 'July 18, 2026',
      sections: [
        {
          heading: 'Birth information and in-browser processing',
          body: [
            'Ziwei uses the birth date, time, and place you enter to calculate your Zi Wei Dou Shu chart. The calculation runs in your browser. Ziwei does not directly submit the birth details from the form to its server or save them to an account.',
            'If you select “Save details in this browser,” your birth details are kept in the browser’s local storage. Otherwise, they are held temporarily in session storage so you can continue viewing your result in the current tab.',
          ],
        },
        {
          heading: 'Cookies and advertising',
          body: [
            'Ziwei shows ads through Google AdSense. Third-party vendors, including Google, may use cookies to serve interest-based ads based on your prior visits to this and other sites.',
            'You can opt out of personalized advertising at https://adssettings.google.com, and manage third-party advertising cookies at https://www.aboutads.info. Learn more about how Google uses advertising data at https://policies.google.com/technologies/ads.',
          ],
        },
        {
          heading: 'Usage analytics',
          body: [
            'Ziwei may use Google Tag Manager and analytics tools to improve the service. Pages viewed, device and browser information, interactions within the service, cookies, or online identifiers may be processed under each provider’s policy.',
            'The custom analytics events configured by Ziwei do not add your birth date, birth time, or birthplace as separate event fields. A shared-result URL does contain birth details and may be processed as described under “Sharing results” below.',
          ],
        },
        {
          heading: 'Sharing results',
          body: [
            'When you choose link sharing, the birth date, birth time, gender, and birthplace identifier needed to reproduce the chart are encoded in the URL fragment after “#”. Encoding is not encryption.',
            'Under the URI standard, a fragment is not sent to the web server in a normal page request. The complete link is still delivered to the share target you choose and to anyone who receives it, and scripts running on the shared-result page can access it. Share targets and analytics or advertising tools may process the URL under their own policies.',
            'Shared links do not expire and cannot be revoked. Share only with people or services you trust. If you choose image sharing, the generated chart image and accompanying share text are delivered to the target you select.',
          ],
        },
        {
          heading: 'Data retention and deletion',
          body: [
            'Birth details saved in the browser are removed when you use “Delete saved details” in the service or clear the site’s stored data. Temporary session-storage details are removed when the current tab session ends.',
            'Deleting details from your device does not invalidate links you already shared, and Ziwei cannot delete copies retained by a share target or recipient.',
          ],
        },
        {
          heading: "Children's privacy",
          body: [
            'Ziwei is not directed at collecting personal information from any specific age group. Where guardian consent is required, we follow applicable law.',
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
      description: 'The terms that apply to using Ziwei (sobok).',
      updatedDate: 'July 18, 2026',
      sections: [
        {
          heading: 'About the service',
          body: [
            'Ziwei is a reference tool that provides Zi Wei Dou Shu charts and readings based on information you enter, such as your birth date and time. It is operated by sobok.',
          ],
        },
        {
          heading: 'For entertainment and reference',
          body: [
            'All charts and readings provided by Ziwei are for entertainment and self-reflection only and are not a substitute for professional medical, legal, or financial advice.',
            'You should not rely on the service as the sole basis for important decisions; any decisions and responsibility arising from your use of the service are your own.',
          ],
        },
        {
          heading: 'Advertising',
          body: [
            'Ziwei may display third-party ads. External sites reached through those ads are responsible for their own content and transactions.',
          ],
        },
        {
          heading: 'Intellectual property',
          body: [
            'Rights to the text, design, logos, and other content in the service belong to sobok or their rightful owners, and unauthorized reproduction or distribution is prohibited. Chart calculation uses open-source libraries whose rights belong to their respective authors.',
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

  ja: {
    updatedLabel: '最終更新',
    contactLabel: 'お問い合わせ',
    nav: {
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
    },
    privacy: {
      title: 'プライバシーポリシー',
      description: '紫微垣（sobok）が利用者の情報をどのように扱うかについてご案内します。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '出生情報とブラウザ内での処理',
          body: [
            '紫微垣は紫微斗数の命盤を計算するために、利用者が入力した生年月日・出生時刻・出生地の情報を使用します。計算は利用者のブラウザ内で行われ、紫微垣は入力フォームの出生情報を紫微垣のサーバーへ直接送信したり、アカウントに保存したりしません。',
            '「このブラウザに保存」を選ぶと、出生情報はブラウザのローカルストレージに保存されます。選ばない場合は、現在のタブで結果を続けて表示するため、セッションストレージに一時保存されます。',
          ],
        },
        {
          heading: 'Cookieと広告',
          body: [
            '紫微垣はGoogle AdSenseを通じて広告を表示します。Googleを含む第三者配信事業者は、Cookieを使用して、利用者の過去の閲覧履歴に基づく関心に応じた広告を配信することがあります。',
            '利用者は https://adssettings.google.com でパーソナライズ広告を無効にでき、https://www.aboutads.info で第三者事業者の広告Cookieを管理できます。Googleによる広告データの利用について詳しくは https://policies.google.com/technologies/ads をご覧ください。',
          ],
        },
        {
          heading: '利用状況の分析',
          body: [
            '紫微垣はサービス改善のためにGoogleタグマネージャーおよび分析ツールを使用することがあります。この際、閲覧ページ、端末・ブラウザ情報、サービス内での操作、Cookieまたはオンライン識別子などが、各提供者のポリシーに従って処理される場合があります。',
            '紫微垣が独自に設定する分析イベントには、生年月日・出生時刻・出生地を個別の項目として追加しません。ただし共有結果のURLには出生情報が含まれ、下記「結果の共有」に記載する範囲で処理される場合があります。',
          ],
        },
        {
          heading: '結果の共有',
          body: [
            'リンク共有を選ぶと、命盤の再現に必要な生年月日、出生時刻、性別、出生地の識別情報がURLの「#」以降のフラグメントにエンコードされます。エンコードは暗号化ではありません。',
            'URI標準上、フラグメントは通常のページリクエストでウェブサーバーへ送信されません。ただし完全なリンクは選択した共有先とリンクを受け取った人へ渡り、共有結果ページで動作するスクリプトからもアクセスできます。共有先や分析・広告ツールは、それぞれのポリシーに従ってURLを処理する場合があります。',
            '共有リンクに有効期限や取り消し機能はありません。信頼できる相手やサービスにのみ共有してください。画像共有を選ぶと、生成された命盤画像と共有文が選択した共有先へ渡ります。',
          ],
        },
        {
          heading: '情報の保存と削除',
          body: [
            'ブラウザに保存された出生情報は、サービスの「保存した情報を削除」を使うか、このサイトの保存データを削除すると消去されます。セッションストレージの一時情報は、現在のタブのセッションが終了すると消去されます。',
            '端末上の情報を削除しても、すでに共有したリンクは無効になりません。紫微垣は、共有先やリンク・画像を受け取った人が保持するコピーを削除できません。',
          ],
        },
        {
          heading: '子どものプライバシー',
          body: [
            '紫微垣は特定の年齢層から個人情報を収集することを目的としたサービスではありません。保護者の同意が必要な場合は関連法令に従います。',
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
      description: '紫微垣（sobok）のご利用に適用される規約です。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: 'サービスについて',
          body: [
            '紫微垣は、生年月日や出生時刻など利用者が入力した情報に基づいて紫微斗数の命盤と解説を提供する参考用ツールです。sobokが運営しています。',
          ],
        },
        {
          heading: '娯楽・参考目的',
          body: [
            '紫微垣が提供するすべての命盤と解説は、娯楽および自己理解のための参考情報であり、医学・法律・財務などの専門的な助言に代わるものではありません。',
            '利用者は本サービスの内容を重要な意思決定の唯一の根拠とすべきではなく、サービス利用に伴う判断と責任は利用者ご自身にあります。',
          ],
        },
        {
          heading: '広告',
          body: [
            '紫微垣には第三者の広告が表示される場合があります。広告を通じて遷移する外部サイトのコンテンツや取引については、当該サイトが責任を負います。',
          ],
        },
        {
          heading: '知的財産権',
          body: [
            'サービスに含まれるテキスト・デザイン・ロゴなどのコンテンツに関する権利はsobokまたは正当な権利者に帰属し、無断での複製・配布を禁じます。命盤の計算にはオープンソースライブラリを使用しており、その権利は各著作権者に帰属します。',
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

  zh: {
    updatedLabel: '最后更新',
    contactLabel: '联系方式',
    nav: {
      privacy: '隐私政策',
      terms: '服务条款',
    },
    privacy: {
      title: '隐私政策',
      description: '说明 紫微垣（sobok）如何处理您的信息。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '出生信息与浏览器内处理',
          body: [
            '紫微垣使用您输入的出生日期、出生时间和出生地点来排布紫微斗数命盘。计算在您的浏览器内完成；紫微垣不会把输入表单中的出生信息直接提交到紫微垣的服务器，也不会将其保存到账号中。',
            '如果选择“在此浏览器保存”，出生信息会保存在浏览器的本地存储中；如果不选择，则会临时保存在会话存储中，以便您在当前标签页继续查看结果。',
          ],
        },
        {
          heading: 'Cookie 与广告',
          body: [
            '紫微垣通过 Google AdSense 展示广告。包括 Google 在内的第三方供应商可能会使用 Cookie，根据您以往的访问记录投放基于兴趣的广告。',
            '您可以在 https://adssettings.google.com 关闭个性化广告，并在 https://www.aboutads.info 管理第三方供应商的广告 Cookie。有关 Google 如何使用广告数据的更多信息，请访问 https://policies.google.com/technologies/ads。',
          ],
        },
        {
          heading: '使用分析',
          body: [
            '紫微垣可能使用 Google 跟踪代码管理器和分析工具来改进服务。访问页面、设备与浏览器信息、服务内操作、Cookie 或在线标识符等，可能会按照各工具提供方的政策进行处理。',
            '紫微垣自行配置的分析事件不会把出生日期、出生时间或出生地点作为单独的事件字段加入。不过，共享结果的 URL 中包含出生信息，并可能按下文“结果分享”所述方式被处理。',
          ],
        },
        {
          heading: '结果分享',
          body: [
            '选择链接分享时，重现命盘所需的出生日期、出生时间、性别，以及出生地点标识信息，会被编码在 URL 中“#”之后的片段里。编码不等于加密。',
            '根据 URI 标准，片段不会在普通页面请求中发送给网页服务器。但完整链接仍会传递给您选择的分享目标和收到链接的人，并且共享结果页面中运行的脚本也可以访问它。分享目标以及分析或广告工具可能会按照各自的政策处理该 URL。',
            '共享链接不会过期，也无法撤回。请只分享给您信任的人或服务。选择图片分享时，生成的命盘图片和分享文案会传递给您选择的分享目标。',
          ],
        },
        {
          heading: '信息的存储与删除',
          body: [
            '浏览器内保存的出生信息会在您使用服务中的“删除已保存的信息”功能，或清除本网站的存储数据时被移除。会话存储中的临时信息会在当前标签页会话结束时被移除。',
            '删除设备上的信息不会使已分享的链接失效；紫微垣也无法删除分享目标或收件人保留的副本。',
          ],
        },
        {
          heading: '儿童隐私',
          body: ['紫微垣并非旨在面向特定年龄群体收集个人信息。在需要监护人同意的情况下，我们将遵守适用法律。'],
        },
        {
          heading: '政策变更',
          body: ['我们可能会根据法律或服务的变化更新本政策，并在本页面公布任何变更。'],
        },
      ],
    },
    terms: {
      title: '服务条款',
      description: '适用于使用 紫微垣（sobok）的条款。',
      updatedDate: '2026年7月18日',
      sections: [
        {
          heading: '关于服务',
          body: ['紫微垣是一款参考工具，根据您输入的出生日期与时间等信息提供紫微斗数命盘与解读，由 sobok 运营。'],
        },
        {
          heading: '娱乐与参考目的',
          body: [
            '紫微垣提供的所有命盘与解读仅供娱乐和自我了解参考，不能替代医学、法律、财务等专业建议。',
            '您不应将本服务作为重要决策的唯一依据；因使用本服务而做出的判断与责任由您自行承担。',
          ],
        },
        {
          heading: '广告',
          body: ['紫微垣可能会展示第三方广告。通过广告跳转的外部网站，其内容与交易由该网站负责。'],
        },
        {
          heading: '知识产权',
          body: [
            '服务中包含的文本、设计、徽标等内容的权利归 sobok 或合法权利人所有，禁止未经授权的复制或传播。命盘计算使用了开源库，其权利归各自的著作权人所有。',
          ],
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
