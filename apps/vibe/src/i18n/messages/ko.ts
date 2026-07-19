import type { Messages } from './types'

export const ko = {
  Common: {
    localeSwitcher: '언어 선택',
    meta: {
      title: '커플 케미 테스트',
      description: '결지수 테스트와 대화 유형 테스트로 커플 케미를 확인해보세요.',
    },
    home: {
      heroTitle: '우리 사이의 케미, 2분이면 확인해요',
      heroSubtitle: '짧은 질문에 답하면 커플의 결지수와 대화 유형을 바로 보여드려요.',
      gyeolCard: {
        title: '결지수 테스트',
        description: '16문항으로 애정 온도와 관계 균형을 읽고 등급을 매겨요.',
        cta: '결지수 확인하기',
      },
      typeCard: {
        title: '대화 유형 테스트',
        description: '대화 속도와 표현 방식을 조합해 우리 커플의 유형을 찾아요.',
        cta: '대화 유형 확인하기',
      },
      deepTypeCard: {
        title: '겉속유형',
        description: '겉으로 보이는 나와 혼자일 때의 나, 그 간극을 40문항으로 파고들어요.',
        cta: '겉속유형 확인하기',
      },
    },
  },
} satisfies Messages
