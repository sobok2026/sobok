import type { Locale } from '@sobok/domain/locale'

// Evergreen, server-rendered FAQ copy. Kept as a plain module (like legal.ts)
// rather than next-intl messages so the answers stay crawlable prose and feed
// FAQPage structured data. Written per tool page, ko is the canonical source.
export type FaqItem = { q: string; a: string }
export type FaqPageKey = 'constellation' | 'today' | 'love' | 'guardianReport'

type FaqContent = { heading: string } & Record<FaqPageKey, FaqItem[]>

export const FAQ = {
  ko: {
    heading: '자주 묻는 질문',
    constellation: [
      {
        q: '탄생 별자리(네이탈 차트)가 무엇인가요?',
        a: '태어난 순간 하늘에 놓인 태양·달·행성의 위치를 그린 지도예요. 태양 별자리 하나만 보는 일반 별자리와 달리 달 별자리와 상승 별자리 그리고 열두 하우스까지 함께 읽어 나를 더 입체적으로 보여 줘요.',
      },
      {
        q: '태어난 시각을 모르면 별자리를 볼 수 없나요?',
        a: '태양 별자리와 대부분의 행성 배치는 시각 없이도 확인할 수 있어요. 달은 태어난 날의 처음과 끝 위치를 계산해, 별자리가 하나로 정해지는지와 두 별자리 사이를 이동했는지 보여 줘요. 정확한 달 도수와 각, 상승 별자리, 하우스, 차트 모양은 출생 시각을 알 때만 읽어요.',
      },
      {
        q: '태양 별자리랑 네이탈 차트는 뭐가 다른가요?',
        a: '흔히 아는 "무슨 자리"는 태양 별자리 하나예요. 네이탈 차트는 태양에 더해 달·수성·금성·화성처럼 여러 행성이 어느 자리와 하우스에 놓였는지까지 담아 성향을 훨씬 자세히 그려 줘요.',
      },
      {
        q: '무료인가요? 입력한 출생 정보는 어떻게 처리되나요?',
        a: '별무리의 탄생 별자리는 회원가입 없이 무료로 볼 수 있어요. 입력 폼의 출생 정보는 브라우저 안에서 계산되고 별무리 서버에 직접 제출되지 않아요. 다만 링크 공유를 선택하면 결과 재현에 필요한 출생 정보가 공유 URL에 포함되어 선택한 공유 대상과 링크를 받은 사람에게 전달돼요. 저장·삭제·공유 방식은 개인정보처리방침에서 자세히 확인할 수 있어요.',
      },
    ],
    today: [
      {
        q: '오늘의 별자리 운세는 어떻게 계산되나요?',
        a: '오늘 하늘을 지나는 행성의 위치를 내 탄생 별자리에 겹쳐 흐름을 읽어요. 행운 음식과 색상은 오늘 달의 원소·달의 위상·주요 각의 분위기를 조합하고, 차트가 있으면 태어난 날의 달 별자리와 금성까지 더해 골라요.',
      },
      {
        q: '수성 역행 같은 행성 역행은 무슨 뜻인가요?',
        a: '역행은 지구에서 볼 때 행성이 잠시 뒤로 도는 것처럼 보이는 시기예요. 수성 역행은 소통과 일정을 한 번 더 확인하라는 신호로, 금성 역행은 관계를 돌아보라는 신호로 자주 읽혀요.',
      },
      {
        q: '달의 위상은 왜 중요한가요?',
        a: '초승달에서 보름달로 차오르는 흐름은 시작하고 채워 가는 시기예요. 보름달에서 그믐으로 기우는 흐름은 비우고 정리하는 시기고요. 오늘 달이 어디쯤인지 알면 하루의 리듬을 맞추기 좋아요.',
      },
      {
        q: '오늘의 흐름은 매일 바뀌나요?',
        a: '네, 행성과 달이 매일 움직여서 오늘의 무대와 행운 음식·색상도 자정마다 새로 떠요. 같은 날짜와 차트에서는 언제 다시 보아도 같은 추천을 확인할 수 있어요.',
      },
    ],
    guardianReport: [
      {
        q: '무료 결과와 유료 리포트는 무엇이 다른가요?',
        a: '무료 결과는 두 가지 마음 질문과 이미 만든 출생 차트를 읽어 지금의 마음과 별자리 단서와 오늘의 한 걸음을 보여 줘요. 유료 리포트는 여기에 16~20개의 답을 더해 자기이해·사랑·일·결정 네 주제의 상세 본문과 네 장의 수호령 카드, 주제를 잇는 요약과 행동 문장까지 완성해요.',
      },
      {
        q: '질문이 왜 사람마다 다른가요?',
        a: '핵심 12문항은 모두 같아요. 그 뒤로는 앞선 답에서 더 살펴볼 필요가 있는 주제만 4~8문항으로 이어져요. 그래서 실제로 받는 질문은 16개에서 20개 사이가 돼요.',
      },
      {
        q: '결제한 뒤 중간에 나가도 되나요?',
        a: '답변은 한 문항씩 저장돼요. 같은 브라우저에서는 다시 돌아와 이어서 답할 수 있고, 구매할 때 입력한 이메일로 재열람 링크를 받아 다른 기기에서 이어갈 수도 있어요.',
      },
      {
        q: '사랑 카드의 희귀도는 무엇인가요?',
        a: '사랑 카드에는 오비트·네뷸라·이클립스·스텔라 네 단계 중 하나가 정해져요. 희귀도는 카드 그림의 결만 바꾸고 리포트 본문의 분량이나 내용은 바꾸지 않아요. 자기이해·일·결정 카드에는 희귀도가 없어요.',
      },
      {
        q: '마음에 들지 않으면 환불되나요?',
        a: '완성된 리포트를 열기 전에는 언제든 전액 환불받을 수 있어요. 맞춤 질문을 푸는 중이거나 중단한 상태도 여기에 해당해요. 리포트를 연 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한되며 자세한 내용은 청약철회·환불 정책에 있어요.',
      },
    ],
    love: [
      {
        q: '연애운은 어떻게 읽나요?',
        a: '금성과 화성을 중심으로 내가 사랑하는 방식과 끌리는 상대를 읽어요. 출생 시각을 알면 디센던트와 7하우스까지 더하고, 모르면 태양의 반대편을 관계의 기준점으로 사용하되 하우스 해석은 제외해요. 달은 출생일 내내 같은 별자리에 머문 경우에만 마음의 결에 반영해요.',
      },
      {
        q: '별자리 궁합도 볼 수 있나요?',
        a: '이 페이지는 두 사람을 맞대어 보는 궁합 대신 내 차트로 나에게 어울리는 이상적인 파트너의 결을 읽어 줘요. 나를 먼저 이해하면 어떤 사람과 잘 맞는지도 자연스럽게 보여요.',
      },
      {
        q: '금성과 화성이 연애랑 무슨 상관인가요?',
        a: '금성은 내가 무엇에 끌리고 어떻게 애정을 표현하는지를 보여 줘요. 화성은 다가가는 방식과 열정의 온도를 보여 주고요. 두 별의 자리를 읽으면 내 연애 스타일이 또렷해져요.',
      },
      {
        q: '연애운이 좋은 시기는 어떻게 정해지나요?',
        a: '앞으로 약 1년 동안 목성·토성이 내 금성과 맺는 주요 각, 금성 역행을 살펴요. 출생 시각을 알면 목성이 디센던트에 닿는 시기도 더해요. 5일 간격으로 탐색한 결과를 월 단위 범위로 보여 주므로 특정 날짜를 확정하는 예측이 아니라 큰 흐름을 참고하는 용도예요.',
      },
    ],
  },

  en: {
    heading: 'Frequently asked questions',
    constellation: [
      {
        q: 'What is a birth chart (natal chart)?',
        a: 'It is a map of where the Sun, Moon, and planets sat in the sky the moment you were born. Unlike a single Sun sign, a birth chart also reads your Moon sign, Rising sign, and the twelve houses for a fuller picture of you.',
      },
      {
        q: 'Can I read my chart without my birth time?',
        a: 'Your Sun sign and most planet placements still show without a time. We calculate the Moon at the beginning and end of your birth date to show whether one sign is certain or two remain possible. Exact Moon degrees and aspects, the Rising sign, houses, and chart shape appear only when the birth time is known.',
      },
      {
        q: 'How is a Sun sign different from a birth chart?',
        a: 'The sign you usually know is just your Sun sign. A birth chart adds the Moon, Mercury, Venus, Mars, and more — showing which sign and house each planet falls in for a much richer portrait.',
      },
      {
        q: 'Is it free, and how is my birth data handled?',
        a: 'Stella’s birth chart is free with no sign-up. Birth details entered in the form are calculated in your browser and are not directly submitted to Stella’s server. If you choose link sharing, however, the birth details needed to reproduce the result are included in the shared URL and delivered to the selected share target and anyone who receives the link. See the Privacy Policy for storage, deletion, and sharing details.',
      },
    ],
    today: [
      {
        q: "How is today's horoscope calculated?",
        a: "We overlay the planets moving through today's sky onto your birth chart. Lucky food and color combine the Moon’s element, phase, and major aspect tone, then add Venus and your natal Moon sign when that sign can be confirmed.",
      },
      {
        q: 'What does a retrograde like Mercury retrograde mean?',
        a: 'A retrograde is a stretch when a planet appears to move backward from Earth. Mercury retrograde is often read as a nudge to double-check messages and plans; Venus retrograde, to revisit relationships.',
      },
      {
        q: 'Why does the moon phase matter?',
        a: 'Waxing from new to full is a time to begin and build. Waning from full to dark is a time to release and tidy up. Knowing where the Moon is helps you match your rhythm to the day.',
      },
      {
        q: "Does today's flow change every day?",
        a: 'Yes — the planets and Moon move daily, so your stage, lucky food, and color refresh at midnight. The same date and chart always produce the same picks.',
      },
    ],
    guardianReport: [
      {
        q: 'How does the free result differ from the paid report?',
        a: 'The free result reads your two mood answers together with the free birth chart you already made, and shows where your heart is now, the placements behind it, and one step for today. The paid report adds 16–20 further answers and produces full text for all four themes — self, love, work and decisions — four guardian cards, and a summary that ties the themes together with concrete next actions.',
      },
      {
        q: 'Why do people get different questions?',
        a: 'The 12 core questions are the same for everyone. After those, only the themes your earlier answers left open continue, for another 4–8 questions. That is why the total lands somewhere between 16 and 20.',
      },
      {
        q: 'Can I leave partway through after paying?',
        a: 'Each answer is saved as you give it. You can come back in the same browser and continue, or have a reopen link sent to the email you used at checkout and continue on another device.',
      },
      {
        q: 'What is the love card’s rarity?',
        a: 'The love card is assigned one of four tiers: Orbit, Nebula, Eclipse or Stella. Rarity changes only the artwork; it does not change the length or the substance of the report. The self, work and decision cards have no rarity.',
      },
      {
        q: 'Can I get a refund if I don’t like it?',
        a: 'You can have a full refund at any time before you open the finished report — including while you are partway through the tailored questions, or after stopping. Once you open it, the right of withdrawal is limited because the content has been delivered; the Withdrawal & Refund Policy has the detail.',
      },
    ],
    love: [
      {
        q: 'How do you read my love life?',
        a: 'We start with Venus and Mars to read how you love and who draws you in. With a known birth time, we add the Descendant and seventh house. Without one, we use the point opposite your Sun as a relationship reference and leave out house readings. The Moon shapes this reading only when it stays in one sign throughout your birth date.',
      },
      {
        q: 'Can I check zodiac compatibility here?',
        a: 'Instead of comparing two people, this page uses your own chart to describe the partner who naturally suits you. Understanding yourself first makes it clear who you fit with.',
      },
      {
        q: 'What do Venus and Mars have to do with love?',
        a: 'Venus shows what attracts you and how you show affection. Mars shows how you pursue and the heat of your passion. Reading both brings your love style into focus.',
      },
      {
        q: 'How are the good seasons for love decided?',
        a: 'Across roughly the next year, we check the major aspects Jupiter and Saturn make to your natal Venus and the periods when Venus is retrograde. When your birth time is known, we also add Jupiter’s conjunction with your Descendant. The scan samples every five days and presents month-level ranges, so these are broad currents for reflection rather than exact-date predictions.',
      },
    ],
  },

  ja: {
    heading: 'よくある質問',
    constellation: [
      {
        q: '出生図（ネイタルチャート）とは何ですか？',
        a: '生まれた瞬間の空にあった太陽・月・惑星の位置を描いた地図です。太陽星座だけを見る一般的な占いと違い、月星座や上昇星座、十二のハウスまで読み、あなたをより立体的に映します。',
      },
      {
        q: '生まれた時刻がわからなくても見られますか？',
        a: '太陽星座やほとんどの惑星の配置は時刻がなくても確認できます。月は出生日の始まりと終わりの位置を計算し、ひとつの星座に確定するか、二つの星座が候補になるかを示します。月の正確な度数とアスペクト、上昇星座、ハウス、チャート形状は出生時刻が分かる場合だけ読みます。',
      },
      {
        q: '太陽星座と出生図はどう違いますか？',
        a: 'よく知る「〇〇座」は太陽星座ひとつです。出生図は太陽に加えて月・水星・金星・火星などがどの星座とハウスにあるかまで含め、性格をずっと詳しく描きます。',
      },
      {
        q: '無料ですか？入力した出生情報はどのように扱われますか？',
        a: '星屑の出生図は登録不要で無料です。入力フォームの出生情報はブラウザ内で計算され、星屑のサーバーへ直接送信されません。ただしリンク共有を選ぶと、結果の再現に必要な出生情報が共有URLに含まれ、選択した共有先とリンクを受け取った人へ渡ります。保存・削除・共有の詳細はプライバシーポリシーでご確認いただけます。',
      },
    ],
    today: [
      {
        q: '今日の星座占いはどう計算されますか？',
        a: '今日の空を通る惑星の位置を出生図に重ねて流れを読みます。ラッキーフードとカラーは、今日の月の元素・月相・主要アスペクトの調子を組み合わせ、出生図があれば、確定できる出生図の月星座と金星も加えて選びます。',
      },
      {
        q: '水星逆行などの惑星の逆行とは何ですか？',
        a: '逆行は地球から見て惑星が一時的に後ろへ進むように見える時期です。水星逆行は連絡や予定を見直す合図、金星逆行は関係を振り返る合図としてよく読まれます。',
      },
      {
        q: '月の満ち欠けはなぜ大切ですか？',
        a: '新月から満月へ満ちる流れは始めて育てる時期です。満月から欠ける流れは手放して整える時期です。月が今どこにあるかを知ると、一日のリズムを合わせやすくなります。',
      },
      {
        q: '今日の流れは毎日変わりますか？',
        a: 'はい。惑星と月は毎日動くので、今日の舞台とラッキーフード・カラーは深夜0時に更新されます。同じ日付と出生図なら、いつ見ても同じおすすめが表示されます。',
      },
    ],
    guardianReport: [
      {
        q: '無料の結果と有料レポートは何が違いますか。',
        a: '無料の結果は、二つの質問への回答とすでに作成した無料の出生チャートを読み、今の気持ち・星の手がかり・今日の一歩を示します。有料レポートはそこに16〜20問の回答を加え、自己理解・愛・仕事・決断の四つのテーマの詳しい本文と4枚の守護霊カード、テーマをつなぐ要約と行動の文まで仕上げます。',
      },
      {
        q: 'なぜ人によって質問が違うのですか。',
        a: '中心となる12問はすべての方に共通です。その後は、先の回答でさらに見る必要があるテーマだけが4〜8問続きます。そのため実際に受け取る質問は16問から20問の間になります。',
      },
      {
        q: '決済後に途中で離れても大丈夫ですか。',
        a: '回答は1問ずつ保存されます。同じブラウザなら戻って続きから回答でき、購入時のメールアドレスに再閲覧リンクを送って別の端末で続けることもできます。',
      },
      {
        q: 'ラブカードのレア度とは何ですか。',
        a: 'ラブカードにはオービット・ネビュラ・エクリプス・ステラの4段階のいずれかが割り当てられます。レア度が変えるのはカードの絵柄だけで、レポート本文の分量や内容は変わりません。自己理解・仕事・決断のカードにレア度はありません。',
      },
      {
        q: '気に入らない場合は返金されますか。',
        a: '完成したレポートを開く前ならいつでも全額返金を受けられます。個別質問に回答している途中や中断した状態も含みます。レポートを開いた後はデジタルコンテンツの性質上、契約解除が制限されます。詳しくは契約解除・返金ポリシーをご覧ください。',
      },
    ],
    love: [
      {
        q: '恋愛運はどう読みますか？',
        a: '金星と火星を中心に、あなたの愛し方や惹かれる相手を読みます。出生時刻が分かる場合はディセンダントと第7ハウスも加え、不明な場合は太陽の反対側を関係の基準点として使い、ハウス解釈は除外します。月は出生日を通じて同じ星座にとどまる場合だけ、心のきめに反映します。',
      },
      {
        q: '星座の相性も見られますか？',
        a: 'このページは二人を並べる相性占いではなく、あなた自身の出生図から、あなたに合う理想の相手の質感を読みます。まず自分を理解すると、どんな人と合うかも自然と見えてきます。',
      },
      {
        q: '金星と火星は恋愛とどう関係しますか？',
        a: '金星は何に惹かれどう愛情を示すか、火星は近づき方や情熱の温度を表します。二つの星の位置を読むと、あなたの恋愛スタイルがはっきりします。',
      },
      {
        q: '恋愛運の良い時期はどう決まりますか？',
        a: 'これから約1年、木星・土星が出生図の金星と作る主要アスペクトと、金星逆行の時期を調べます。出生時刻が分かる場合は、木星がディセンダントに重なる時期も加えます。5日間隔の探索結果を月単位の範囲で示すため、特定の日を断定する予測ではなく、大きな流れを振り返るための目安です。',
      },
    ],
  },

  zh: {
    heading: '常见问题',
    constellation: [
      {
        q: '什么是出生星盘（本命盘）？',
        a: '它是你出生那一刻太阳、月亮和行星在天空位置的地图。与只看太阳星座的普通占星不同，出生星盘还会解读月亮星座、上升星座和十二宫，更立体地呈现你。',
      },
      {
        q: '不知道出生时间也能看吗？',
        a: '太阳星座和大多数行星位置没有时间也能查看。我们会计算出生当天开始与结束时的月亮位置，显示月亮星座是否可以确定，或仍有两个可能。月亮的准确度数与相位、上升星座、宫位和盘型仅在出生时间明确时解读。',
      },
      {
        q: '太阳星座和出生星盘有什么区别？',
        a: '你常说的"某某座"只是太阳星座。出生星盘还加入月亮、水星、金星、火星等，看它们落在哪个星座和宫位，把性格描绘得更加丰富。',
      },
      {
        q: '免费吗？我输入的出生信息会如何处理？',
        a: '星黛洛的出生星盘无需注册即可免费查看。输入表单中的出生信息在浏览器内计算，不会直接提交到星黛洛的服务器。不过，选择链接分享时，重现结果所需的出生信息会包含在共享 URL 中，并传递给您选择的分享目标和收到链接的人。有关存储、删除与分享的详情，请参阅隐私政策。',
      },
    ],
    today: [
      {
        q: '今天的星座运势是怎么计算的？',
        a: '我们把今天运行的行星位置叠加到你的本命盘上解读流势。幸运食物与幸运色会综合今日月亮的元素、月相和主要相位氛围；有本命盘时，还会加入可确定的本命月亮星座与金星。',
      },
      {
        q: '水星逆行之类的行星逆行是什么意思？',
        a: '逆行是从地球看行星仿佛暂时后退的时期。水星逆行常被解读为提醒你再确认沟通与安排，金星逆行则提醒你重新审视关系。',
      },
      {
        q: '月相为什么重要？',
        a: '从新月到满月的盈满是开始与积累的时期。从满月到残月的亏缺是放下与整理的时期。知道月亮此刻在哪，更容易顺应一天的节奏。',
      },
      {
        q: '今天的流势每天都会变吗？',
        a: '会的，行星和月亮每天都在移动，今天的舞台、幸运食物和幸运色会在午夜更新。同一日期与同一本命盘始终会得到相同推荐。',
      },
    ],
    guardianReport: [
      {
        q: '免费结果与付费报告有什么区别？',
        a: '免费结果会结合两道心境问题与你已生成的免费出生星盘，呈现当下的心境、背后的星象线索与今天可以走的一步。付费报告在此基础上再加入 16~20 道答案，完成自我理解、爱情、工作、决断四个主题的详细正文、四张守护灵卡片，以及串联主题的总结与行动建议。',
      },
      {
        q: '为什么每个人的问题不一样？',
        a: '12 道核心问题对所有人相同。之后只有前面答案中仍需深入的主题会继续，追加 4~8 道。因此实际收到的问题总数在 16 到 20 之间。',
      },
      {
        q: '付款后中途离开可以吗？',
        a: '答案会逐题保存。在同一浏览器中可以返回继续作答，也可以让系统把重新开启链接发送到结算时填写的邮箱，在其他设备上继续。',
      },
      {
        q: '爱情卡片的稀有度是什么？',
        a: '爱情卡片会获得轨道、星云、蚀、星辰四个等级之一。稀有度只改变卡面画作，不改变报告正文的篇幅或内容。自我理解、工作与决断卡片没有稀有度。',
      },
      {
        q: '不满意可以退款吗？',
        a: '在打开已完成的报告之前可随时全额退款，包括正在作答个性化问题或中途停止的情况。打开报告后，因数字内容的性质，撤回权将受到限制，详情见《撤回与退款政策》。',
      },
    ],
    love: [
      {
        q: '恋爱运是怎么解读的？',
        a: '我们以金星与火星为中心，解读你爱的方式和会被谁吸引。出生时间明确时，会加入下降点与第七宫；时间未知时，则以太阳对面的点作为关系参考，并排除宫位解读。只有当月亮在整个出生日期内都停留在同一星座时，才会将它纳入内心特质解读。',
      },
      {
        q: '这里能看星座配对吗？',
        a: '这个页面不是把两个人放在一起比较的配对，而是用你自己的星盘，解读与你相配的理想伴侣的样子。先理解自己，就能自然看清和谁契合。',
      },
      {
        q: '金星和火星和恋爱有什么关系？',
        a: '金星显示你被什么吸引、如何表达爱意，火星显示你靠近的方式和热情的温度。读懂这两颗星，你的恋爱风格就清晰了。',
      },
      {
        q: '恋爱运好的时期怎么确定？',
        a: '我们会查看未来约一年内木星、土星与本命金星形成的主要相位，以及金星逆行期。出生时间明确时，还会加入木星合下降点的时期。系统每隔五天取样，并以月份范围呈现，因此这是用于参考大趋势的解读，而不是对某个具体日期的确定预测。',
      },
    ],
  },
} satisfies Record<Locale, FaqContent>
