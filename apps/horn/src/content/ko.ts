import type { Grade, ToastKind, UpgradeId } from '@/game/types'

/** All player-facing Korean copy. Tone: 짓궂지만 전연령 — winking, never explicit. */
export const KO = {
  meta: {
    title: '임신시키기 — 저출산 대작전',
    description:
      '저출산 몬스터가 덮친 도시에서 큐피드가 되어 솔로들을 이어주고 인구를 최대한 늘리는 액션 아케이드 게임. 사랑으로 저출산을 물리쳐라! 💘',
  },

  brand: '임신시키기',
  subtitle: '저출산 대작전',
  tagline: '집값·야근·사교육이 도시를 덮쳤다.\n큐피드가 되어 사랑으로 인구를 되살려라.',
  startButton: '작전 개시 😏',
  howto: {
    title: '작전 요령',
    steps: [
      '이동만 하면 큐피드가 알아서 사랑을 쏜다 (WASD·방향키·화면 드래그)',
      '달아오른 솔로는 짝을 찾아가 아이를 낳는다',
      '집값·야근 몬스터는 피하고, 사랑으로 물리쳐라',
    ],
  },
  bestPrefix: '최고 기록',

  hud: {
    population: '늘린 인구',
    combo: '콤보',
    time: '생존 시간',
    level: 'Lv',
  },

  toasts: {
    twins: ['쌍둥이요! 🍼', '한 번에 둘, 능력자네', '원 플러스 원 당첨'],
    triplets: ['삼둥이 대박! 🎉', '다산의 여왕 등극', '이 구역 인구절벽 해결사'],
    golden: ['골든 커플 💛', '경사 났네 경사', '이건 국가유공자감'],
    levelup: ['레벨 업! ✨', '큐피드 성장 중'],
  } satisfies Record<Exclude<ToastKind, 'combo'>, string[]>,
  comboTemplate: '{n} 콤보! 🔥',

  levelup: {
    title: '레벨 업!',
    subtitle: '능력을 하나 골라',
    levelTag: 'Lv.',
  },

  upgrades: {
    auraRadius: { emoji: '💗', name: '매력 오라 확대', desc: '더 넓은 반경의 사람이 반한다' },
    auraRate: { emoji: '💞', name: '치명적 매력', desc: '오라 안 사람이 더 빨리 달아오른다' },
    arrowCount: { emoji: '🏹', name: '큐피드 화살 +1', desc: '사랑의 화살을 한 발 더 쏜다' },
    arrowRate: { emoji: '⚡', name: '속사', desc: '화살 발사 속도가 빨라진다' },
    pulse: { emoji: '💓', name: '하트 펄스', desc: '주기적으로 사방에 사랑을 퍼뜨린다' },
    moveSpeed: { emoji: '👟', name: '가벼운 발걸음', desc: '이동 속도가 빨라진다' },
    magnet: { emoji: '🧲', name: '사랑의 자석', desc: '경험치 수집 범위가 넓어진다' },
    twins: { emoji: '🍼', name: '다산의 기운', desc: '쌍둥이 확률이 오른다' },
    maxHp: { emoji: '❤️', name: '강철 멘탈', desc: '최대 기력이 늘고 조금 회복한다' },
    regen: { emoji: '🧘', name: '평정심', desc: '기력이 더 빨리 회복된다' },
  } satisfies Record<UpgradeId, { emoji: string; name: string; desc: string }>,

  result: {
    title: '작전 종료',
    populationLabel: '당신이 늘린 도시 인구',
    unit: '명',
    levelLabel: '도달 레벨',
    survivedLabel: '생존 시간',
    bestComboLabel: '최고 콤보',
    newBest: '자체 최고 기록 경신! 🏆',
    grades: {
      S: { title: '도시 산부인과 원장', blurb: '혼자서 도시 하나를 먹여 살렸다. 인구부 장관 자리 예약.' },
      A: { title: '전설의 중매쟁이', blurb: '솔로들의 구세주. 청첩장이 온 동네에서 쏟아진다.' },
      B: { title: '동네 큐피드', blurb: '나쁘지 않아. 이번 명절엔 잔소리 좀 덜 듣겠다.' },
      C: { title: '견습 큐피드', blurb: '화살은 쐈지만 아직 명중이 좀 서툴다.' },
      D: { title: '모태 솔로 탈출 실패', blurb: '너부터 어떻게 좀 해보자. 재도전 각.' },
    } satisfies Record<Grade, { title: string; blurb: string }>,
    shareButton: '결과 자랑하기',
    replayButton: '다시 도전',
    shareTitle: '임신시키기',
    shareText: '나는 임신시키기로 {score}명을 늘리고 Lv.{level}까지 찍었다. 너의 출산율은? 💘',
    copied: '링크를 복사했어요',
  },

  pause: {
    title: '일시정지',
    resume: '계속하기',
    restart: '다시 시작',
  },

  a11y: {
    canvas: '사람 매칭 액션 게임 화면',
    mute: '소리 끄기',
    unmute: '소리 켜기',
    levelup: '레벨 업 능력 선택',
    pause: '일시정지',
    resume: '계속하기',
  },
} as const
