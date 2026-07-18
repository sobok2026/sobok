import type { GyeolContent } from '../_lib/types'

export const rarityContent = {
  axes: {
    affection: {
      description: '愛情が相手に届き、安心として確認される形',
      label: '愛情温度',
    },
    balance: {
      description: '似ている部分と違う部分を関係の中で合わせる力',
      label: '関係バランス',
    },
    recovery: {
      description: '寂しさやすれ違いのあと、また近づく力',
      label: '回復力',
    },
    tempo: {
      description: 'それぞれの日常の速度を一緒に合わせる感覚',
      label: '生活テンポ',
    },
  },
  grades: {
    1: {
      description:
        'vibeモデルでは、四つの軸がすべてはっきり噛み合っている組み合わせです。ふたりだけの基準が強く、一緒にいる時の関係の結がくっきり見えます。',
      label: '1等級',
      mountainLabel: '鮮明な結',
    },
    2: {
      description:
        '愛情、テンポ、バランス、回復のうち複数の軸が安定して支えている組み合わせです。お互いがどんな形で楽になるのか、かなり分かっています。',
      label: '2等級',
      mountainLabel: 'しっかりした結',
    },
    3: {
      description:
        '一つか二つの軸で個性がはっきり見える組み合わせです。似ている部分と違う部分がほどよく混ざり、ふたりだけの形ができています。',
      label: '3等級',
      mountainLabel: '個性ある結',
    },
    4: {
      description:
        '大きく目立つより、バランスがよい組み合わせです。お互いの速度や表し方を合わせながら、心地よい土台を作っているところに近いです。',
      label: '4等級',
      mountainLabel: 'バランスのよい結',
    },
    5: {
      description:
        '多くのカップルが共感しやすい心地よい組み合わせです。特別な方法より、日常で繰り返される安定感が関係を支えています。',
      label: '5等級',
      mountainLabel: '心地よい結',
    },
    6: {
      description:
        'まだ合わせていける余白がある組み合わせです。お互いにうまく通じる形と、少しずれる形を一緒に知っていく段階です。',
      label: '6等級',
      mountainLabel: '合わせていく結',
    },
    7: {
      description:
        '今は結がはっきりしているというより、探索の色が強い組み合わせです。小さな基準から無理なく合わせていくと、ふたりだけの形が少しずつ見えてきます。',
      label: '7等級',
      mountainLabel: '新しく作る結',
    },
  },
  metadata: {
    description: '16問で愛情温度、生活テンポ、関係バランス、回復力を見る非臨床のカップル傾向テストです。',
    title: 'カップル結指数テスト',
  },
  questions: [
    {
      id: 'duration',
      options: [
        { id: 'duration-new', label: 'まだお互いの基準を慎重に合わせている途中' },
        { id: 'duration-seasonal', label: 'いくつかの季節を過ごして自然な決まりができた' },
        { id: 'duration-long', label: '長く積み重なった場面や基準がかなり多い' },
      ],
      question: 'お互いの生活基準を合わせる形は？',
    },
    {
      id: 'frequency',
      options: [
        { id: 'frequency-daily', label: '毎日小さな接点があると安心する' },
        { id: 'frequency-steady', label: 'それぞれの時間を守っても流れは揺れにくい' },
        { id: 'frequency-event', label: '普段はそれぞれで、重要な瞬間にぐっと近づく' },
      ],
      question: '一緒に過ごす日常の密度は？',
    },
    {
      id: 'replyRhythm',
      options: [
        { id: 'reply-fast', label: '思いついたらすぐ決めて動くほう' },
        { id: 'reply-slow', label: '十分に見てから安定して合わせるほう' },
        { id: 'reply-asymmetric', label: '片方が先に引っ張り、片方が深く受け止めるほう' },
      ],
      question: '約束や予定を決める時のふたりのテンポは？',
    },
    {
      id: 'planning',
      options: [
        { id: 'plans-flexible', label: '即興と計画を状況に合わせて混ぜるほう' },
        { id: 'plans-planned', label: '予定とコンディションを先に合わせると楽' },
        { id: 'plans-drifting', label: 'その時々で流れていき、時々すれ違う' },
      ],
      question: 'デートや休みの日の決め方は？',
    },
    {
      id: 'changeResponse',
      options: [
        { id: 'change-fast', label: '変化が起きるとすぐ方向を変える' },
        { id: 'change-cautious', label: '少し様子を見てからゆっくり変えるほう' },
        { id: 'change-role-split', label: '片方が動き、片方が整えながら合わせる' },
      ],
      question: '急に予定が変わるとふたりは？',
    },
    {
      id: 'expression',
      options: [
        { id: 'expression-direct', label: '好きな時は比較的はっきり表す' },
        { id: 'expression-subtle', label: '雰囲気、行動、タイミングで先に見せる' },
        { id: 'expression-mixed', label: '直接表現とふたりだけのサインを混ぜるほう' },
      ],
      question: '愛情を感じ、見せる形は？',
    },
    {
      id: 'reassurance',
      options: [
        { id: 'reassurance-clear', label: '必要な言葉ははっきり言ってもらうと安定する' },
        { id: 'reassurance-subtle', label: '小さな行動や雰囲気でも十分に感じられる' },
        { id: 'reassurance-awkward', label: '気持ちはあるのに表すタイミングを逃すことがある' },
      ],
      question: '確認が必要な時に一番通じる形は？',
    },
    {
      id: 'support',
      options: [
        { id: 'support-listen', label: '最後まで聞き、気持ちを拾ってくれると力が出る' },
        { id: 'support-practical', label: '役に立つ行動をすぐしてくれると心強い' },
        { id: 'support-light', label: '軽い冗談や切り替えで息がしやすくなる' },
      ],
      question: 'つらい日にお互いへ一番必要な反応は？',
    },
    {
      id: 'repair',
      options: [
        { id: 'repair-fast', label: '早く確認すると安心する' },
        { id: 'repair-cooldown', label: '少し冷ましてから落ち着いて合わせ直す' },
        { id: 'repair-comeback', label: '少し離れても結局また近づく力がある' },
      ],
      question: '寂しさやすれ違いが生まれたら、どう戻りますか？',
    },
    {
      id: 'apology',
      options: [
        { id: 'apology-fast', label: '短くても早く謝るとほどける' },
        { id: 'apology-action', label: '言葉より変わった行動が見えると信じられる' },
        { id: 'apology-miss', label: 'タイミングを逃して後でぎこちなくなることがある' },
      ],
      question: '申し訳なさを扱う形は？',
    },
    {
      id: 'stress',
      options: [
        { id: 'stress-share', label: 'つらいことをお互いに比較的よく出せる' },
        { id: 'stress-quiet', label: 'それぞれ整理してから必要な分だけ分け合う' },
        { id: 'stress-bounce', label: '重くなる前に雰囲気を変えて流す' },
      ],
      question: 'ストレスが大きくなる時、ふたりの距離は？',
    },
    {
      id: 'privateSignals',
      options: [
        { id: 'signals-many', label: 'あだ名、ミーム、習慣のようなふたりだけのサインが多い' },
        { id: 'signals-some', label: '時々すぐ分かる冗談や表情がある' },
        { id: 'signals-few', label: '合言葉より、楽な日常感のほうが合う' },
      ],
      question: 'ふたりだけが知っている小さなサインはありますか？',
    },
    {
      id: 'memory',
      options: [
        { id: 'memory-exact', label: '転機になった瞬間をかなり正確に覚えている' },
        { id: 'memory-vibe', label: '日付より、その時の雰囲気と感情が長く残る' },
        { id: 'memory-now', label: '過ぎたことより、今の安定感がもっと大事' },
      ],
      question: '揺れたあとにまた近づいた瞬間は、どう残りますか？',
    },
    {
      id: 'balance',
      options: [
        { id: 'balance-similar', label: '好みと速度がだんだん似ていく感じ' },
        { id: 'balance-complementary', label: '違うからこそ足りないところを埋める感じ' },
        { id: 'balance-volatile', label: '良い時とずれる時の温度差が大きい感じ' },
      ],
      question: 'ふたりの関係バランスはどんな姿ですか？',
    },
    {
      id: 'decision',
      options: [
        { id: 'decision-together', label: '大事な選択は一緒に基準を合わせて決める' },
        { id: 'decision-alternate', label: '状況に応じて自然に交代で主導する' },
        { id: 'decision-one-sided', label: '片方が多く決め、もう片方は合わせるほう' },
      ],
      question: '大事な選択をする時のバランスは？',
    },
    {
      id: 'space',
      options: [
        { id: 'space-close', label: 'よく一緒にいるほど関係が楽になる' },
        { id: 'space-respecting', label: 'それぞれの時間も尊重されるともっと強くなる' },
        { id: 'space-uneven', label: '望む距離が違って調整が必要な時がある' },
      ],
      question: 'それぞれの時間を置く形は？',
    },
  ],
  results: {
    archive: {
      mission: '今日は長く覚えている場面をひとつ出してみましょう。その時よかった理由も短く添えるとさらにいいです。',
      nickname: '場面保管型',
      reasons: [
        '関係の大事な瞬間を長く持ち続ける力があります。',
        '過去の経験が今の安定感を支えています。',
        'ふたりだけの基準が時間の中でゆっくり積み重なっています。',
      ],
      summary:
        'ふたりの結は、過ぎた瞬間をそのまま流さないほうです。長く残った場面が積み重なるほど、ふたりの基準もさらに鮮明になります。',
    },
    harbor: {
      mission: '今日は結論を急がず、お互いに心地よかった形をひとつ先に分け合ってみましょう。',
      nickname: '安心停泊型',
      reasons: [
        '速い刺激より、戻ってこられる安心感が大きいです。',
        'それぞれの速度が違っても、関係は簡単には揺れません。',
        '違いを不安より役割として受け止めるほうです。',
      ],
      summary:
        'ふたりの結は、大きく揺れるより戻れる場所をよく作るほうです。ドラマチックな瞬間より、また心地よくなる形が強みです。',
    },
    orbit: {
      mission:
        '今日はよく繰り返す習慣をひとつ選んでみましょう。いつからふたりのものになったのか一緒に思い出すといいです。',
      nickname: '日常軌道型',
      reasons: [
        '小さな反復がふたりのリズムを作ります。',
        '大きなイベントより、日常の接点がよく生きます。',
        'だんだん似ていく習慣が安心のサインとして残ります。',
      ],
      summary:
        'ふたりの結は、毎日の小さな反復で近づくほうです。特別な一回より、繰り返し戻ってくる習慣が魅力の組み合わせです。',
    },
    rare: {
      mission: '今日はふたりだけが知っているサインひとつに、本当の気持ちを一行添えてみましょう。軽く、でもはっきりと。',
      nickname: '結が鮮明な固有型',
      reasons: [
        '四つの軸で強いサインが一緒に出ています。',
        '愛情、テンポ、バランス、回復が同じ方向に噛み合っています。',
        'よくあるカップルの型ひとつでは説明しにくい組み合わせです。',
      ],
      summary:
        'ふたりの結は、vibeモデル基準でかなり鮮明な組み合わせです。外からは普通の瞬間に見えても、ふたりの間ではすぐ通じる基準のように働きます。',
    },
    reconnect: {
      mission:
        '最近ずれてからまた近づいた瞬間を思い出してみましょう。その時助けになった行動を今日もう一度してみてもいいです。',
      nickname: '合わせ直す回復型',
      reasons: [
        '止まった流れをもう一度つなげる力が見えます。',
        '寂しさを長く放置するより、確認したり戻ったりするほうです。',
        '違う速度も回復の材料に変えられます。',
      ],
      summary:
        'ふたりの結は、いつも滑らかではなくても合わせ直す力があります。大事なのはずれそのものより、また近づく形です。',
    },
    signal: {
      mission:
        'ふたりだけがすぐ分かるサインをひとつ選んでみましょう。今日はその意味を少しだけ優しくほどいてあげてもいいです。',
      nickname: 'ふたりだけのサイン型',
      reasons: [
        '直接説明しなくても通じるサインが多いです。',
        '表情、行動、冗談が愛情のしるしとして働きます。',
        '外側では軽く見えても、内側の意味は濃いほうです。',
      ],
      summary:
        'ふたりの結は、外から見ると普通でも、お互いには鮮明なサインが多いです。ふたりだけの解釈が関係をよりしっかりさせます。',
    },
    spark: {
      mission: '急に浮かんだ気持ちをひとつ伝えてみましょう。ただし、相手が楽に受け取れる余白も一緒に残すといいです。',
      nickname: '瞬間点火型',
      reasons: [
        '思いついた瞬間に関係が生きる力があります。',
        '大きな計画より、小さな選択がふたりの間を動かします。',
        '今の感情と反応が関係の中心に近いです。',
      ],
      summary:
        'ふたりの結は、長く準備したイベントより瞬間の火種で生きます。軽い始まりが、思ったより長い場面につながる組み合わせです。',
    },
  },
  ui: {
    answeredCount: '{count}/{total} 回答',
    axisScoresTitle: '四つの結',
    backButton: '前へ',
    copyFallbackButton: 'リンクをコピー',
    copiedFeedback: '共有リンクをコピーしました。',
    emptyResultDescription: '共有リンクの形式が正しくありません。16問だけもう一度選ぶと新しい結果カードを作れます。',
    emptyResultTitle: '結果カードをもう一度作りますか？',
    gradeTitle: 'ふたりの結等級',
    heroCta: 'カップル結指数を見る',
    heroDescription: '16問で愛情温度、生活テンポ、関係バランス、回復力を軽く見てみましょう。',
    heroEyebrow: '16問、約2分でできます',
    heroSecondaryCta: '何を見る？',
    heroTitle: 'ふたりの結は何点？',
    indexLabel: 'カップル結指数',
    introNote: 'ログインなしですぐ始められます。',
    missionTitle: '今日試す小さなミッション',
    modelStepGradeBody: '選択の組み合わせをvibeモデル基準で読み、1等級から7等級までの位置を見せます。',
    modelStepGradeTitle: '等級確認',
    modelStepInputBody: '愛情温度、生活テンポ、関係バランス、回復力のように、すぐ選べる質問だけを使います。',
    modelStepInputTitle: '16問',
    modelStepShareBody: '点数、等級、ニックネーム、一言要約をまとめて、スクショして送りやすいカードにします。',
    modelStepShareTitle: '共有カード',
    modelNotice: '正解を当てる検査ではなく、回答の組み合わせをvibeモデル基準で読んだ結果です。',
    nextButton: '次の質問',
    questionEyebrow: '16問テスト',
    reasonsTitle: 'こう読まれた理由',
    resultButton: '結果を見る',
    resultEyebrow: 'ふたりの結カード',
    restartButton: 'もう一度',
    resultCardBody: '敏感な情報なしで、点数とニックネームだけを軽く見せられるようにまとめました。',
    resultCardTitle: 'すぐ送れる結果カード',
    shareButton: '結果リンクを送る',
    shareFallbackBody: '{grade} · {nickname} · 結指数 {index}',
    shareLead: 'vibeモデル基準',
    shareTitle: 'ふたりのカップル結指数カード',
  },
} as const satisfies GyeolContent
