import { Locale } from '@sobok/domain/locale'

// Evergreen, server-rendered FAQ copy. Kept as a plain module (like legal.ts)
// rather than next-intl messages so the answers stay crawlable prose and feed
// FAQPage structured data. Written per tool page, ko is the canonical source.
export type FaqItem = { q: string; a: string }
export type FaqPageKey = 'constellation' | 'today' | 'love'

type FaqContent = { heading: string } & Record<FaqPageKey, FaqItem[]>

export const FAQ = {
  [Locale.KO]: {
    heading: '자주 묻는 질문',
    constellation: [
      {
        q: '탄생 별자리(네이탈 차트)가 무엇인가요?',
        a: '태어난 순간 하늘에 놓인 태양·달·행성의 위치를 그린 지도예요. 태양 별자리 하나만 보는 일반 별자리와 달리 달 별자리와 상승 별자리 그리고 열두 하우스까지 함께 읽어 나를 더 입체적으로 보여 줘요.',
      },
      {
        q: '태어난 시각을 모르면 별자리를 볼 수 없나요?',
        a: '태양 별자리와 대부분의 행성 배치는 시각 없이도 확인할 수 있어요. 다만 달 별자리와 상승 별자리는 시각에 따라 크게 바뀌어서 정확한 출생 시각을 넣으면 훨씬 또렷하게 읽혀요.',
      },
      {
        q: '태양 별자리랑 네이탈 차트는 뭐가 다른가요?',
        a: '흔히 아는 "무슨 자리"는 태양 별자리 하나예요. 네이탈 차트는 태양에 더해 달·수성·금성·화성처럼 여러 행성이 어느 자리와 하우스에 놓였는지까지 담아 성향을 훨씬 자세히 그려 줘요.',
      },
      {
        q: '무료인가요? 입력한 출생 정보는 안전한가요?',
        a: '별무리의 탄생 별자리는 회원가입 없이 무료로 볼 수 있어요. 생년월일과 시각은 브라우저 안에서만 계산되고 서버로 전송되지 않아서 안심하고 사용하셔도 돼요.',
      },
    ],
    today: [
      {
        q: '오늘의 별자리 운세는 어떻게 계산되나요?',
        a: '오늘 하늘을 지나는 행성의 위치를 내 탄생 별자리에 겹쳐 흐름을 읽어요. 행운 음식과 색상은 오늘 달의 원소·달의 위상·주요 각의 분위기를 조합하고, 차트가 있으면 태어난 날의 달과 금성까지 더해 골라요.',
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
    love: [
      {
        q: '연애운은 어떻게 읽나요?',
        a: '태어난 하늘의 금성과 화성 그리고 관계를 뜻하는 하우스를 살펴 내가 사랑하는 방식과 끌리는 상대를 읽어요. 여기에 앞으로 1년 사랑의 하늘이 지나는 시기까지 함께 그려 드려요.',
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
        a: '오늘의 하늘을 지나는 행성이 내 금성이나 관계 하우스를 지날 때를 사랑의 흐름이 열리는 시기로 봐요. 앞으로 1년 치를 미리 살펴 마음의 준비를 해 둘 수 있어요.',
      },
    ],
  },

  [Locale.EN]: {
    heading: 'Frequently asked questions',
    constellation: [
      {
        q: 'What is a birth chart (natal chart)?',
        a: 'It is a map of where the Sun, Moon, and planets sat in the sky the moment you were born. Unlike a single Sun sign, a birth chart also reads your Moon sign, Rising sign, and the twelve houses for a fuller picture of you.',
      },
      {
        q: 'Can I read my chart without my birth time?',
        a: 'Your Sun sign and most planet placements show up fine without a time. But your Moon and Rising signs shift quickly through the day, so an exact birth time makes them far more accurate.',
      },
      {
        q: 'How is a Sun sign different from a birth chart?',
        a: 'The sign you usually know is just your Sun sign. A birth chart adds the Moon, Mercury, Venus, Mars, and more — showing which sign and house each planet falls in for a much richer portrait.',
      },
      {
        q: 'Is it free, and is my birth data safe?',
        a: "Stella's birth chart is free with no sign-up. Your birth date and time are calculated inside your browser and never sent to a server, so your details stay with you.",
      },
    ],
    today: [
      {
        q: "How is today's horoscope calculated?",
        a: "We overlay the planets moving through today's sky onto your birth chart. Lucky food and color combine the Moon’s element, phase, and major aspect tone, then add your natal Moon and Venus when a chart is available.",
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
    love: [
      {
        q: 'How do you read my love life?',
        a: 'We look at Venus and Mars in your birth sky, plus the houses of relationship, to read how you love and who you are drawn to. We also map the seasons of love across the year ahead.',
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
        a: "When today's moving planets pass over your Venus or relationship houses, we read it as a season when love opens up. Seeing the year ahead lets you prepare your heart.",
      },
    ],
  },

  [Locale.JA]: {
    heading: 'よくある質問',
    constellation: [
      {
        q: '出生図（ネイタルチャート）とは何ですか？',
        a: '生まれた瞬間の空にあった太陽・月・惑星の位置を描いた地図です。太陽星座だけを見る一般的な占いと違い、月星座や上昇星座、十二のハウスまで読み、あなたをより立体的に映します。',
      },
      {
        q: '生まれた時刻がわからなくても見られますか？',
        a: '太陽星座やほとんどの惑星の配置は時刻がなくても確認できます。ただ月星座と上昇星座は一日の中で大きく変わるため、正確な出生時刻を入れるとぐっと鮮明になります。',
      },
      {
        q: '太陽星座と出生図はどう違いますか？',
        a: 'よく知る「〇〇座」は太陽星座ひとつです。出生図は太陽に加えて月・水星・金星・火星などがどの星座とハウスにあるかまで含め、性格をずっと詳しく描きます。',
      },
      {
        q: '無料ですか？入力した出生情報は安全ですか？',
        a: '星屑の出生図は登録不要で無料です。生年月日と時刻はブラウザの中だけで計算され、サーバーに送られないので安心してお使いいただけます。',
      },
    ],
    today: [
      {
        q: '今日の星座占いはどう計算されますか？',
        a: '今日の空を通る惑星の位置を出生図に重ねて流れを読みます。ラッキーフードとカラーは、今日の月の元素・月相・主要アスペクトの調子を組み合わせ、出生図があれば生まれた日の月と金星も加えて選びます。',
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
    love: [
      {
        q: '恋愛運はどう読みますか？',
        a: '生まれた空の金星と火星、そして関係を表すハウスを見て、あなたの愛し方や惹かれる相手を読みます。さらにこれから一年、愛の空が通る時期まで描きます。',
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
        a: '今日の空を通る惑星が、あなたの金星や関係のハウスを通るときを、愛の流れが開く時期と見ます。これから一年分を先に見て、心の準備ができます。',
      },
    ],
  },

  [Locale.ZH]: {
    heading: '常见问题',
    constellation: [
      {
        q: '什么是出生星盘（本命盘）？',
        a: '它是你出生那一刻太阳、月亮和行星在天空位置的地图。与只看太阳星座的普通占星不同，出生星盘还会解读月亮星座、上升星座和十二宫，更立体地呈现你。',
      },
      {
        q: '不知道出生时间也能看吗？',
        a: '太阳星座和大多数行星位置没有时间也能查看。不过月亮星座和上升星座在一天中变化很快，填入准确的出生时间会清晰得多。',
      },
      {
        q: '太阳星座和出生星盘有什么区别？',
        a: '你常说的"某某座"只是太阳星座。出生星盘还加入月亮、水星、金星、火星等，看它们落在哪个星座和宫位，把性格描绘得更加丰富。',
      },
      {
        q: '免费吗？我输入的出生信息安全吗？',
        a: '星黛洛的出生星盘无需注册即可免费查看。你的生日和时间只在浏览器内计算，不会上传到服务器，可以放心使用。',
      },
    ],
    today: [
      {
        q: '今天的星座运势是怎么计算的？',
        a: '我们把今天运行的行星位置叠加到你的本命盘上解读流势。幸运食物与幸运色会综合今日月亮的元素、月相和主要相位氛围；有本命盘时，还会加入你的本命月亮与金星。',
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
    love: [
      {
        q: '恋爱运是怎么解读的？',
        a: '我们查看你出生天空中的金星与火星，以及代表关系的宫位，解读你爱的方式和会被谁吸引。还会描绘未来一年爱的天空经过的时期。',
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
        a: '当今天经过天空的行星掠过你的金星或关系宫位时，我们视为爱的流势开启的时期。提前看未来一年，可以让心里有所准备。',
      },
    ],
  },
} satisfies Record<Locale, FaqContent>
