// Provenance and the `action` contract: see work-labels.free.ts.

// RIASEC interest facets.
export const INTEREST_LABELS = {
  MAKE: { action: '손으로 시험하고 결과를 바꾸는 선택', name: '직접 만들고 고치는 일' },
  ANALYZE: { action: '원인과 빠진 정보를 먼저 찾는 선택', name: '이유와 원인을 찾는 일' },
  CREATE: { action: '없던 글, 화면, 모양을 만드는 선택', name: '새로운 글과 모습을 만드는 일' },
  HELP: { action: '도움이 필요한 사람부터 살피는 선택', name: '막힌 사람을 돕는 일' },
  LEAD: { action: '다음 행동과 맡을 사람을 정하는 선택', name: '사람과 일을 움직이는 일' },
  ORDER: { action: '빠진 순서와 준비물을 먼저 적는 선택', name: '순서와 기준을 세우는 일' },
} as const

// SDT need facets.
export const NEED_LABELS = {
  AUT: { action: '순서와 방법을 고를 수 있는지 확인하는 선택', name: '방법을 직접 고를 수 있음' },
  MASTER: { action: '새로 배울 부분부터 찾는 선택', name: '배우고 나아지는 느낌' },
  IMPACT: { action: '결과를 누가 쓰는지 확인하는 선택', name: '내 결과가 어디에 쓰이는지 확인함' },
  BELONG: { action: '같이 맞출 사람을 먼저 찾는 선택', name: '믿는 사람과 함께함' },
  STABLE: { action: '일정과 생활 리듬부터 다시 잡는 선택', name: '앞으로의 일정을 알 수 있는 생활' },
  NOVEL: { action: '안 써본 방법을 하나 넣어보는 선택', name: '새 문제와 다른 방법' },
} as const

// Meaning facets. The origin's `scene` variant (:4911) is not ported: its only caller (:5189) sits inside a
// scrTeaser wrapper that :6572 and :11663 each replaced outright, so no `scene` string ever reached the DOM.
export const PURPOSE_LABELS = {
  SOLVE: { action: '막힌 부분을 직접 고치는 선택', name: '막힌 문제를 풀어 결과를 바꿀 때' },
  UNDERSTAND: { action: '왜 문제가 생겼는지 적어두는 선택', name: '복잡한 이유를 끝까지 알아낼 때' },
  EXPRESS: { action: '글, 화면, 모양을 새로 만드는 선택', name: '생각을 글이나 그림으로 만들 때' },
  CARE: { action: '힘든 사람이 괜찮은지 살피는 선택', name: '힘든 사람을 도와 다시 움직이게 할 때' },
  MOVE: { action: '다음 일을 시작하게 만드는 선택', name: '사람과 일을 앞으로 움직이게 할 때' },
  STEADY: { action: '정한 방식이 계속 지켜지는지 보는 선택', name: '정한 기준을 꾸준히 지킬 때' },
} as const

// Sustaining-environment facets.
export const ENVIRONMENT_LABELS = {
  FOCUS_ENV: { action: '방해 없이 할 시간을 먼저 잡는 선택', name: '한 가지에 오래 집중할 시간' },
  TOGETHER_ENV: { action: '함께 맞출 사람을 가까이 두는 선택', name: '믿는 사람과 바로 이야기할 수 있음' },
  FREEDOM_ENV: { action: '내가 일하는 순서를 정하는 선택', name: '순서와 방법을 직접 고를 수 있음' },
  CLEAR_ENV: { action: '해야 할 일과 끝을 먼저 확인하는 선택', name: '역할과 끝나는 기준이 분명함' },
  VARIETY_ENV: { action: '처음 해보는 부분을 먼저 찾는 선택', name: '새로운 문제나 역할을 만나는 일' },
  VISIBLE_ENV: { action: '결과가 쓰이는 사람과 날을 확인하는 선택', name: '내 일이 만든 결과를 직접 볼 수 있음' },
} as const
