import type { GyeolContent } from '../_lib/types'

export const rarityContent = {
  axes: {
    affection: {
      description: '爱意如何抵达彼此，并被确认成安心感',
      label: '爱意温度',
    },
    balance: {
      description: '把相似和不同放进关系里一起调和的能力',
      label: '关系平衡',
    },
    recovery: {
      description: '委屈或错位之后，再次靠近彼此的能力',
      label: '恢复力',
    },
    tempo: {
      description: '把各自的日常速度一起调到合适节奏的感觉',
      label: '生活节奏',
    },
  },
  grades: {
    1: {
      description:
        '在vibe模型里，四个维度都非常清晰地咬合在一起。你们有很强的共同标准，在一起时关系的纹理会很鲜明地显出来。',
      label: '1级',
      mountainLabel: '清晰的结',
    },
    2: {
      description: '爱意、节奏、平衡、恢复之中，有多个维度稳定地支撑着关系。你们很懂彼此用什么方式会变得舒服。',
      label: '2级',
      mountainLabel: '稳固的结',
    },
    3: {
      description: '有一两个维度的个性特别明显。相似和不同混合得刚刚好，已经形成了只属于你们的相处方式。',
      label: '3级',
      mountainLabel: '有个性的结',
    },
    4: {
      description: '比起特别突出，这是更偏平衡的组合。你们正在通过调节彼此的速度和表达方式，建立舒服的关系基础。',
      label: '4级',
      mountainLabel: '平衡的结',
    },
    5: {
      description: '这是很多情侣都会共鸣的舒服组合。比起某种特别的方法，日常里重复出现的稳定感更能托住关系。',
      label: '5级',
      mountainLabel: '舒服的结',
    },
    6: {
      description: '这是一种还有很多可以继续对齐的组合。你们正在一起认识哪些方式很合拍，哪些地方偶尔会错开。',
      label: '6级',
      mountainLabel: '正在对齐的结',
    },
    7: {
      description: '现在比起清晰成型的纹理，探索感更强。先从小标准开始轻松对齐，你们自己的方式会慢慢长出来。',
      label: '7级',
      mountainLabel: '新生的结',
    },
  },
  metadata: {
    description: '通过 16 个问题，轻松看看爱意温度、生活节奏、关系平衡和恢复力的非临床情侣倾向测试。',
    title: '情侣结指数测试',
  },
  questions: [
    {
      id: 'duration',
      options: [
        { id: 'duration-new', label: '我们还在小心地对齐彼此的标准' },
        { id: 'duration-seasonal', label: '经过几个季节后，已经有了自然的规则' },
        { id: 'duration-long', label: '累积下来的场景和标准已经不少' },
      ],
      question: '你们对齐彼此生活标准的方式是？',
    },
    {
      id: 'frequency',
      options: [
        { id: 'frequency-daily', label: '每天有小小的交集才会安心' },
        { id: 'frequency-steady', label: '各自保留时间，关系的流动也不太会晃' },
        { id: 'frequency-event', label: '平时各自过，重要时刻会迅速靠近' },
      ],
      question: '你们一起度过日常的密度是？',
    },
    {
      id: 'replyRhythm',
      options: [
        { id: 'reply-fast', label: '想到就会很快决定并行动' },
        { id: 'reply-slow', label: '充分观察后，再稳定地对齐' },
        { id: 'reply-asymmetric', label: '一方先带动，另一方更深地接住' },
      ],
      question: '决定约定或计划时，两个人的节奏是？',
    },
    {
      id: 'planning',
      options: [
        { id: 'plans-flexible', label: '会根据情况混合即兴和计划' },
        { id: 'plans-planned', label: '提前对齐日程和状态会更舒服' },
        { id: 'plans-drifting', label: '常常顺着当下走，偶尔会错开' },
      ],
      question: '安排约会或休息日的方式是？',
    },
    {
      id: 'changeResponse',
      options: [
        { id: 'change-fast', label: '出现变量时会立刻换方向' },
        { id: 'change-cautious', label: '先稍微观察，再慢慢调整' },
        { id: 'change-role-split', label: '一方行动，一方整理，然后一起对齐' },
      ],
      question: '计划突然改变时，你们会怎样？',
    },
    {
      id: 'expression',
      options: [
        { id: 'expression-direct', label: '喜欢的时候会比较清楚地表达' },
        { id: 'expression-subtle', label: '会先通过气氛、行动和时机表现出来' },
        { id: 'expression-mixed', label: '会把直接表达和只有你们懂的信号混在一起' },
      ],
      question: '你们感受和表达爱意的方式是？',
    },
    {
      id: 'reassurance',
      options: [
        { id: 'reassurance-clear', label: '需要的话要说清楚，才会稳定下来' },
        { id: 'reassurance-subtle', label: '小动作和气氛也足够让人感觉到' },
        { id: 'reassurance-awkward', label: '心意是有的，但有时会错过表达时机' },
      ],
      question: '需要确认时，最有效的方式是？',
    },
    {
      id: 'support',
      options: [
        { id: 'support-listen', label: '被听到最后、被说中心情时会有力量' },
        { id: 'support-practical', label: '马上做出有帮助的行动会很踏实' },
        { id: 'support-light', label: '轻松的玩笑或转场会让人喘口气' },
      ],
      question: '难过的一天，彼此最需要什么反应？',
    },
    {
      id: 'repair',
      options: [
        { id: 'repair-fast', label: '早点确认才会安心' },
        { id: 'repair-cooldown', label: '先冷却一下，再冷静地重新对齐' },
        { id: 'repair-comeback', label: '就算暂时拉开，最后也有重新靠近的力量' },
      ],
      question: '出现委屈时，你们会怎么回来？',
    },
    {
      id: 'apology',
      options: [
        { id: 'apology-fast', label: '哪怕很短，早点说抱歉就会松动' },
        { id: 'apology-action', label: '比起话语，看到改变的行动才会有信任感' },
        { id: 'apology-miss', label: '有时会错过时机，之后变得有点尴尬' },
      ],
      question: '你们处理歉意的方式是？',
    },
    {
      id: 'stress',
      options: [
        { id: 'stress-share', label: '比较能把辛苦的事说给彼此听' },
        { id: 'stress-quiet', label: '各自整理好后，只分享需要的部分' },
        { id: 'stress-bounce', label: '变得太沉重前，会先换个气氛带过去' },
      ],
      question: '压力变大时，两个人的距离是？',
    },
    {
      id: 'privateSignals',
      options: [
        { id: 'signals-many', label: '昵称、梗、习惯一样的专属信号很多' },
        { id: 'signals-some', label: '偶尔有马上能看懂的玩笑或表情' },
        { id: 'signals-few', label: '比起暗号，轻松的日常感更适合你们' },
      ],
      question: '有没有只有你们知道的小信号？',
    },
    {
      id: 'memory',
      options: [
        { id: 'memory-exact', label: '成为转折点的瞬间记得很清楚' },
        { id: 'memory-vibe', label: '比起日期，当时的气氛和感受更久地留下' },
        { id: 'memory-now', label: '比起过去，现在的稳定感更重要' },
      ],
      question: '摇晃之后再次靠近的瞬间，会怎样留下？',
    },
    {
      id: 'balance',
      options: [
        { id: 'balance-similar', label: '喜好和速度越来越像' },
        { id: 'balance-complementary', label: '因为不同，反而能补上彼此的空白' },
        { id: 'balance-volatile', label: '顺的时候和错开的时候温差很大' },
      ],
      question: '你们的关系平衡是什么样子？',
    },
    {
      id: 'decision',
      options: [
        { id: 'decision-together', label: '重要选择会一起对齐标准再决定' },
        { id: 'decision-alternate', label: '会根据情况自然轮流主导' },
        { id: 'decision-one-sided', label: '一方决定得更多，另一方跟随得更多' },
      ],
      question: '做重要选择时的平衡是？',
    },
    {
      id: 'space',
      options: [
        { id: 'space-close', label: '经常待在一起，关系才会舒服' },
        { id: 'space-respecting', label: '各自的时间也被尊重时，关系会更稳' },
        { id: 'space-uneven', label: '想要的距离不同，偶尔需要协调' },
      ],
      question: '你们保留各自时间的方式是？',
    },
  ],
  results: {
    archive: {
      mission: '今天说一个长久记住的场景吧。再简单补一句，当时为什么好。',
      nickname: '场景收藏型',
      reasons: [
        '你们有长久保存关系重要瞬间的力量。',
        '过去的经验支撑着现在的稳定感。',
        '两个人的标准在时间里慢慢累积起来了。',
      ],
      summary: '你们的结不会让过去的瞬间轻易流走。留下来的场景越多，两个人之间的标准也会越清晰。',
    },
    harbor: {
      mission: '今天先别急着下结论，先分享一种让彼此舒服的方式。',
      nickname: '安心停靠型',
      reasons: [
        '比起快速刺激，能回来的安心感更大。',
        '即使各自速度不同，关系也不容易晃动。',
        '你们更容易把差异当作角色，而不是不安。',
      ],
      summary: '你们的结比起剧烈摇晃，更擅长做出一个可以回来的位置。强项不是戏剧化瞬间，而是重新变得舒服的方式。',
    },
    orbit: {
      mission: '今天选一个你们经常重复的小习惯吧。一起想想它从什么时候变成了你们的东西。',
      nickname: '日常轨道型',
      reasons: [
        '小小的重复会制造你们的节奏。',
        '比起大事件，日常里的接点更常被点亮。',
        '越来越相似的习惯会留下安心的信号。',
      ],
      summary: '你们的结会通过每天的小重复慢慢靠近。比起某个特别瞬间，持续回来的习惯才是这个组合的魅力。',
    },
    rare: {
      mission: '今天给一个只有你们懂的信号加上一句真实心意吧。轻一点，但要清楚。',
      nickname: '纹理清晰的独特型',
      reasons: [
        '四个维度都一起出现了强信号。',
        '爱意、节奏、平衡和恢复朝同一个方向咬合。',
        '很难用一个常见情侣公式解释你们。',
      ],
      summary: '按vibe模型来看，你们的结是相当清晰的组合。别人眼里普通的瞬间，在你们之间也会像马上能懂的标准一样运作。',
    },
    reconnect: {
      mission: '想起最近一次错开后又靠近的瞬间吧。今天也可以再做一次当时有帮助的行动。',
      nickname: '重新对齐的恢复型',
      reasons: [
        '你们有把中断的流动重新接上的力量。',
        '比起长久放着委屈，你们更倾向确认或回来。',
        '不同的速度也可以变成恢复的材料。',
      ],
      summary: '你们的结不一定总是顺滑，但有重新对齐的力量。重要的不是错位本身，而是再次靠近的方式。',
    },
    signal: {
      mission: '选一个你们能马上看懂的信号吧。今天可以把它的意思说得更温柔一点。',
      nickname: '两个人的信号型',
      reasons: [
        '不直接说明也能互相懂的信号很多。',
        '表情、行动和玩笑会成为爱意的标记。',
        '外面看起来轻松，里面的意义却很深。',
      ],
      summary: '你们的结从外面看也许普通，但对彼此来说有很多清晰信号。只有两个人懂的解释，会让关系变得更稳。',
    },
    spark: {
      mission: '把突然浮现的心意告诉对方吧。也记得留一点空间，让对方能舒服地接住。',
      nickname: '瞬间点燃型',
      reasons: [
        '想到的瞬间，关系就会被点亮。',
        '比起大计划，小选择更能推动你们之间的距离。',
        '当下的感受和反应更接近关系中心。',
      ],
      summary: '你们的结比起准备很久的事件，更靠瞬间的小火苗活起来。轻轻开始的东西，可能会意外延长成很久的场景。',
    },
  },
  ui: {
    answeredCount: '{count}/{total} 已回答',
    axisScoresTitle: '四种结',
    backButton: '上一步',
    copyFallbackButton: '复制链接',
    copiedFeedback: '分享链接已复制。',
    emptyResultDescription: '分享链接格式不正确。重新回答16个问题即可生成新的结果卡。',
    emptyResultTitle: '要重新生成结果卡吗？',
    gradeTitle: '我们的结等级',
    heroCta: '查看情侣结指数',
    heroDescription: '通过16个问题，轻松看看爱意温度、生活节奏、关系平衡和恢复力。',
    heroEyebrow: '16个问题，大约2分钟',
    heroSecondaryCta: '会看什么？',
    heroTitle: '我们之间的结有几段？',
    indexLabel: '情侣结指数',
    introNote: '不用登录，可以马上开始。',
    missionTitle: '今天可以试的小任务',
    modelStepGradeBody: '根据vibe模型读取回答组合，并显示从1级到7级的位置。',
    modelStepGradeTitle: '查看等级',
    modelStepInputBody: '只会询问爱意温度、生活节奏、关系平衡、恢复力等可以马上选择的问题。',
    modelStepInputTitle: '16个问题',
    modelStepShareBody: '把分数、等级、昵称和一句总结整理成适合截图或发送的卡片。',
    modelStepShareTitle: '分享卡',
    modelNotice: '这不是寻找正确答案的测试，而是根据vibe模型读取回答组合的结果。',
    nextButton: '下一题',
    questionEyebrow: '16题测试',
    reasonsTitle: '为什么会这样解读',
    resultButton: '查看结果',
    resultEyebrow: '我们的结卡片',
    restartButton: '重新开始',
    resultCardBody: '不展示敏感信息，只轻松显示分数和昵称。',
    resultCardTitle: '可以马上发送的结果卡',
    shareButton: '发送结果链接',
    shareFallbackBody: '{grade} · {nickname} · 结指数 {index}',
    shareLead: '基于vibe模型',
    shareTitle: '我们的情侣结指数卡',
  },
} as const satisfies GyeolContent
