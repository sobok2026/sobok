import type { Locale } from '@sobok/domain/locale'

export const REPORT_SLOTS = ['self', 'love', 'work', 'choice'] as const
export const RARITY_IDS = ['orbit', 'nebula', 'eclipse', 'stella'] as const

export type ReportSlot = (typeof REPORT_SLOTS)[number]
export type RarityId = (typeof RARITY_IDS)[number]

type QuestionContent = {
  id: 'movement' | 'tone'
  prompt: string
  options: { id: string; label: string }[]
}

export type CardReportContent = {
  meta: {
    title: string
    description: string
  }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    sampleLabel: string
    sampleValue: string
  }
  questions: QuestionContent[]
  pack: {
    eyebrow: string
    title: string
    body: string
    cta: string
    disabledHint: string
    prototypeOdds: string
  }
  reveal: {
    tap: string
    next: string
    readReport: string
    found: string
  }
  report: {
    eyebrow: string
    title: string
    intro: string
    progress: string
    complete: string
    summaryLabel: string
    reflectionLabel: string
  }
  rarity: Record<
    RarityId,
    {
      label: string
      subtitle: string
      description: string
    }
  >
  cards: Record<
    ReportSlot,
    {
      label: string
      title: string
      guardians: string
      summary: string
      body: string
      reflection: string
    }
  >
  actions: {
    collectionTitle: string
    collectionBody: string
    save: string
    saved: string
    share: string
    shareTitle: string
    shareText: string
    shareCopied: string
    shareFailed: string
    commentTitle: string
    commentBody: string
    commentCta: string
    returnEyebrow: string
    returnTitle: string
    returnBody: string
    returnCta: string
    reset: string
    prototypeNote: string
  }
}

export const CARD_REPORT_CONTENT = {
  ko: {
    meta: {
      title: '별자리 수호령 카드 리포트',
      description: '네 장의 별자리 수호령 카드를 열고 자기이해·사랑·일·결정에 관한 이야기를 읽어 보세요.',
    },
    hero: {
      eyebrow: 'STELLA GUARDIAN REPORT',
      title: '별이 건넨 네 장의 마음',
      subtitle: '짧은 답 두 개를 담아 지금의 당신에게 필요한 수호령 카드를 차례로 열어요.',
      sampleLabel: '프로토타입 차트',
      sampleValue: '양자리의 시작 · 달의 보호',
    },
    questions: [
      {
        id: 'tone',
        prompt: '지금 가장 듣고 싶은 답은?',
        options: [
          { id: 'comfort', label: '위로' },
          { id: 'honesty', label: '솔직함' },
          { id: 'action', label: '행동' },
          { id: 'possibility', label: '가능성' },
        ],
      },
      {
        id: 'movement',
        prompt: '지금 마음이 향하는 쪽은?',
        options: [
          { id: 'start', label: '시작' },
          { id: 'continue', label: '이어가기' },
          { id: 'recover', label: '회복' },
          { id: 'release', label: '놓아주기' },
        ],
      },
    ],
    pack: {
      eyebrow: '오늘의 봉인',
      title: '네 수호령이 기다리고 있어요',
      body: '자기이해·사랑·일·결정 카드가 한 장씩 들어 있어요. 사랑 카드에는 네 희귀도 중 하나가 찾아옵니다.',
      cta: '네 장 열기',
      disabledHint: '두 질문에 답하면 카드를 열 수 있어요.',
      prototypeOdds: '경험 검증용 추첨이라 네 희귀도를 같은 비율로 보여 줍니다.',
    },
    reveal: {
      tap: '카드를 눌러 뒤집어 보세요',
      next: '다음 카드',
      readReport: '리포트 읽기',
      found: '당신에게 온 카드',
    },
    report: {
      eyebrow: 'YOUR FOUR SIGNS',
      title: '지금의 당신을 잇는 이야기',
      intro:
        '네 장은 따로 떨어진 답이 아니에요. 마음을 지키는 방식이 사랑과 일 그리고 오늘의 선택까지 어떻게 이어지는지 천천히 읽어 보세요.',
      progress: '읽은 카드',
      complete: '네 장을 끝까지 읽었어요',
      summaryLabel: '카드가 건넨 말',
      reflectionLabel: '오늘 마음에 남길 한 문장',
    },
    rarity: {
      orbit: {
        label: 'Orbit',
        subtitle: '첫 궤도',
        description: '혼자 먼저 움직인 용기가 이야기의 시작을 만들었어요.',
      },
      nebula: {
        label: 'Nebula',
        subtitle: '마음을 지키는 성운',
        description: '날씨가 바뀌어도 지키고 싶은 마음이 더 선명해졌어요.',
      },
      eclipse: {
        label: 'Eclipse',
        subtitle: '마주 잡은 순간',
        description: '혼자 밀던 마음을 누군가 반대편에서 함께 잡아 주었어요.',
      },
      stella: {
        label: 'Stella',
        subtitle: '별이 된 결말',
        description: '열린 마음 위로 두 사람만의 별 지도가 완성됐어요.',
      },
    },
    cards: {
      self: {
        label: '자기이해',
        title: '마음이 쉬는 달집',
        guardians: '달콩이',
        summary: '당신은 안전하다고 느껴질 때 가장 깊은 마음을 꺼낼 수 있어요.',
        body: '조용히 숨는 시간은 회피가 아니라 감정을 알아보는 방식이에요. 밖으로 나가기 전에 내 표정을 충분히 바라볼수록, 다른 사람의 마음까지 떠안지 않고도 다정할 수 있어요.',
        reflection: '먼저 나를 편안하게 만드는 선택도 충분히 용감해요.',
      },
      love: {
        label: '사랑',
        title: '들어가지 않는 하트',
        guardians: '몽실이 · 달콩이',
        summary: '빠르게 건넨 진심도 상대가 잡을 자리를 남길 때 관계가 돼요.',
        body: '마음이 커질수록 혼자 끝까지 밀어 넣으려는 습관이 보여요. 이번에는 고백의 크기보다 상대가 다가올 여백을 믿어 보세요. 서툰 순간을 들켜도 관계는 망가지지 않아요.',
        reflection: '진심은 완벽하게 전달할 때보다 함께 들어 올릴 때 가벼워져요.',
      },
      work: {
        label: '일',
        title: '너무 높은 별탑',
        guardians: '차곡이 · 새봄이',
        summary: '꾸준함은 더 쌓는 힘만이 아니라 무너지기 전에 멈추는 감각이에요.',
        body: '이미 충분히 잘해 놓고도 마지막 하나를 더 올리고 싶어 해요. 완성도를 높이는 일과 불안을 달래기 위해 일을 늘리는 순간을 구분해 보세요. 누군가 받쳐 주는 도움도 결과의 일부예요.',
        reflection: '오늘의 완성은 하나를 더하는 대신 여기서 멈추는 것일 수 있어요.',
      },
      choice: {
        label: '결정',
        title: '먼저 반짝인 문',
        guardians: '고르미',
        summary: '모든 선택지를 같게 만들기보다 이미 반짝인 마음을 인정해도 괜찮아요.',
        body: '비교를 오래 할수록 선택은 정확해지지만 내 감각은 점점 작아져요. 충분히 살핀 뒤에도 한쪽 손잡이가 계속 눈에 들어온다면 그것 역시 중요한 근거예요.',
        reflection: '정답을 찾는 대신 내가 책임지고 싶은 쪽을 고르세요.',
      },
    },
    actions: {
      collectionTitle: '내 수호령 컬렉션',
      collectionBody: '이번에 찾아온 사랑 카드를 이 브라우저에 보관해 두세요.',
      save: '컬렉션에 담기',
      saved: '컬렉션에 담았어요',
      share: '결과 공유',
      shareTitle: '나의 별자리 수호령 카드',
      shareText: '내게 찾아온 별자리 수호령 카드를 확인해 보세요 ✦',
      shareCopied: '공유 링크를 복사했어요',
      shareFailed: '결과를 공유하지 못했어요',
      commentTitle: '같은 카드를 받은 마음들',
      commentBody: '당신은 먼저 다가가는 몽실이에 가까운가요, 기다리다 손을 내미는 달콩이에 가까운가요?',
      commentCta: '이 카드 이야기 나누기',
      returnEyebrow: 'TOMORROW',
      returnTitle: '내일의 동행자는 아직 잠들어 있어요',
      returnBody: '오늘의 흐름은 매일 달라져요. 내일 다시 와서 새로운 한 장을 만나 보세요.',
      returnCta: '오늘의 흐름 보기',
      reset: '프로토타입 다시 열기',
      prototypeNote: '결제·실제 판매 확률·알림은 연결하지 않은 경험 검증용 화면입니다.',
    },
  },
  en: {
    meta: {
      title: 'Zodiac Guardian Card Report',
      description: 'Open four zodiac guardian cards and read your story of self, love, work, and choice.',
    },
    hero: {
      eyebrow: 'STELLA GUARDIAN REPORT',
      title: 'Four feelings, sent by the stars',
      subtitle: 'Give us two tiny answers, then meet the guardians your heart needs right now.',
      sampleLabel: 'Prototype chart',
      sampleValue: 'Aries spark · lunar shelter',
    },
    questions: [
      {
        id: 'tone',
        prompt: 'What kind of answer do you need most?',
        options: [
          { id: 'comfort', label: 'Comfort' },
          { id: 'honesty', label: 'Honesty' },
          { id: 'action', label: 'Action' },
          { id: 'possibility', label: 'Possibility' },
        ],
      },
      {
        id: 'movement',
        prompt: 'Where is your heart trying to go?',
        options: [
          { id: 'start', label: 'Begin' },
          { id: 'continue', label: 'Continue' },
          { id: 'recover', label: 'Recover' },
          { id: 'release', label: 'Release' },
        ],
      },
    ],
    pack: {
      eyebrow: 'Today’s seal',
      title: 'Four guardians are waiting',
      body: 'One card each for self, love, work, and choice. Your love card arrives in one of four rarity scenes.',
      cta: 'Open four cards',
      disabledHint: 'Answer both questions to open the cards.',
      prototypeOdds: 'This experience prototype samples all four rarities equally.',
    },
    reveal: {
      tap: 'Tap the card to turn it over',
      next: 'Next card',
      readReport: 'Read my report',
      found: 'A card found you',
    },
    report: {
      eyebrow: 'YOUR FOUR SIGNS',
      title: 'The story connecting you right now',
      intro:
        'These are not four separate answers. Read slowly and notice how the way you protect your heart carries into love, work, and today’s choice.',
      progress: 'Cards read',
      complete: 'You reached the end of all four cards',
      summaryLabel: 'What this card says',
      reflectionLabel: 'A line to keep today',
    },
    rarity: {
      orbit: {
        label: 'Orbit',
        subtitle: 'The first orbit',
        description: 'A brave first move set the whole story in motion.',
      },
      nebula: {
        label: 'Nebula',
        subtitle: 'A feeling kept safe',
        description: 'The weather changed, but the feeling became clearer.',
      },
      eclipse: {
        label: 'Eclipse',
        subtitle: 'The moment hands meet',
        description: 'Someone reached from the other side and held what was too heavy alone.',
      },
      stella: {
        label: 'Stella',
        subtitle: 'An ending written in stars',
        description: 'An open heart became a sky map made for two.',
      },
    },
    cards: {
      self: {
        label: 'Self',
        title: 'The moonhouse where feelings rest',
        guardians: 'Moonlet',
        summary: 'Your deepest feelings come out when you know you are safe.',
        body: 'Quiet retreat is not avoidance; it is how you learn the shape of a feeling. Give yourself enough time to look inward, and you can stay kind without carrying everyone else’s heart.',
        reflection: 'Choosing what makes you feel safe can be an act of courage.',
      },
      love: {
        label: 'Love',
        title: 'The heart that would not fit',
        guardians: 'Pufflet & Moonlet',
        summary: 'A fast, honest feeling becomes a relationship when you leave room for another hand.',
        body: 'When your feelings grow, you try to push them all the way through alone. This time, trust the space where someone else can step closer. Being seen in an awkward moment will not ruin a real connection.',
        reflection: 'A feeling gets lighter when it is carried together, not delivered perfectly.',
      },
      work: {
        label: 'Work',
        title: 'The star tower built too high',
        guardians: 'Buttercup & Sprig',
        summary: 'Consistency also means knowing when to stop before good work topples over.',
        body: 'Even after doing enough, you want to add one last piece. Notice the difference between improving the work and adding work to soothe your doubt. Support from someone else still belongs in the final result.',
        reflection: 'Finishing today may mean stopping here instead of adding one more thing.',
      },
      choice: {
        label: 'Choice',
        title: 'The door that shone first',
        guardians: 'Tally',
        summary: 'You do not have to make every option equal before trusting the one that already glows.',
        body: 'More comparison can sharpen a decision while making your own instinct quieter. If one handle still catches your eye after you have looked carefully, that feeling is evidence too.',
        reflection: 'Choose the path you want to take responsibility for, not the perfect answer.',
      },
    },
    actions: {
      collectionTitle: 'My guardian collection',
      collectionBody: 'Keep the love card that found you on this browser.',
      save: 'Save to collection',
      saved: 'Saved to collection',
      share: 'Share result',
      shareTitle: 'My zodiac guardian card',
      shareText: 'See the zodiac guardian card that found me ✦',
      shareCopied: 'Share link copied',
      shareFailed: 'Could not share the result',
      commentTitle: 'Hearts that found the same card',
      commentBody: 'Are you more like Pufflet, who moves first, or Moonlet, who waits and then reaches out?',
      commentCta: 'Talk about this card',
      returnEyebrow: 'TOMORROW',
      returnTitle: 'Tomorrow’s companion is still asleep',
      returnBody: 'The sky changes every day. Come back tomorrow and meet a new card.',
      returnCta: 'See today’s sky',
      reset: 'Open the prototype again',
      prototypeNote: 'Payments, production odds, and reminders are not connected in this experience prototype.',
    },
  },
  ja: {
    meta: {
      title: '星座の守り子カードレポート',
      description: '4枚の星座の守り子カードをめくり、自分・恋・仕事・選択の物語を読んでみましょう。',
    },
    hero: {
      eyebrow: 'STELLA GUARDIAN REPORT',
      title: '星から届いた、4つの気持ち',
      subtitle: 'ふたつの短い答えを込めて、今のあなたに必要な守り子カードを順番に開きます。',
      sampleLabel: 'プロトタイプチャート',
      sampleValue: '牡羊座の始まり・月の守り',
    },
    questions: [
      {
        id: 'tone',
        prompt: '今、いちばん聞きたい答えは？',
        options: [
          { id: 'comfort', label: 'やすらぎ' },
          { id: 'honesty', label: '正直さ' },
          { id: 'action', label: '行動' },
          { id: 'possibility', label: '可能性' },
        ],
      },
      {
        id: 'movement',
        prompt: '今、心が向かっているのは？',
        options: [
          { id: 'start', label: '始める' },
          { id: 'continue', label: '続ける' },
          { id: 'recover', label: '整える' },
          { id: 'release', label: '手放す' },
        ],
      },
    ],
    pack: {
      eyebrow: '今日の封印',
      title: '4人の守り子が待っています',
      body: '自分・恋・仕事・選択のカードが1枚ずつ。恋のカードは4つのレアリティのどれかで現れます。',
      cta: '4枚を開く',
      disabledHint: 'ふたつの質問に答えると開けます。',
      prototypeOdds: '体験検証用のため、4レアリティを同じ割合で表示します。',
    },
    reveal: {
      tap: 'カードをタップしてめくってください',
      next: '次のカード',
      readReport: 'レポートを読む',
      found: 'あなたに届いたカード',
    },
    report: {
      eyebrow: 'YOUR FOUR SIGNS',
      title: '今のあなたをつなぐ物語',
      intro:
        '4枚は別々の答えではありません。心を守る方法が、恋や仕事、今日の選択へどうつながるのか、ゆっくり読んでみてください。',
      progress: '読んだカード',
      complete: '4枚を最後まで読みました',
      summaryLabel: 'カードからの言葉',
      reflectionLabel: '今日、心に残すひとこと',
    },
    rarity: {
      orbit: {
        label: 'Orbit',
        subtitle: 'はじまりの軌道',
        description: 'ひとりで踏み出した勇気が、物語を動かしました。',
      },
      nebula: {
        label: 'Nebula',
        subtitle: '気持ちを守る星雲',
        description: '空模様が変わっても、守りたい気持ちは鮮やかです。',
      },
      eclipse: {
        label: 'Eclipse',
        subtitle: '手が重なる瞬間',
        description: 'ひとりで押していた気持ちを、向こう側から支える手が現れました。',
      },
      stella: {
        label: 'Stella',
        subtitle: '星になった結末',
        description: '開いた心の上に、ふたりだけの星図が完成しました。',
      },
    },
    cards: {
      self: {
        label: '自分を知る',
        title: '心が休む月のおうち',
        guardians: 'つきみ',
        summary: '安心できたとき、あなたはいちばん深い気持ちを取り出せます。',
        body: '静かに隠れる時間は逃げではなく、気持ちの形を確かめる方法です。自分の表情を十分に見つめれば、誰かの心まで背負わずにやさしくいられます。',
        reflection: '自分が安心できるほうを選ぶことも、立派な勇気です。',
      },
      love: {
        label: '恋',
        title: '入らない大きなハート',
        guardians: 'ふわり・つきみ',
        summary: 'まっすぐな気持ちは、相手が手を添える余白を残すと関係になります。',
        body: '気持ちが大きくなるほど、ひとりで最後まで届けようとしてしまいます。今回は、相手が近づける余白を信じてみて。少し不器用な瞬間を見られても、本当のつながりは壊れません。',
        reflection: '気持ちは完璧に届けるより、いっしょに持つと軽くなります。',
      },
      work: {
        label: '仕事',
        title: '高く積みすぎた星の塔',
        guardians: 'こむぎ・こまめ',
        summary: '積み重ねる力には、崩れる前に止める感覚も含まれています。',
        body: 'もう十分なのに、最後のひとつを足したくなります。仕上げを良くする作業と、不安を静めるために作業を増やす瞬間を分けてみて。誰かの支えも成果の一部です。',
        reflection: '今日の完成は、もうひとつ足さずにここで止めることかもしれません。',
      },
      choice: {
        label: '選択',
        title: '最初に光った扉',
        guardians: 'はかりん',
        summary: 'すべてを同じ条件にしてからでなくても、先に光った心を信じて大丈夫です。',
        body: '比べるほど判断は正確になりますが、自分の感覚は小さくなります。十分に確かめても片方の取っ手が気になるなら、その感覚も大切な根拠です。',
        reflection: '正解ではなく、自分が引き受けたい道を選んでください。',
      },
    },
    actions: {
      collectionTitle: 'わたしの守り子コレクション',
      collectionBody: '今回届いた恋のカードを、このブラウザに残しておきましょう。',
      save: 'コレクションに入れる',
      saved: 'コレクションに入りました',
      share: '結果をシェア',
      shareTitle: 'わたしの星座の守り子カード',
      shareText: 'わたしに届いた星座の守り子カードを見てみて ✦',
      shareCopied: 'シェアリンクをコピーしました',
      shareFailed: '結果をシェアできませんでした',
      commentTitle: '同じカードが届いた心たち',
      commentBody: '先に動くふわりと、待ってから手を伸ばすつきみ。あなたはどちらに近いですか？',
      commentCta: 'このカードについて話す',
      returnEyebrow: 'TOMORROW',
      returnTitle: '明日の仲間は、まだ眠っています',
      returnBody: '空の流れは毎日変わります。明日また、新しい1枚に会いに来てください。',
      returnCta: '今日の流れを見る',
      reset: 'プロトタイプをもう一度開く',
      prototypeNote: '決済・実際の販売確率・通知は未接続の体験検証用画面です。',
    },
  },
  zh: {
    meta: {
      title: '星座守护灵卡牌报告',
      description: '翻开四张星座守护灵卡，读一读关于自我、爱情、工作与选择的故事。',
    },
    hero: {
      eyebrow: 'STELLA GUARDIAN REPORT',
      title: '星星送来的四份心意',
      subtitle: '留下两个简短答案，依次遇见此刻最适合你的守护灵卡牌。',
      sampleLabel: '原型星盘',
      sampleValue: '白羊座的开始 · 月亮的守护',
    },
    questions: [
      {
        id: 'tone',
        prompt: '此刻最想听见哪种回答？',
        options: [
          { id: 'comfort', label: '安慰' },
          { id: 'honesty', label: '坦诚' },
          { id: 'action', label: '行动' },
          { id: 'possibility', label: '可能' },
        ],
      },
      {
        id: 'movement',
        prompt: '此刻你的心正走向哪里？',
        options: [
          { id: 'start', label: '开始' },
          { id: 'continue', label: '继续' },
          { id: 'recover', label: '恢复' },
          { id: 'release', label: '放下' },
        ],
      },
    ],
    pack: {
      eyebrow: '今日封印',
      title: '四位守护灵正在等你',
      body: '自我、爱情、工作与选择各有一张。爱情卡会以四种稀有度之一出现。',
      cta: '翻开四张卡',
      disabledHint: '回答两个问题后即可开启。',
      prototypeOdds: '体验原型会以相同比例展示四种稀有度。',
    },
    reveal: {
      tap: '轻触卡牌，把它翻过来',
      next: '下一张卡',
      readReport: '阅读报告',
      found: '来到你身边的卡',
    },
    report: {
      eyebrow: 'YOUR FOUR SIGNS',
      title: '连接此刻你的故事',
      intro: '四张卡并不是四个分开的答案。慢慢读下去，看看你守护内心的方式，如何延伸到爱情、工作与今天的选择。',
      progress: '已读卡牌',
      complete: '四张卡都读完了',
      summaryLabel: '卡牌想说的话',
      reflectionLabel: '今天留在心里的一句话',
    },
    rarity: {
      orbit: {
        label: 'Orbit',
        subtitle: '最初的轨道',
        description: '独自迈出的勇气，让整个故事开始运转。',
      },
      nebula: {
        label: 'Nebula',
        subtitle: '守护心意的星云',
        description: '天气变了，想要守住的心意却更清晰了。',
      },
      eclipse: {
        label: 'Eclipse',
        subtitle: '双手相遇的瞬间',
        description: '有人从另一边伸手，接住了独自承担的重量。',
      },
      stella: {
        label: 'Stella',
        subtitle: '写进星光的结局',
        description: '打开的心，变成了一张只属于两个人的星图。',
      },
    },
    cards: {
      self: {
        label: '自我理解',
        title: '让心休息的月亮小屋',
        guardians: '月窝',
        summary: '感到安全时，你才能拿出内心最深处的感受。',
        body: '安静躲起来的时间不是逃避，而是辨认情绪形状的方法。先认真看看自己的表情，你就能保持温柔，而不必把所有人的心事都背在身上。',
        reflection: '先选择让自己安心的方向，也是一种勇敢。',
      },
      love: {
        label: '爱情',
        title: '装不进去的大爱心',
        guardians: '绵绵 · 月窝',
        summary: '坦率又迅速的真心，为另一只手留下位置时，才会成为关系。',
        body: '心意越大，你越想独自把它完整送到对方手里。这一次，请相信对方也会靠近。即使笨拙的瞬间被看见，真正的连接也不会因此坏掉。',
        reflection: '真心不必完美送达，两个人一起托住时会更轻。',
      },
      work: {
        label: '工作',
        title: '堆得太高的星星塔',
        guardians: '糯糯 · 苗苗',
        summary: '坚持不只是不停堆高，也包括在倒下之前停手。',
        body: '明明已经做得很好，你还是想再加最后一块。分清是在改善成果，还是用更多工作安抚不安。别人伸手托住的部分，也属于最终成果。',
        reflection: '今天的完成，也许是不再多加一块，就停在这里。',
      },
      choice: {
        label: '选择',
        title: '最先发亮的那扇门',
        guardians: '衡衡',
        summary: '不必让所有选项完全相等，也可以承认哪一边早已在发光。',
        body: '比较越久，判断越精确，自己的感受却会越来越小。认真看过之后，如果某个门把手仍然吸引你，那份感觉也是重要依据。',
        reflection: '别只寻找正确答案，选择你愿意负责的方向。',
      },
    },
    actions: {
      collectionTitle: '我的守护灵收藏',
      collectionBody: '把这次来到你身边的爱情卡保存在这个浏览器里。',
      save: '加入收藏',
      saved: '已加入收藏',
      share: '分享结果',
      shareTitle: '我的星座守护灵卡',
      shareText: '来看看来到我身边的星座守护灵卡 ✦',
      shareCopied: '分享链接已复制',
      shareFailed: '暂时无法分享结果',
      commentTitle: '抽到同一张卡的心情',
      commentBody: '你更像先迈步的绵绵，还是等待之后才伸出手的月窝？',
      commentCta: '聊聊这张卡',
      returnEyebrow: 'TOMORROW',
      returnTitle: '明天的同伴还在睡觉',
      returnBody: '天空每天都在变化。明天再来，遇见新的一张卡吧。',
      returnCta: '查看今天的星象',
      reset: '重新打开原型',
      prototypeNote: '这是体验验证页面，尚未连接支付、正式销售概率与提醒功能。',
    },
  },
} satisfies Record<Locale, CardReportContent>
