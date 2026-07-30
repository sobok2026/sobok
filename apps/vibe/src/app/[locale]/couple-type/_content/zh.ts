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
    label: '连接方式',
    options: {
      D: {
        body: '通过真心、意义和长谈慢慢靠近的节奏',
        label: '真心连接型',
      },
      P: {
        body: '先用玩笑、梗和调侃打开气氛的节奏',
        label: '玩笑连接型',
      },
    },
    values: ['P', 'D'],
  },
  expression: {
    label: '表达方式',
    options: {
      N: {
        body: '更会读取话语之间的细微语气和小信号',
        label: '含蓄表达型',
      },
      O: {
        body: '比较清楚地把喜欢和不喜欢说出来',
        label: '直接表达型',
      },
    },
    values: ['O', 'N'],
  },
  pace: {
    label: '聊天速度',
    options: {
      H: {
        body: '慢慢积累安全感，并在稳定里停留',
        label: '稳定停泊型',
      },
      S: {
        body: '一想到就马上开口，让火花延续',
        label: '即兴点火型',
      },
    },
    values: ['S', 'H'],
  },
  repair: {
    label: '修复节奏',
    options: {
      L: {
        body: '先整理情绪，再平静地重新对齐',
        label: '慢慢整理型',
      },
      Q: {
        body: '一有不舒服就尽快确认，然后重新靠近',
        label: '快速修复型',
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
      { label: '想到对方就马上发消息，把聊天带起来', value: 'S' },
      { label: '先攒一点想法—话题，等舒服的时机再接上', value: 'H' },
    ],
    question: '你们之间的聊天最自然开始的时刻是？',
  },
  {
    axis: 'expression',
    id: 'expression-like',
    options: [
      { label: '喜欢就会比较明确地说喜欢', value: 'O' },
      { label: '比起语言，会先用氛围和行动表现出来', value: 'N' },
    ],
    question: '你们的爱意表达通常更接近哪一种？',
  },
  {
    axis: 'repair',
    id: 'repair-conflict',
    options: [
      { label: '不舒服的地方要尽快确认和解开才安心', value: 'Q' },
      { label: '先各自冷静，再整理好后再说', value: 'L' },
    ],
    question: '出现小误会时，你们的基本节奏是？',
  },
  {
    axis: 'bond',
    id: 'bond-mood',
    options: [
      { label: '先用调侃和玩笑把气氛放软', value: 'P' },
      { label: '用真心的话确认彼此的心意', value: 'D' },
    ],
    question: '你们重新靠近时，最有效的方式是？',
  },
  {
    axis: 'pace',
    id: 'pace-date',
    options: [
      { label: '就算突然决定，只要有趣就立刻行动', value: 'S' },
      { label: '会配合日程和状态，稳定地安排', value: 'H' },
    ],
    question: '约会安排时，你们的温度是？',
  },
  {
    axis: 'expression',
    id: 'expression-care',
    options: [
      { label: '需要的请求或委屈，会用话说出来', value: 'O' },
      { label: '会留下小信号，让对方可以察觉', value: 'N' },
    ],
    question: '需要被照顾时，你们通常怎么表达？',
  },
  {
    axis: 'repair',
    id: 'repair-silence',
    options: [
      { label: '沉默变长之前，会先发消息确认一下', value: 'Q' },
      { label: '也把沉默当作整理时间，慢慢再打开', value: 'L' },
    ],
    question: '回复变慢的日子里，你们通常怎么调整？',
  },
  {
    axis: 'bond',
    id: 'bond-memory',
    options: [
      { label: '有很多搞笑照片、昵称、梗之类的小暗号', value: 'P' },
      { label: '会长久记得那天的情绪和意义', value: 'D' },
    ],
    question: '你们两个人的回忆更多由什么组成？',
  },
  {
    axis: 'pace',
    id: 'pace-night',
    options: [
      { label: '晚上常常突然聊到停不下来', value: 'S' },
      { label: '更常在一天的固定节奏里持续连接', value: 'H' },
    ],
    question: '聊天变长的那一天，通常从哪里开始？',
  },
  {
    axis: 'expression',
    id: 'expression-check',
    options: [
      { label: '说清楚才会减少误会', value: 'O' },
      { label: '比起解释太多，更希望对方看见上下文', value: 'N' },
    ],
    question: '确认心意的方式里，更重要的是？',
  },
  {
    axis: 'repair',
    id: 'repair-apology',
    options: [
      { label: '哪怕很短，也会先道歉打开对话', value: 'Q' },
      { label: '充分理解为什么会这样之后再说', value: 'L' },
    ],
    question: '说对不起的时机通常是？',
  },
  {
    axis: 'bond',
    id: 'bond-support',
    options: [
      { label: '轻松的玩笑能很好地帮对方转换心情', value: 'P' },
      { label: '安静倾听，并说中真正的感受最有力量', value: 'D' },
    ],
    question: '对方辛苦的日子里，什么反应最能给力量？',
  },
] as const satisfies readonly CoupleTypeQuestion[]

export const coupleTypeResults = {
  HNLD: {
    code: 'HNLD',
    dateMission: '在你们都喜欢的安静地方，各自说一个今天感谢对方的瞬间。',
    displayCode: 'LOVE',
    strengths: [
      '即使不着急，关系的温度也能维持很久。',
      '比起语言，更通过态度和稳定积累信任。',
      '有空间安全地承接比较大的情绪。',
    ],
    summary: '你们是不催促彼此、慢慢变深的伴侣。会长久记得小信号，等情绪整理好后拿出真心时，彼此最清楚地靠近。',
    title: '慢慢升温的深港型',
    watchOut: '如果因为体贴而把必要的话拖太久，对方可能会错过你的提示。',
  },
  HNLP: {
    code: 'HNLP',
    dateMission: '留下一个今天像暗号一样的玩笑，再配上一个真实心情。',
    displayCode: 'SLOW',
    strengths: [
      '含蓄的玩笑能温柔地化开尴尬。',
      '速度慢一点，但你们自己的节奏很稳。',
      '冲突之后，也有慢慢把气氛带回来的力量。',
    ],
    summary: '你们靠近得谨慎，但很懂玩笑的力量。话不多也有许多只有两个人懂的信号，时间过去后能用舒服的笑声恢复亲近。',
    title: '慢玩笑的秘密基地型',
    watchOut: '如果玩笑太久地代替真心，重要的心意可能会变得模糊。',
  },
  HNQD: {
    code: 'HNQD',
    dateMission: '各自选一个让自己舒服的瞬间，并用一句直接的话说出理由。',
    displayCode: 'DEEP',
    strengths: [
      '即使在稳定的节奏里，也不会把误会放太久。',
      '很会读取对方细小的表情和语气变化。',
      '重要时刻会用深度确认把关系重新稳住。',
    ],
    summary: '你们平时很平静，但需要的时候会马上伸手。能敏锐捕捉含蓄信号，心意动摇时会用真心快速重新对齐。',
    title: '平静雷达修复型',
    watchOut: '只期待对方会察觉可能还不够。重要的事情可以哪怕短短一句，也用语言确认。',
  },
  HNQP: {
    code: 'HNQP',
    dateMission: '选一个最近你们常用的语气或表情，给它取一个小昵称。',
    displayCode: 'BABE',
    strengths: [
      '会在舒服的日常里找到小小的乐趣。',
      '不舒服积累起来之前，就能转换气氛。',
      '有很多两个人的信号，让日常对话轻松延续。',
    ],
    summary: '你们会在稳定日常上常常放一点轻盈玩笑。比起大段语言，更通过小反应读心意；尴尬出现时，也会先温柔地化开。',
    title: '平稳玩笑修复型',
    watchOut: '你们很会活跃气氛，但必要的说明不要也一起用笑声带过。',
  },
  HOLD: {
    code: 'HOLD',
    dateMission: '下次约会前，各自先说一个期待的事情再见面。',
    displayCode: 'SOUL',
    strengths: [
      '能稳定地把彼此需要的话传达出来。',
      '整理情绪后，会通过深入对话重新连接。',
      '很会遵守关系里的规则和约定，因此产生信任。',
    ],
    summary: '你们同时拥有明确表达和稳定速度。比起马上下结论，会充分思考；重要的话也不会错过，会直接说出来。',
    title: '沉稳约定设计型',
    watchOut: '如果只等待整理好的话语，可能会少一点温暖的即兴感。',
  },
  HOLP: {
    code: 'HOLP',
    dateMission: '轻轻说一个有点委屈的小事，然后用散步或小吃把气氛换一下。',
    displayCode: 'VIBE',
    strengths: [
      '话说得明确，但不会只让气氛沉重。',
      '能用玩笑温柔地化开慢慢整理好的情绪。',
      '关系里同时有安全感和愉快感。',
    ],
    summary: '你们在稳定节奏中直接表达，并用轻松方式恢复。不会把委屈藏起来，也有能力通过玩笑和日常感回到舒服的状态。',
    title: '温柔室友式愉快型',
    watchOut: '即使用玩笑化解，也最好再确认一次对方是否真的理解了。',
  },
  HOQD: {
    code: 'HOQD',
    dateMission: '今天只说一个必要的话，并完整听完对方的回答。',
    displayCode: 'REAL',
    strengths: [
      '会快速确认误会，减少关系的摇晃。',
      '因为表达直接，期待也相对清楚。',
      '稳定的爱意和深入的对话保持平衡。',
    ],
    summary: '你们很沉稳，但不会拖延必要的话。不会长时间放着情绪火种不管，而是直接确认彼此心意，恢复安全感。',
    title: '温暖校准型',
    watchOut: '想快点确认的心意可能会让对方感到压力，试着调节语言的温度。',
  },
  HOQP: {
    code: 'HOQP',
    dateMission: '把今天聊天里最好笑的瞬间，不用截图，而是用一句话重现。',
    displayCode: 'KISS',
    strengths: [
      '能直接说话，同时让气氛保持轻松。',
      '出现误会时能快速解开，然后回到日常。',
      '稳定的日常里有活泼的来回接话。',
    ],
    summary: '你们建立在舒服基础上，诚实又愉快地连接。需要说的话会马上说；变沉重时，也懂得用玩笑换空气。',
    title: '稳定型默契修理工',
    watchOut: '快速收尾不一定等于充分修复。有时也听一听情绪后面的部分。',
  },
  SNLD: {
    code: 'SNLD',
    dateMission: '把突然浮现的心情简短发出去，之后再平静地补上理由。',
    displayCode: 'LUST',
    strengths: ['同时珍惜瞬间情绪和深层意义。', '含蓄表达里有很强的投入感。', '整理时间过去后，能创造很有余韵的对话。'],
    summary: '你们的情绪火花很快点亮，但拿出内心的方式很细腻。突然的吸引和深深的余韵并存，让两个人的场景浓烈地留下来。',
    title: '火花与余韵的小说型',
    watchOut: '强烈情绪如果只留下含蓄信号，对方可能会摸不清方向。',
  },
  SNLP: {
    code: 'SNLP',
    dateMission: '安排一次即兴的短见面或通话，结束时只说一个今天觉得好的地方。',
    displayCode: 'KINK',
    strengths: [
      '能制造瞬间的乐趣，并长久记住。',
      '两个人的暗号和玩笑让关系很鲜活。',
      '情绪整理后，有再次笑着恢复的力量。',
    ],
    summary: '你们混合了即兴吸引和含蓄玩笑。很快被点燃，但内心会慢慢打开；过一段时间后，又能笑着重新靠近。',
    title: '闪光秘密玩笑型',
    watchOut: '越是有趣的瞬间多，越要记得把重要情绪也好好接住。',
  },
  SNQD: {
    code: 'SNQD',
    dateMission: '现在就问一句近况，最后留一点空间，让对方可以轻松回答。',
    displayCode: 'SEXY',
    strengths: [
      '会快速回应情绪变化，并深入确认。',
      '不容易错过小信号，因此重新连接很快。',
      '即兴性和真心一起移动，让关系很有生命力。',
    ],
    summary: '你们很会抓住当下信号，并用真心快速连接。表达即使含蓄，情绪速度也很快；一看见摇晃，就有深入确认的力量。',
    title: '细腻火花雷达型',
    watchOut: '与其给对方的小变化放太多意义，不如加上一句直接确认的话。',
  },
  SNQP: {
    code: 'SNQP',
    dateMission: '发一个今天想到的玩笑，然后马上接上一句真正的关心。',
    displayCode: 'FOOL',
    strengths: [
      '快速反应和玩笑让对话很容易活起来。',
      '敏感读取小信号，并能转换气氛。',
      '即使出现误会，也能轻松地重新开口。',
    ],
    summary: '你们同时有灵光一闪的玩笑和细腻感知。会即兴发消息，读懂小小的语气，并很会快速让气氛复活。',
    title: '闪电玩笑雷达型',
    watchOut: '你的快速反应有时会跑在对方速度前面。停一拍也是连接的一部分。',
  },
  SOLD: {
    code: 'SOLD',
    dateMission: '提出一个即兴约会，并把这个提议里藏着的心意也一起说出来。',
    displayCode: 'BURN',
    strengths: ['不会错过心动的瞬间。', '坦率表达和深入对话连接得很强。', '整理之后，会说出让关系更稳的话。'],
    summary:
      '你们点燃得很快，但心意会深深留下。想说的话会比较直接地拿出来；情绪变大之后，也会用认真对话重新建立关系的意义。',
    title: '直进余韵设计型',
    watchOut: '即兴表达越强，越需要给对方留下追上的时间，关系会更稳定。',
  },
  SOLP: {
    code: 'SOLP',
    dateMission: '选一个用玩笑开始的话题，在最后轻轻补上真正想要的东西。',
    displayCode: 'WILD',
    strengths: ['坦率和愉快同时存在，因此不太憋闷。', '整理情绪后，也不会只让气氛沉重。', '即兴提议会给关系带来活力。'],
    summary: '你们即兴靠近、坦率表达，但恢复时会慢慢笑着回来。在玩笑和直接表达之间切换，创造属于两个人的活力。',
    title: '坦率即兴喜剧型',
    watchOut: '如果开玩笑说出的真心其实是请求，就再明确说一次，让对方听懂。',
  },
  SOQD: {
    code: 'SOQD',
    dateMission: '今天就把一个感谢和一个期待，用同样的温度说出来。',
    displayCode: 'FIRE',
    strengths: [
      '马上说、马上确认，所以误会不容易长期积累。',
      '能清楚传达真心，让关系方向更明确。',
      '快速修复之后，也会留下有意义的对话。',
    ],
    summary: '你们的情绪速度和表达清晰度都很快。喜欢就说喜欢，不舒服也不会长久埋着，而是用真心重新对齐。',
    title: '直进火花修复型',
    watchOut: '为了不让快速的坦率听起来尖锐，可以先铺上一句爱意的前提。',
  },
  SOQP: {
    code: 'SOQP',
    dateMission: '定一个只有你们懂的短呼号，今天之内先发一次。',
    displayCode: 'FUXK',
    strengths: [
      '就算聊天停下来，也能很快重新点火。',
      '坦率的话和玩笑混在一起，不太容易憋闷。',
      '小误会能快速解开，然后回到日常节奏。',
    ],
    summary: '你们想到就开口，通过坦率表达和玩笑快速靠近。不让沉重空气停留太久，会用两个人的默契接话重新连接。',
    title: '火花默契修复型',
    watchOut: '因为能轻松化解，更要再确认一次对方是否真的没事，关系会更稳。',
  },
} as const satisfies Record<CoupleTypeCode, CoupleTypeResult>

export const coupleTypeContent = {
  axisDefinitions,
  metadata: {
    description: '用12个问题阅读你们的聊天速度、表达方式、修复节奏和连接方式的非临床情侣聊天类型测试。',
    title: '情侣聊天类型',
  },
  questions: coupleTypeQuestions,
  results: coupleTypeResults,
  ui: {
    answeredCount: '已回答 {count} 题',
    dateMissionTitle: '今天的对话任务',
    editButton: '调整回答',
    heroDescription:
      '通过12个轻量选择，看看你们的聊天速度、表达方式、修复节奏和连接方式。这不是给人下定义，而是读取现在的模式。',
    heroEyebrow: '16种情侣聊天类型',
    heroTitle: '你们的聊天，会以什么节奏靠近？',
    homeLink: '回到首页',
    introCta: '',
    introNote: '',
    navigationLabel: '探索情侣聊天类型',
    nextButton: '下一题',
    previousButton: '上一题',
    privacyNotice: '回答数 {count} 题 · 结果不会保存在服务器，关闭标签页后即消失。',
    questionCountLabel: '题目',
    questionCountValue: '{count}题',
    resultButton: '查看结果',
    resultCountLabel: '结果',
    resultCountValue: '16种类型',
    resultEyebrow: '情侣聊天类型结果',
    restartButton: '重新开始',
    rhythmsTitle: '你们的四种节奏',
    selectAnswerButton: '请选择回答',
    strengthsTitle: '很契合的地方',
    watchOutTitle: '需要留意',
  },
} as const satisfies CoupleTypeContent
