// Every string below is the value the DOM held, not the value declared at :2965/:2984/:2989. The origin
// reassigns `render` 39 times and only three of those wrappers touch this table — :7302 (renames 21 of the
// 32 display names via ABILITY_DISPLAY_V38), :7838 and :8210 — so reading the declarations gives the wrong
// text for two thirds of the names. Slugs, not names, are the identity: they key the 32 card images and
// they survive the renames.

/** 8 axes x 2 poles. Order follows AXIS_POLES in deep-type/model.ts, which is not alphabetical. */
export const ABILITY = {
  EI: { E: 'people_on', I: 'deep_solo' },
  SN: { S: 'reality_eye', N: 'possibility_eye' },
  TF: { T: 'structure_judgment', F: 'heart_judgment' },
  JP: { J: 'order_power', P: 'moment_ride' },
  RM: { R: 'steady_center', M: 'resonance' },
  OA: { O: 'closeness_courage', A: 'alone_power' },
  VH: { V: 'emotion_out', H: 'emotion_hold' },
  UO: { U: 'farther_fuel', O: 'protect' },
} as const

/**
 * 4 axis pairs x 4 pole cells. Derived, never independent: getAbilities scores a combo as
 * pct = A.pct * B.pct / 100 with st = min(A.st, B.st) (:3737), which is always rarer than either parent, so a
 * rarity-ascending sort puts combos on top. Rank them in their own slot rather than against ABILITY.
 * `tab` ('H' = type axes, 'G' = core axes) has no read site in the origin — axPick (:3728) re-derives the same
 * split from `a`. Kept as provenance, not as input.
 */
export const COMBO = [
  {
    a: 'SN',
    b: 'TF',
    n: { ST: 'fact_break', SF: 'care_eye', NT: 'field_read', NF: 'story_feel' },
    tab: 'H',
  },
  {
    a: 'EI',
    b: 'JP',
    n: { EJ: 'lead_field', EP: 'improvise_open', IJ: 'solo_finish', IP: 'deep_focus' },
    tab: 'H',
  },
  {
    a: 'RM',
    b: 'UO',
    n: { RU: 'self_fuel', RO: 'steady_roots', MU: 'recognition_fuel', MO: 'warmth_guard' },
    tab: 'G',
  },
  {
    a: 'OA',
    b: 'VH',
    n: { OV: 'heart_connect', OH: 'quiet_presence', AV: 'fresh_expression', AH: 'stillness' },
    tab: 'G',
  },
] as const

/** Card copy for all 32 strengths. Field order matches the card layout: title, headline, body, footer. */
export const ABILITY_DETAIL = {
  people_on: {
    core: '사람이 모인 자리에서 먼저 말을 꺼내고, 다른 사람이 편하게 말하도록 돕는 힘이에요.',
    name: '먼저 말을 거는 힘',
    shine: '처음 만난 팀, 발표 시작, 모두가 눈치를 보는 순간에 잘 쓰여요.',
    short: '낯선 자리에서도 먼저 말을 꺼내 분위기를 푸는 힘',
    watch: '계속 분위기를 맡으려 하면 혼자 지칠 수 있어요. 조용히 있는 시간도 필요해요.',
  },
  deep_solo: {
    core: '혼자 있는 시간에 생각을 키우고, 오래 붙들어야 풀리는 문제에 집중하는 힘이에요.',
    name: '혼자 오래 생각하는 힘',
    shine: '집중해서 읽고 쓰는 일, 오래 생각해야 답이 나오는 일에서 잘 쓰여요.',
    short: '방해가 사라질수록 생각이 깊어지는 힘',
    watch: '준비가 더 필요하다는 생각에 시작이나 공유가 늦어질 수 있어요.',
  },
  reality_eye: {
    core: '막연한 이야기보다 지금 확인할 수 있는 정보와 실제 변화를 먼저 보는 힘이에요.',
    name: '사실을 놓치지 않는 눈',
    shine: '실수를 찾아야 할 때, 일정과 비용을 맞출 때, 현장을 볼 때 잘 쓰여요.',
    short: '지금 확인할 수 있는 사실을 놓치지 않는 눈',
    watch: '아직 보이지 않는 가능성을 너무 빨리 어렵다고 판단할 수 있어요.',
  },
  // Shipped ungrammatical: the question-bank pass at :8210 rewrote '다음 장면' outside its declared scope
  // and left the particle as '두 번째 단계을'. Kept verbatim; fix belongs in a rewrite, not in the import.
  possibility_eye: {
    core: '지금 모습에 머물지 않고, 무엇이 더 될 수 있는지 그리는 힘이에요.',
    name: '가능성을 보는 눈',
    shine: '새 아이디어, 기획의 첫 단계, 막힌 문제의 다른 길을 찾을 때 잘 쓰여요.',
    short: '아직 없는 두 번째 단계을 먼저 떠올리는 눈',
    watch: '좋은 생각이 많아질수록 지금 해야 할 한 가지를 놓칠 수 있어요.',
  },
  structure_judgment: {
    core: '감정에 휩쓸리기보다 원인과 결과를 나눠서 답을 찾는 힘이에요.',
    name: '원인과 순서를 찾는 힘',
    shine: '문제를 고치거나, 선택지를 줄이거나, 기준을 세워야 할 때 잘 쓰여요.',
    short: '복잡한 문제에서 핵심 기준을 찾는 판단',
    watch: '맞는 말을 빠르게 찾다가 상대가 받아들일 시간을 놓칠 수 있어요.',
  },
  heart_judgment: {
    core: '무엇이 맞는지만 보지 않고, 그 결정이 다른 사람에게 어떤 영향을 줄지도 살피는 힘이에요.',
    name: '상대 마음을 살피는 힘',
    shine: '갈등을 풀거나, 누군가를 설득하거나, 팀의 마음을 모을 때 잘 쓰여요.',
    short: '말보다 그 안의 마음까지 함께 보는 판단',
    watch: '모두의 마음을 챙기다 내 기준과 결정을 뒤로 미룰 수 있어요.',
  },
  order_power: {
    core: '해야 할 일을 나누고, 끝나는 시점을 정해 움직이게 만드는 힘이에요.',
    name: '일을 순서대로 정리하는 힘',
    shine: '여러 일이 겹칠 때, 약속을 지켜야 할 때, 팀을 정리할 때 잘 쓰여요.',
    short: '흩어진 일을 순서와 마감으로 바꾸는 힘',
    watch: '계획이 바뀌는 순간에 필요 이상으로 힘이 빠질 수 있어요.',
  },
  moment_ride: {
    core: '준비한 답이 없어도 지금 벌어진 일에 맞춰 바로 다음 행동을 찾는 힘이에요.',
    name: '갑자기 바뀌어도 움직이는 힘',
    shine: '갑작스러운 기회, 예상 밖의 질문, 빠른 현장 대응에서 잘 쓰여요.',
    short: '바뀐 상황을 빠르게 읽고 움직이는 힘',
    watch: '재미와 속도를 따라가다 마감이나 뒷정리를 놓칠 수 있어요.',
  },
  steady_center: {
    core: '칭찬이나 실망에 바로 끌려가지 않고, 스스로 정한 기준으로 버티는 힘이에요.',
    name: '흔들리지 않는 중심',
    shine: '반대가 있어도 결정해야 할 때, 오래 책임져야 할 자리에서 잘 쓰여요.',
    short: '남의 반응 속에서도 내 기준을 지키는 힘',
    watch: '도움을 받아야 할 때도 괜찮다고 버티며 문을 닫을 수 있어요.',
  },
  resonance: {
    core: '표정과 말투가 달라지는 순간을 빨리 알아채고 내 행동을 맞추는 힘이에요.',
    name: '작은 반응을 알아채는 힘',
    shine: '고객 반응을 읽거나, 관계의 온도를 맞추거나, 표현을 다듬을 때 잘 쓰여요.',
    short: '사람과 공간의 작은 반응까지 받는 감각',
    watch: '다른 사람의 반응이 적으면 내 실력까지 부족하다고 느낄 수 있어요.',
  },
  closeness_courage: {
    core: '기다리기만 하지 않고 먼저 묻고 표현해서 어색함을 푸는 힘이에요.',
    name: '가까워지는 용기',
    shine: '어색함을 풀거나, 믿음을 만들거나, 함께 시작해야 할 때 잘 쓰여요.',
    short: '먼저 마음의 거리를 줄일 수 있는 용기',
    watch: '빠르게 가까워진 만큼 상대의 속도가 느리면 서운함이 커질 수 있어요.',
  },
  alone_power: {
    core: '누가 답을 정해주지 않아도 내 공간과 기준을 지키며 움직이는 힘이에요.',
    name: '홀로 서는 힘',
    shine: '혼자 결정해야 할 때, 새 환경에서 버틸 때, 다시 시작할 때 잘 쓰여요.',
    short: '혼자서도 선택하고 다시 움직일 수 있는 힘',
    watch: '혼자 해내는 데 익숙해서 필요한 도움까지 늦게 말할 수 있어요.',
  },
  emotion_out: {
    core: '느낀 것을 숨겨두지 않고 표현해서 관계와 상황을 움직이는 힘이에요.',
    name: '마음을 말로 전하는 힘',
    shine: '오해를 빨리 풀거나, 마음을 전하거나, 모두가 참는 말을 꺼낼 때 잘 쓰여요.',
    short: '느낀 마음을 말이나 행동으로 표현하는 힘',
    watch: '감정이 가장 큰 순간에 바로 말하면 생각보다 날카롭게 들릴 수 있어요.',
  },
  emotion_hold: {
    core: '감정을 바로 쏟기보다 안에서 충분히 느끼고 뜻을 정리하는 힘이에요.',
    name: '마음을 천천히 정리하는 힘',
    shine: '쉽게 답할 수 없는 마음, 오래 돌봐야 하는 관계, 깊은 표현에서 잘 쓰여요.',
    short: '감정이 커도 바로 쏟지 않고 천천히 정리하는 힘',
    watch: '다 정리한 뒤 말하려다가 아무도 모르게 혼자 아플 수 있어요.',
  },
  farther_fuel: {
    core: '끝냈다는 말보다 다음 목표에서 힘을 얻고 스스로 기준을 높이는 힘이에요.',
    name: '다음 목표로 가는 힘',
    shine: '성장해야 하는 일, 긴 도전, 새 목표를 세우는 순간에 잘 쓰여요.',
    short: '지금보다 나은 곳을 향해 계속 가는 힘',
    watch: '이미 해낸 것을 보지 못하고 계속 부족하다고 느낄 수 있어요.',
  },
  protect: {
    core: '새로운 것보다 이미 쌓인 믿음과 약속을 지키는 데 힘을 쓰는 능력이에요.',
    name: '지켜내는 힘',
    shine: '꾸준함이 필요한 일, 오래 가는 관계, 흔들리는 팀을 붙잡을 때 잘 쓰여요.',
    short: '소중한 사람과 일을 오래 놓지 않는 힘',
    watch: '바꿔야 하는 순간에도 익숙한 것을 오래 붙들 수 있어요.',
  },
  fact_break: {
    core: '복잡한 말을 줄이고, 확인할 수 있는 한 가지 사실부터 문제를 푸는 힘이에요.',
    name: '사실부터 확인하는 힘',
    shine: '원인을 찾아야 할 때, 말이 엇갈릴 때, 빠르게 고쳐야 할 때 잘 쓰여요.',
    short: '느낌보다 확인된 사실로 막힌 곳을 여는 힘',
    watch: '사실만 맞으면 된다고 생각해 사람의 마음을 놓칠 수 있어요.',
  },
  care_eye: {
    core: '전체를 보면서 누가 불편한지, 어떤 말이 상처가 될지 먼저 알아채는 힘이에요.',
    name: '곁을 살피는 눈',
    shine: '여러 사람이 함께 움직일 때, 조심스러운 대화, 세심한 확인에서 잘 쓰여요.',
    short: '한 걸음 뒤에서 놓친 사람을 발견하는 눈',
    watch: '남을 살피느라 내 불편함을 가장 늦게 알아차릴 수 있어요.',
  },
  field_read: {
    core: '사실과 가능성을 함께 놓고, 지금 선택이 어디로 이어질지 읽는 힘이에요.',
    name: '상황을 읽는 눈',
    shine: '전략을 짜거나, 여러 선택을 비교하거나, 큰 방향을 정할 때 잘 쓰여요.',
    short: '흩어진 신호를 이어 다음 흐름을 보는 눈',
    watch: '멀리 보느라 지금 바로 해야 하는 작은 확인을 건너뛸 수 있어요.',
  },
  story_feel: {
    core: '말 한마디만 보지 않고 그 사람이 지나온 마음과 두 번째 단계까지 이어 보는 힘이에요.',
    name: '사람의 이야기를 이해하는 힘',
    shine: '글, 기획, 상담, 사람의 마음을 담아야 하는 표현에서 잘 쓰여요.',
    short: '사람의 마음을 하나의 흐름으로 이해하는 감각',
    watch: '보이는 것보다 많은 뜻을 읽어 혼자 생각이 길어질 수 있어요.',
  },
  lead_field: {
    core: '목표를 말로만 두지 않고 역할과 순서를 정해 실제 움직임으로 바꾸는 힘이에요.',
    name: '사람과 일을 이끄는 힘',
    shine: '팀의 첫발, 마감이 있는 일, 결정을 미룰 수 없는 순간에 잘 쓰여요.',
    short: '사람과 순서를 함께 세워 앞으로 보내는 힘',
    watch: '속도가 느린 사람까지 내 속도로 끌어당기면 숨이 찰 수 있어요.',
  },
  improvise_open: {
    core: '계획이 없어도 그 자리의 분위기와 기회를 보고 바로 방법을 찾는 힘이에요.',
    name: '그 자리에서 방법을 찾는 힘',
    shine: '행사, 발표, 대화, 갑자기 바뀐 상황에서 분위기를 살릴 때 잘 쓰여요.',
    short: '사람의 반응을 받아 새 길을 바로 만드는 힘',
    watch: '그때의 분위기만 믿다가 다음 준비를 놓칠 수 있어요.',
  },
  solo_finish: {
    core: '혼자 집중할 시간과 분명한 순서가 있으면 맡은 일을 끝까지 마무리하는 힘이에요.',
    name: '혼자 완성하는 힘',
    shine: '긴 작업, 정확한 마감, 혼자 책임져야 하는 결과물에서 잘 쓰여요.',
    short: '방해 없이 끝까지 쌓아 결과로 내놓는 힘',
    watch: '완성한 뒤에 보여주려다가 도움과 피드백을 받을 때를 놓칠 수 있어요.',
  },
  deep_focus: {
    core: '정해진 길보다 궁금증을 따라가며 남들이 지나친 답을 찾아내는 힘이에요.',
    name: '궁금한 것을 끝까지 파는 힘',
    shine: '연구, 만들기, 어려운 문제, 새로운 분야를 배우는 일에서 잘 쓰여요.',
    short: '궁금한 한 가지를 끝까지 따라가는 힘',
    watch: '빠져든 일 밖의 약속과 시간이 흐려질 수 있어요.',
  },
  self_fuel: {
    core: '남이 알아주기 전에도 내가 원하는 방향을 믿고 계속 움직이는 힘이에요.',
    name: '스스로 시작하는 힘',
    shine: '혼자 시작하는 일, 긴 준비, 결과가 늦게 나오는 도전에서 잘 쓰여요.',
    short: '박수가 없어도 내 목표로 움직이는 힘',
    watch: '지쳐도 괜찮다고 생각하며 쉬지 않고 계속할 수 있어요.',
  },
  steady_roots: {
    core: '밖의 반응이 바뀌어도 내가 믿는 사람과 약속을 오래 붙드는 힘이에요.',
    name: '흔들리지 않는 뿌리',
    shine: '오랜 책임, 믿음이 필요한 관계, 쉽게 포기하면 안 되는 일에서 잘 쓰여요.',
    short: '내 기준과 소중한 것을 함께 지키는 힘',
    watch: '지키는 것이 맞는지 다시 봐야 할 때도 오래 버틸 수 있어요.',
  },
  recognition_fuel: {
    core: '알아봐주는 시선을 받으면 집중과 표현이 빠르게 살아나는 힘이에요.',
    name: '칭찬을 받으면 더 힘내는 능력',
    shine: '관객이 있는 무대, 반응이 빠른 일, 함께 목표를 확인하는 팀에서 잘 쓰여요.',
    short: '누군가의 기대를 성장의 힘으로 바꾸는 능력',
    watch: '반응이 없는 날에는 실력까지 사라진 것처럼 느낄 수 있어요.',
  },
  warmth_guard: {
    core: '작은 변화를 알아채고, 필요한 일을 먼저 챙겨 관계를 따뜻하게 지키는 힘이에요.',
    name: '곁을 지키는 온기',
    shine: '팀을 돌보거나, 오래 만나는 사람을 챙기거나, 믿음을 쌓을 때 잘 쓰여요.',
    short: '반응을 살피며 오래 곁을 지켜주는 힘',
    watch: '내가 한 만큼 돌아오길 기다리다 말없이 서운함이 쌓일 수 있어요.',
  },
  heart_connect: {
    core: '관계가 어색해졌을 때 기다리지 않고 말과 행동으로 다시 연결하는 힘이에요.',
    name: '마음을 잇는 손',
    shine: '갈등 뒤의 대화, 첫 만남, 서로의 마음을 확인해야 할 때 잘 쓰여요.',
    short: '먼저 표현해 멀어진 마음을 다시 잇는 힘',
    watch: '관계를 살리려는 마음 때문에 내 잘못이 아닌 몫까지 맡을 수 있어요.',
  },
  quiet_presence: {
    core: '답을 재촉하지 않고 상대가 마음을 열 때까지 곁에서 기다려주는 힘이에요.',
    name: '말없이 곁에 있는 힘',
    shine: '누군가 힘든 날, 말보다 시간이 필요한 관계, 오래 돌보는 일에서 잘 쓰여요.',
    short: '재촉하지 않고 필요한 거리를 지켜주는 힘',
    watch: '기다림이 길어지면 내 마음과 바람이 없는 것처럼 보일 수 있어요.',
  },
  fresh_expression: {
    core: '무거운 장면에서도 필요한 말과 감정을 부담 없이 꺼내 흐름을 바꾸는 힘이에요.',
    name: '무거운 분위기를 가볍게 푸는 힘',
    shine: '처음 말을 꺼낼 때, 긴장을 풀 때, 새 사람과 빠르게 맞출 때 잘 쓰여요.',
    short: '내 공간을 지키며 분위기를 가볍게 바꾸는 힘',
    watch: '가볍게 넘긴 말 뒤에 진짜 서운함을 숨길 수 있어요.',
  },
  stillness: {
    core: '외부 반응 없이도 감정이 가라앉을 때까지 기다리고 스스로 정리하는 힘이에요.',
    name: '혼자 마음을 정리하는 힘',
    shine: '혼자 결정해야 할 때, 긴 회복, 깊은 창작과 생각에서 잘 쓰여요.',
    short: '혼자 있을 때 올라오는 감정을 서둘러 덮지 않는 힘',
    watch: '괜찮아질 때까지 혼자 있으려다 관계의 문을 너무 오래 닫을 수 있어요.',
  },
} as const

/**
 * The origin's declared-name -> slug map (:3685), kept because the declared names are still the join key to
 * the gem talent table at :2958 and to any archived payload that stored a name instead of a slug.
 * These are pre-rename strings: 21 of them no longer match ABILITY_DETAIL[slug].name.
 */
export const STRENGTHKEY = {
  '사람을 켜는 힘': 'people_on',
  '혼자 깊어지는 힘': 'deep_solo',
  '현실을 붙잡는 눈': 'reality_eye',
  '가능성을 보는 눈': 'possibility_eye',
  '구조를 꿰는 판단': 'structure_judgment',
  '마음을 읽는 판단': 'heart_judgment',
  '질서를 세우는 힘': 'order_power',
  '순간에 올라타는 힘': 'moment_ride',
  '흔들리지 않는 중심': 'steady_center',
  '공명하는 감각': 'resonance',
  '가까워지는 용기': 'closeness_courage',
  '홀로 서는 힘': 'alone_power',
  '감정을 꺼내는 힘': 'emotion_out',
  '감정을 품는 힘': 'emotion_hold',
  '더 멀리 가는 연료': 'farther_fuel',
  '지켜내는 힘': 'protect',
  '팩트로 뚫는 힘': 'fact_break',
  '곁을 살피는 눈': 'care_eye',
  '판을 읽는 눈': 'field_read',
  '이야기를 느끼는 감각': 'story_feel',
  '판을 끌고 가는 힘': 'lead_field',
  '즉석에서 여는 힘': 'improvise_open',
  '혼자 완성하는 힘': 'solo_finish',
  '깊게 파고드는 몰입': 'deep_focus',
  '스스로 타오르는 연료': 'self_fuel',
  '흔들리지 않는 뿌리': 'steady_roots',
  '인정을 연료로 바꾸는 힘': 'recognition_fuel',
  '곁을 지키는 온기': 'warmth_guard',
  '마음을 잇는 손': 'heart_connect',
  '말없이 곁에 있는 힘': 'quiet_presence',
  '산뜻하게 표현하는 힘': 'fresh_expression',
  '고요를 견디는 힘': 'stillness',
} as const
