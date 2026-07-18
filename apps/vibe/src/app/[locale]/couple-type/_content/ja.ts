import type {
  Axis,
  AxisDefinition,
  CoupleTypeCode,
  CoupleTypeContent,
  CoupleTypeQuestion,
  CoupleTypeResult,
} from '../_lib/types'

export const axisDefinitions = {
  bond: {
    label: 'つながり方',
    options: {
      D: {
        body: '本音、意味、長い会話で近づいていく流れ',
        label: '本音でつながる型',
      },
      P: {
        body: 'からかい、ミーム、冗談で先に空気を開く流れ',
        label: '遊びでつながる型',
      },
    },
    values: ['P', 'D'],
  },
  expression: {
    label: '表現の仕方',
    options: {
      N: {
        body: '言葉の間のニュアンスや小さなサインを大きく読む流れ',
        label: 'さりげない表現型',
      },
      O: {
        body: '好き嫌いを比較的はっきり言葉にする流れ',
        label: '直接表現型',
      },
    },
    values: ['O', 'N'],
  },
  pace: {
    label: '会話の速度',
    options: {
      H: {
        body: 'ゆっくり安心感を積み重ね、長く留まる流れ',
        label: '安定した港型',
      },
      S: {
        body: '思いついた瞬間に声をかけ、火種を生かす流れ',
        label: '即興の着火型',
      },
    },
    values: ['S', 'H'],
  },
  repair: {
    label: '回復のリズム',
    options: {
      L: {
        body: '感情を整理してから落ち着いて合わせ直す流れ',
        label: 'ゆっくり整理型',
      },
      Q: {
        body: '違和感が出たら早めに確認してまた近づく流れ',
        label: 'すぐ回復型',
      },
    },
    values: ['Q', 'L'],
  },
} as const satisfies Record<Axis, AxisDefinition>

export const coupleTypeQuestions = [
  {
    axis: 'pace',
    id: 'pace-start',
    options: [
      { label: '思い浮かんだらすぐメッセージを送り、流れを作る', value: 'S' },
      { label: '少しためておいて、話しやすいタイミングで続ける', value: 'H' },
    ],
    question: '二人の会話がいちばん自然に始まる瞬間は？',
  },
  {
    axis: 'expression',
    id: 'expression-like',
    options: [
      { label: '好きなら好きだと比較的はっきり言う', value: 'O' },
      { label: '言葉より先に雰囲気や行動で見せる', value: 'N' },
    ],
    question: '愛情表現は普段どちらに近いですか？',
  },
  {
    axis: 'repair',
    id: 'repair-conflict',
    options: [
      { label: '気になることは早めに確認してほどくと安心する', value: 'Q' },
      { label: 'まずそれぞれ冷ましてから、整理して話す', value: 'L' },
    ],
    question: '小さな誤解が起きたとき、二人の基本リズムは？',
  },
  {
    axis: 'bond',
    id: 'bond-mood',
    options: [
      { label: 'からかいや冗談で先に空気をやわらげる', value: 'P' },
      { label: '本音の言葉でお互いの気持ちを確認する', value: 'D' },
    ],
    question: '二人がまた近づくとき、いちばん通じる方法は？',
  },
  {
    axis: 'pace',
    id: 'pace-date',
    options: [
      { label: '急に決まっても楽しそうならすぐ動く', value: 'S' },
      { label: '予定とコンディションを合わせて安定的に決める', value: 'H' },
    ],
    question: 'デートの約束を決めるとき、二人の温度は？',
  },
  {
    axis: 'expression',
    id: 'expression-care',
    options: [
      { label: '必要なお願いや寂しさを言葉にして伝える', value: 'O' },
      { label: '相手が気づけるように小さなサインを残す', value: 'N' },
    ],
    question: '気づかいや配慮が必要なとき、主にどう伝えますか？',
  },
  {
    axis: 'repair',
    id: 'repair-silence',
    options: [
      { label: '沈黙が長くなる前に先に確認メッセージを送る', value: 'Q' },
      { label: '沈黙も整理の時間として置き、ゆっくりまた開く', value: 'L' },
    ],
    question: '返信が遅い日、二人は普段どう合わせていきますか？',
  },
  {
    axis: 'bond',
    id: 'bond-memory',
    options: [
      { label: '面白い写真、あだ名、ミームのような小さな暗号が多い', value: 'P' },
      { label: 'その日の感情や意味を長く覚えている', value: 'D' },
    ],
    question: '二人だけの思い出は、どんな材料で残ることが多いですか？',
  },
  {
    axis: 'pace',
    id: 'pace-night',
    options: [
      { label: '夜に急に会話が盛り上がることが多い', value: 'S' },
      { label: '一日のルーティンの中でこつこつ続く', value: 'H' },
    ],
    question: '会話が長くなる日の始まりは？',
  },
  {
    axis: 'expression',
    id: 'expression-check',
    options: [
      { label: 'はっきり言ってもらうほうが誤解が減ると感じる', value: 'O' },
      { label: '説明しすぎるより、文脈を見てほしい', value: 'N' },
    ],
    question: '気持ちを確認する方法で、より大切なのは？',
  },
  {
    axis: 'repair',
    id: 'repair-apology',
    options: [
      { label: '短くても先に謝って、会話の扉を開く', value: 'Q' },
      { label: 'なぜそうなったのか十分理解してからまた話す', value: 'L' },
    ],
    question: 'ごめんねを切り出すタイミングは？',
  },
  {
    axis: 'bond',
    id: 'bond-support',
    options: [
      { label: '軽い冗談で気分を変えてくれるのが効く', value: 'P' },
      { label: '静かに聞いて、本当の気持ちをすくってくれるのがいい', value: 'D' },
    ],
    question: '相手がつらい日、いちばん力になる反応は？',
  },
] as const satisfies readonly CoupleTypeQuestion[]

export const coupleTypeResults = {
  HNLD: {
    code: 'HNLD',
    dateMission: '二人が好きな静かな場所で、今日ありがたかった場面を一つずつ話してみてください。',
    displayCode: 'LOVE',
    strengths: [
      '急がなくても関係の温度が長く保たれます。',
      '言葉より態度と継続で信頼が積み重なります。',
      '大きな感情を安全にほどく余白があります。',
    ],
    summary:
      'お互いを急かさず、ゆっくり深まるカップルです。小さなサインを長く覚えていて、感情が整理されたあとに本音を出すとき、いちばん鮮明に近づきます。',
    title: 'ゆっくり温まる深い港型',
    watchOut: 'お互いに気を使って必要な言葉を長く先延ばしにすると、相手がヒントを見落とすことがあります。',
  },
  HNLP: {
    code: 'HNLP',
    dateMission: '今日の暗号のような冗談一つと、本当の気持ち一つを一緒に残してみてください。',
    displayCode: 'SLOW',
    strengths: [
      'さりげない冗談で気まずさをやわらかく溶かします。',
      '速度はゆっくりでも、二人だけのリズムはしっかりしています。',
      '衝突のあとも、空気をゆっくり戻す力があります。',
    ],
    summary:
      '慎重に近づきながらも、冗談の力をよく知るカップルです。言葉は少なくても二人だけのサインが多く、時間をかけて心地よい笑いで回復します。',
    title: '遅い冗談の秘密基地型',
    watchOut: '冗談が本音の代わりになる時間が長いと、大事な気持ちがぼやけることがあります。',
  },
  HNQD: {
    code: 'HNQD',
    dateMission: 'お互いにとって安心できた瞬間を一つ選び、その理由を一文で直接言ってみてください。',
    displayCode: 'DEEP',
    strengths: [
      '安定した流れの中でも、誤解を長く放置しません。',
      '相手の小さな表情や口調の変化をよく読み取ります。',
      '大事な瞬間には深い確認で関係を整えます。',
    ],
    summary:
      '普段は穏やかですが、必要な瞬間にはすぐ手を伸ばすカップルです。さりげないサインをよく感知し、心が揺れるときは本音で早く合わせ直します。',
    title: '穏やかなレーダー回復型',
    watchOut:
      '相手が気づいてくれるはず、という期待だけでは足りないことがあります。大事なことは短くても言葉で確認してみてください。',
  },
  HNQP: {
    code: 'HNQP',
    dateMission: '最近二人がよく使う言い回しや絵文字を選び、小さなあだ名をつけてみてください。',
    displayCode: 'BABE',
    strengths: [
      '心地よいルーティンの中で小さな楽しさを見つけます。',
      '違和感が積もる前に空気を変えます。',
      '二人だけのサインが多く、日常会話が軽やかに続きます。',
    ],
    summary:
      '安定した日常の上に、軽い遊び心をよく重ねるカップルです。大きな言葉より小さな反応で気持ちを読み、気まずさが出るとやわらかく先にほどきます。',
    title: '穏やかな遊び回復型',
    watchOut: '空気を明るくする力はありますが、必要な説明まで笑いで流さないほうがよさそうです。',
  },
  HOLD: {
    code: 'HOLD',
    dateMission: '次のデートの前に、それぞれ望んでいることを一つ先に言ってから会ってみてください。',
    displayCode: 'SOUL',
    strengths: [
      'お互いに必要な言葉を安定して届けます。',
      '感情を整理したあと、深い会話でまたつながります。',
      '関係のルールや約束を守ることで信頼が生まれます。',
    ],
    summary:
      'はっきりした表現と安定した速度をあわせ持つカップルです。すぐ結論を出すより十分に考え、大事な言葉は逃さず直接伝えます。',
    title: '落ち着いた約束設計型',
    watchOut: '整った言葉だけを待っていると、温かな即興性が足りなくなることがあります。',
  },
  HOLP: {
    code: 'HOLP',
    dateMission: '少しだけ寂しかったことを小さく言い、そのあと軽い散歩やおやつで空気を変えてみてください。',
    displayCode: 'VIBE',
    strengths: [
      '言葉ははっきりしていても、空気を重くしすぎません。',
      'ゆっくり整理した感情を冗談でやわらかくほどきます。',
      '関係の安定感と楽しい軽さが一緒にあります。',
    ],
    summary:
      '安定した流れの中で直接話し、軽やかに回復するカップルです。寂しさを隠しませんが、冗談と日常感でまた心地よく戻る力があります。',
    title: 'やさしいルームメイト愉快型',
    watchOut: '冗談まじりにほどいても、相手が本当に理解したかはもう一度確認するとよさそうです。',
  },
  HOQD: {
    code: 'HOQD',
    dateMission: '今日必要なことを一つだけすぐ言い、相手の答えを遮らず最後まで聞いてみてください。',
    displayCode: 'REAL',
    strengths: [
      '誤解を早く確認し、関係の揺れを減らします。',
      '直接的な表現のおかげで期待が比較的明確です。',
      '安定した愛情と深い会話のバランスがあります。',
    ],
    summary:
      '落ち着いているけれど、必要な言葉は先延ばしにしないカップルです。感情の火種を長く放置せず、お互いの気持ちを直接確認して安定感を取り戻します。',
    title: 'あたたかな軌道修正型',
    watchOut: '早く確認したい気持ちが相手には圧に感じられることもあるので、言葉の温度を調整してみてください。',
  },
  HOQP: {
    code: 'HOQP',
    dateMission: '今日の会話で一番笑った瞬間を、スクショではなく一文で再現してみてください。',
    displayCode: 'KISS',
    strengths: [
      '直接話しながらも空気を軽くできます。',
      '誤解が生まれると早くほどき、日常に戻れます。',
      '安定したルーティンの中に楽しい掛け合いが生きています。',
    ],
    summary:
      '心地よい基盤の上で、正直に楽しく続いていくカップルです。必要なことはすぐ言い、重くなりそうなときは冗談で空気を変える感覚があります。',
    title: '安定型掛け合い修理屋',
    watchOut: '早い収束がいつも十分な回復とは限りません。ときどき感情の後ろ側まで聞いてみてください。',
  },
  SNLD: {
    code: 'SNLD',
    dateMission: 'ふと浮かんだ気持ちを短く送り、あとで落ち着いて理由を添えてみてください。',
    displayCode: 'LUST',
    strengths: [
      '瞬間の感情と深い意味の両方を大切にします。',
      'さりげない表現の中に強い没入感があります。',
      '整理の時間が過ぎると、長く残る会話を作れます。',
    ],
    summary:
      '感情の火花は早く灯りますが、心を出す方法は繊細なカップルです。突然の引力と深い余韻が一緒にあり、二人だけの場面が濃く残ります。',
    title: '火花と余韻の物語型',
    watchOut: '強い感情をさりげないサインだけで残すと、相手が方向を迷うことがあります。',
  },
  SNLP: {
    code: 'SNLP',
    dateMission: '即興の短い約束や通話を入れて、最後に今日よかったことを一つだけ言ってみてください。',
    displayCode: 'KINK',
    strengths: [
      '瞬間的な楽しさを作り、長く覚えています。',
      '二人だけの暗号や冗談が関係を生き生きさせます。',
      '感情を整理したあと、また笑って回復できます。',
    ],
    summary:
      '即興の引力とさりげない冗談が混ざったカップルです。早く火がつきますが、内側の気持ちはゆっくり開き、時間が経ってからまた笑いながら近づきます。',
    title: 'きらめく秘密の冗談型',
    watchOut: '楽しい瞬間が多いほど、大事な感情も軽く流れないように受け止めてください。',
  },
  SNQD: {
    code: 'SNQD',
    dateMission: '今すぐ元気かどうか聞き、最後には相手が楽に答えられる余白を残してみてください。',
    displayCode: 'SEXY',
    strengths: [
      '感情の変化に素早く反応し、深く確認します。',
      '小さなサインを逃さないので、再接続が早いです。',
      '即興性と本音が一緒に動き、関係に生き生きした感覚があります。',
    ],
    summary:
      '瞬間のサインをよく拾い、早く本音でつながるカップルです。表現はさりげなくても感情の速度は速く、揺れが見えると深く確認しようとする力があります。',
    title: '繊細な火花レーダー型',
    watchOut: '相手の小さな変化に意味を乗せすぎず、直接確認する一文を添えるとよさそうです。',
  },
  SNQP: {
    code: 'SNQP',
    dateMission: '今日浮かんだ冗談を一つ送り、すぐ続けて本当の近況も聞いてみてください。',
    displayCode: 'FOOL',
    strengths: [
      '早い反応と冗談で会話がすぐ生き返ります。',
      '小さなサインを敏感に読み、空気を変えます。',
      '誤解が起きても軽やかにまた話しかけられます。',
    ],
    summary:
      'ひらめく冗談と繊細な感知が一緒にあるカップルです。即興でメッセージを送り、小さなニュアンスを読みながら空気を早くよみがえらせる感覚があります。',
    title: '稲妻のような冗談レーダー型',
    watchOut: '素早い反応が相手の速度より先に行くことがあります。一拍置くこともつながりの一部です。',
  },
  SOLD: {
    code: 'SOLD',
    dateMission: '即興デートを一つ提案し、その提案に込めた気持ちも一緒に言ってみてください。',
    displayCode: 'BURN',
    strengths: [
      '心が動いた瞬間を逃しません。',
      '正直な表現と深い会話が強くつながります。',
      '整理したあと、関係をさらに強くする言葉を言えます。',
    ],
    summary:
      '早く燃え上がりますが、心は深く残すカップルです。言いたいことを比較的直接出し、感情が大きくなったあとは真剣な会話で関係の意味を立て直します。',
    title: 'まっすぐ進む余韻設計型',
    watchOut: '即興の表現が強いほど、相手が追いつく時間を残すとさらに安定します。',
  },
  SOLP: {
    code: 'SOLP',
    dateMission: '冗談っぽく始まった話を一つ選び、最後に本当に望んでいることを軽く添えてみてください。',
    displayCode: 'WILD',
    strengths: [
      '正直さと愉快さが一緒にあり、息苦しさが少ないです。',
      '感情を整理したあとも、空気を重くしすぎません。',
      '即興の提案で関係に活気を作ります。',
    ],
    summary:
      '即興で近づき、正直に話しますが、回復はゆっくり笑いながらするカップルです。冗談と直接表現を行き来しながら、二人だけの活気を作ります。',
    title: '正直な即興コメディ型',
    watchOut: '笑わせるように言った本音が実はお願いだったなら、相手に届くようにもう一度はっきり言ってください。',
  },
  SOQD: {
    code: 'SOQD',
    dateMission: '今日すぐ、ありがたいこと一つと望んでいること一つを同じ温度で言ってみてください。',
    displayCode: 'FIRE',
    strengths: [
      'すぐ言ってすぐ確認するので、誤解が長く積もりません。',
      '本音をはっきり届け、関係の方向が見えやすいです。',
      '早い回復のあとにも意味のある会話を残します。',
    ],
    summary:
      '感情の速度と表現の明確さがどちらも速いカップルです。好きなら好きと言い、違和感があれば長く埋めず、本音でまた合わせ直す力があります。',
    title: '直進する火花回復型',
    watchOut: '早い正直さが鋭く聞こえないように、先に愛情の前提を置いてみるとよさそうです。',
  },
  SOQP: {
    code: 'SOQP',
    dateMission: '二人だけの短い合図を決めて、今日中に一度先に送ってみてください。',
    displayCode: 'FUXK',
    strengths: [
      '会話が止まってもすぐまた火をつけます。',
      '正直な言葉と冗談が混ざり、もどかしさが少ないです。',
      '小さな誤解を早くほどき、日常のリズムに戻ります。',
    ],
    summary:
      '思いついた瞬間に声をかけ、正直な表現と冗談で早く近づくカップルです。重くなる隙を長く残さず、二人だけの掛け合いでまたつながります。',
    title: '火花の掛け合い回復型',
    watchOut: '軽くほどける分、相手が本当に大丈夫になったかもう一度確認すると関係がより安定します。',
  },
} as const satisfies Record<CoupleTypeCode, CoupleTypeResult>

export const coupleTypeContent = {
  axisDefinitions,
  metadata: {
    description:
      '12の質問で、二人の会話の速度、表現の仕方、回復のリズム、つながり方を読む非臨床のカップル会話タイプテストです。',
    title: 'カップル会話タイプ',
  },
  questions: coupleTypeQuestions,
  results: coupleTypeResults,
  ui: {
    answeredCount: '{count}件回答',
    dateMissionTitle: '今日の会話ミッション',
    editButton: '回答を調整する',
    heroDescription:
      '12の軽い選択で、二人の会話の速度、表現の仕方、回復のリズム、つながり方を見てみましょう。人を決めつけず、今のパターンを読むテストです。',
    heroEyebrow: 'カップル会話タイプ16種',
    heroTitle: '二人の会話は、どんなリズムで近づきますか？',
    homeLink: 'ホームへ',
    navigationLabel: 'カップル会話タイプを探す',
    nextButton: '次の質問',
    previousButton: '前へ',
    privacyNotice: '回答数 {count}件 · 結果はサーバーに保存されず、再読み込みすると初期化されます。',
    questionCountLabel: '質問',
    questionCountValue: '{count}件',
    resultButton: '結果を見る',
    resultCountLabel: '結果',
    resultCountValue: '16タイプ',
    resultEyebrow: 'カップル会話タイプ結果',
    restartButton: 'もう一度',
    rhythmsTitle: '二人の四つのリズム',
    selectAnswerButton: '回答を選ぶ',
    strengthsTitle: '相性がよいところ',
    watchOutTitle: '気をつけたいこと',
  },
} as const satisfies CoupleTypeContent
