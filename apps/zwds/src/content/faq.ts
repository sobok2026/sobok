import type { Locale } from '@sobok/domain/locale'

// Evergreen, server-rendered FAQ copy. Kept as a plain module (like legal.ts)
// rather than next-intl messages so the answers stay crawlable prose and feed
// FAQPage structured data. ko is the canonical source.
export type FaqItem = { q: string; a: string }

type FaqContent = { heading: string; items: FaqItem[] }

export const FAQ = {
  ko: {
    heading: '자주 묻는 질문',
    items: [
      {
        q: '자미두수 명반이 무엇인가요?',
        a: '자미두수는 태어난 연·월·일·시로 자미성을 비롯한 별을 열두 궁에 배치해 삶의 영역을 읽는 동양의 별자리예요. 명반은 그 배치를 그린 지도로, 명궁을 중심으로 열두 궁에 놓인 주성과 사화를 함께 읽어 나의 성향과 운의 흐름을 보여 줘요.',
      },
      {
        q: '태어난 시각을 모르면 명반을 볼 수 없나요?',
        a: '태어난 시각은 열두 시진 가운데 하나를 정해 궁의 배치를 좌우하기 때문에 자미두수에서 특히 중요해요. 시각을 정확히 모르면 명반이 실제와 달라질 수 있으니, 아는 범위에서 가장 가까운 시각을 넣어 참고로 봐 주세요.',
      },
      {
        q: '진태양시 보정은 무엇인가요?',
        a: '우리가 쓰는 시계 시각은 표준시라서 실제 하늘의 태양 위치와 조금 어긋나요. 자미원은 출생지의 경도와 균시차를 반영한 진태양시로 시각을 자동 보정해, 시진 경계에 걸친 출생도 더 알맞은 궁에 배치해요.',
      },
      {
        q: '명궁·신궁·14주성·사화는 무엇인가요?',
        a: '명궁은 타고난 성정과 삶의 큰 줄기를 나타내는 중심 궁이고, 신궁은 후천의 노력과 몸을 나타내요. 14주성은 자미·천부를 비롯한 열네 개의 주요 별로 각 궁의 성격을 정하고, 사화(화록·화권·화과·화기)는 그 별에 힘을 더하거나 덜어 운의 방향을 그려요.',
      },
      {
        q: '무료인가요? 입력한 출생 정보는 어떻게 처리되나요?',
        a: '자미원의 명반은 회원가입 없이 무료로 볼 수 있어요. 입력한 출생 정보는 이용자의 브라우저 안에서 계산되고 자미원 서버에 저장되지 않아요. 다만 링크 공유를 선택하면 명반 재현에 필요한 출생 정보가 공유 URL에 포함되어 링크를 받은 사람에게 전달돼요. 자세한 내용은 개인정보처리방침에서 확인할 수 있어요.',
      },
      {
        q: '자미두수와 서양 별자리는 뭐가 다른가요?',
        a: '서양 별자리가 태어난 순간 황도에 놓인 태양·달·행성의 자리를 읽는다면, 자미두수는 연·월·일·시를 간지로 바꿔 별을 열두 궁에 배치하고 삶의 영역별 흐름을 읽어요. 같은 하늘을 다른 언어로 읽는 셈이라 둘을 함께 보면 나를 더 입체적으로 이해할 수 있어요.',
      },
    ],
  },

  en: {
    heading: 'Frequently asked questions',
    items: [
      {
        q: 'What is a Zi Wei Dou Shu chart?',
        a: 'Zi Wei Dou Shu is an Eastern form of astrology that places the Purple Star and other stars across twelve palaces using the year, month, day, and hour of your birth. The chart is a map of that arrangement: centered on the Life Palace, it reads the major stars and four transformations in each palace to show your character and the flow of your fortune.',
      },
      {
        q: 'Can I read my chart without my birth time?',
        a: 'Birth time matters especially in Zi Wei Dou Shu, because it selects one of the twelve two-hour periods that decide how the palaces are arranged. If you are unsure of the exact time, the chart may differ from reality, so enter the closest time you know and treat it as a reference.',
      },
      {
        q: 'What is true solar time correction?',
        a: 'The clock time we use is standard time, so it drifts slightly from the Sun’s actual position in the sky. Ziwei automatically corrects your time to true solar time using your birthplace’s longitude and the equation of time, placing births near a period boundary in the more fitting palace.',
      },
      {
        q: 'What are the Life Palace, Body Palace, 14 major stars, and four transformations?',
        a: 'The Life Palace is the central palace for your innate nature and the main thread of your life; the Body Palace reflects acquired effort and the body. The 14 major stars — Zi Wei, Tian Fu, and others — set the character of each palace, and the four transformations (Lu, Quan, Ke, Ji) add or subtract force from those stars to trace the direction of your fortune.',
      },
      {
        q: 'Is it free, and how is my birth data handled?',
        a: 'Ziwei’s chart is free with no sign-up. The birth details you enter are calculated in your browser and are not saved to Ziwei’s server. If you choose link sharing, however, the birth details needed to reproduce the chart are included in the shared URL and delivered to anyone who receives the link. See the Privacy Policy for details.',
      },
      {
        q: 'How is Zi Wei Dou Shu different from Western astrology?',
        a: 'Where Western astrology reads where the Sun, Moon, and planets sat on the ecliptic the moment you were born, Zi Wei Dou Shu converts your year, month, day, and hour into the sexagenary cycle to place stars across twelve palaces and read the flow of each area of life. They read the same sky in different languages, so seeing both gives you a fuller picture of yourself.',
      },
    ],
  },

  ja: {
    heading: 'よくある質問',
    items: [
      {
        q: '紫微斗数の命盤とは何ですか？',
        a: '紫微斗数は、生まれた年・月・日・時をもとに紫微星をはじめとする星を十二宮に配置し、人生の領域を読み解く東洋の星占いです。命盤はその配置を描いた地図で、命宮を中心に十二宮に置かれた主星と四化を併せて読み、あなたの性質と運の流れを映します。',
      },
      {
        q: '生まれた時刻がわからなくても見られますか？',
        a: '生まれた時刻は十二の時辰のうちひとつを定め、宮の配置を左右するため、紫微斗数では特に重要です。正確な時刻がわからない場合は命盤が実際と異なることがあるので、分かる範囲でもっとも近い時刻を入力し、参考としてご覧ください。',
      },
      {
        q: '真太陽時の補正とは何ですか？',
        a: '私たちが使う時計の時刻は標準時のため、実際の空の太陽の位置と少しずれます。紫微垣は出生地の経度と均時差を反映した真太陽時に自動で補正し、時辰の境目にかかる出生も、より適した宮に配置します。',
      },
      {
        q: '命宮・身宮・十四主星・四化とは何ですか？',
        a: '命宮は生まれ持った性質と人生の大きな筋を表す中心の宮で、身宮は後天の努力と身体を表します。十四主星は紫微・天府などの十四の主要な星で各宮の性格を定め、四化（化禄・化権・化科・化忌）はその星に力を加えたり削いだりして運の方向を描きます。',
      },
      {
        q: '無料ですか？入力した出生情報はどのように扱われますか？',
        a: '紫微垣の命盤は登録不要で無料です。入力した出生情報は利用者のブラウザ内で計算され、紫微垣のサーバーには保存されません。ただしリンク共有を選ぶと、命盤の再現に必要な出生情報が共有URLに含まれ、リンクを受け取った人へ渡ります。詳しくはプライバシーポリシーをご覧ください。',
      },
      {
        q: '紫微斗数と西洋占星術（星座）はどう違いますか？',
        a: '西洋占星術が生まれた瞬間の黄道上の太陽・月・惑星の位置を読むのに対し、紫微斗数は年・月・日・時を干支に変換して星を十二宮に配置し、人生の領域ごとの流れを読みます。同じ空を別の言葉で読むようなもので、両方を見るとあなたをより立体的に理解できます。',
      },
    ],
  },

  zh: {
    heading: '常见问题',
    items: [
      {
        q: '什么是紫微斗数命盘？',
        a: '紫微斗数是一种东方占星术，根据出生的年、月、日、时把紫微星等星曜排布在十二宫中，解读人生的各个领域。命盘就是描绘这一排布的地图：以命宫为中心，结合十二宫中的主星与四化，呈现你的性格与运势走向。',
      },
      {
        q: '不知道出生时间也能看吗？',
        a: '出生时间在紫微斗数中尤为重要，因为它决定十二时辰中的哪一个，从而左右宫位的排布。若不确定准确时间，命盘可能与实际有出入，请在已知范围内填入最接近的时间，并作为参考查看。',
      },
      {
        q: '什么是真太阳时校正？',
        a: '我们使用的钟表时间是标准时，与天空中太阳的实际位置会有些许偏差。紫微垣会根据出生地的经度与均时差，自动将时间校正为真太阳时，让处于时辰交界的出生也能落在更合适的宫位。',
      },
      {
        q: '命宫、身宫、十四主星、四化是什么？',
        a: '命宫是代表先天性情与人生主线的中心宫位，身宫则代表后天的努力与身体。十四主星是紫微、天府等十四颗主要星曜，决定各宫的性格；四化（化禄、化权、化科、化忌）为这些星曜增添或削减力量，勾勒运势的方向。',
      },
      {
        q: '免费吗？我输入的出生信息会如何处理？',
        a: '紫微垣的命盘无需注册即可免费查看。输入的出生信息在浏览器内计算，不会保存到紫微垣的服务器。不过，选择链接分享时，重现命盘所需的出生信息会包含在共享 URL 中，并传递给收到链接的人。详情请参阅隐私政策。',
      },
      {
        q: '紫微斗数和西方占星（星座）有什么区别？',
        a: '西方占星解读你出生瞬间太阳、月亮和行星在黄道上的位置，紫微斗数则把年、月、日、时换算为干支，将星曜排入十二宫，解读人生各领域的走向。两者以不同的语言解读同一片天空，一起看会让你更立体地了解自己。',
      },
    ],
  },
} satisfies Record<Locale, FaqContent>
