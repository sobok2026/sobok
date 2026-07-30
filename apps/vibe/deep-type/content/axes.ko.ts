import type { AxisId } from '../model'
import type { AxisContent } from './axis-content'

// The eight axis names, pole labels, pole meanings and reflection prompts for ko.
//
// This sits in deep-type/ rather than under src/ because BOTH programs read it: the result screen renders the
// axis bars from it and the paid rule engine narrates bands with it. It used to live in the route's _content
// module, which meant worker/report reached across into src/app/[locale]/… — an App Router private folder — to
// build a report. One table, one place, and the report can no longer call an axis something the screen above it
// does not.
export const koAxisContent = {
  EI: {
    name: '에너지 방향',
    description: '사람과 주고받을 때 힘이 붙는 쪽과 혼자 정리할 때 힘이 붙는 쪽을 봐요.',
    first: {
      label: '밖으로 꺼내기',
      description: '말하고 부딪히면서 생각이 자리를 잡는 편',
      reflection: '말로 꺼내야 풀리는 일과 혼자 봐야 풀리는 일을 나눠 봐요.',
    },
    second: {
      label: '안에서 고르기',
      description: '혼자 정리한 뒤에 꺼낼 때 말이 단단해지는 편',
      reflection: '혼자 보내는 시간이 회복인지 미루기인지 그날 기준으로 살펴봐요.',
    },
  },
  SN: {
    name: '정보 초점',
    description: '확인된 사실부터 보는 쪽과 연결과 가능성부터 보는 쪽을 봐요.',
    first: {
      label: '사실·적용',
      description: '지금 확인할 수 있는 것부터 짚는 편',
      reflection: '사실을 충분히 모았는지와 큰 그림을 놓치지 않았는지 같이 확인해 봐요.',
    },
    second: {
      label: '연결·가능성',
      description: '숨은 연결과 다음 수를 먼저 보는 편',
      reflection: '떠오른 가능성 중 이번 주에 확인할 하나를 골라 봐요.',
    },
  },
  TF: {
    name: '판단 기준',
    description: '기준의 일관성을 먼저 보는 쪽과 사람에게 갈 영향을 먼저 보는 쪽을 봐요.',
    first: {
      label: '기준·정합성',
      description: '같은 기준으로 설명되는지 먼저 보는 편',
      reflection: '기준이 맞는지와 그 결정이 사람에게 남길 자국을 같이 적어 봐요.',
    },
    second: {
      label: '사람·영향',
      description: '맥락과 사람에게 갈 영향을 먼저 보는 편',
      reflection: '배려하려는 마음과 지키고 싶은 기준을 한 문장씩 적어 봐요.',
    },
  },
  JP: {
    name: '실행 방식',
    description: '먼저 정하고 움직이는 쪽과 열어 두고 맞추는 쪽을 봐요.',
    first: {
      label: '구조·마감',
      description: '순서와 기한을 정해 흔들림을 줄이는 편',
      reflection: '계획이 통제감을 주는지 새 정보를 막는지 살펴봐요.',
    },
    second: {
      label: '유연·탐색',
      description: '선택지를 열어 두고 상황에 맞추는 편',
      reflection: '열어 둘 선택과 오늘 닫을 선택을 하나씩 정해 봐요.',
    },
  },
  RM: {
    name: '인정의 자리',
    description: '내 기준으로 값을 매기는 쪽과 남의 반응에 값이 따라 움직이는 쪽을 봐요.',
    first: {
      label: '내 기준',
      description: '피드백을 참고하되 내 판단을 들고 가는 편',
      reflection: '바깥 피드백을 놓치지 않으면서 내가 지키는 기준을 확인해 봐요.',
    },
    second: {
      label: '반응 살피기',
      description: '인정과 반응의 온도에 힘이 따라 움직이는 편',
      reflection: '지금 필요한 게 정보인지 인정인지 이름을 붙여 봐요.',
    },
  },
  OA: {
    name: '조율의 폭',
    description: '먼저 맞추고 움직이는 쪽과 내 범위를 잡고 움직이는 쪽을 봐요.',
    first: {
      label: '맞추고 가기',
      description: '움직이기 전에 관계된 사람과 먼저 맞추는 편',
      reflection: '어디까지 맞추면 충분한지 상대에게 말해 봐요.',
    },
    second: {
      label: '정하고 가기',
      description: '내 범위 안에서 정한 뒤에 알리는 편',
      reflection: '혼자 정할 범위와 미리 알릴 범위를 나눠 봐요.',
    },
  },
  VH: {
    name: '감정 처리',
    description: '말하면서 정리되는 쪽과 안에서 정리한 뒤 꺼내는 쪽을 봐요.',
    first: {
      label: '말하며 정리',
      description: '믿는 사람에게 말할 때 감정의 이름이 잡히는 편',
      reflection: '지금 필요한 게 해결인지 공감인지 먼저 알려 봐요.',
    },
    second: {
      label: '안에서 정리',
      description: '혼자 이해할 시간을 가진 뒤 꺼내는 편',
      reflection: '시간을 달라고 말하면서 다시 이야기할 때도 같이 정해 봐요.',
    },
  },
  UO: {
    name: '목표 초점',
    description: '얻을 것을 먼저 보는 쪽과 잃지 않을 것을 먼저 보는 쪽을 봐요.',
    first: {
      label: '성장 초점',
      description: '새 기회와 원하는 변화가 먼저 몸을 움직이는 편',
      reflection: '기대하는 것과 감당할 수 있는 손실을 같이 적어 봐요.',
    },
    second: {
      label: '보존 초점',
      description: '위험을 줄이고 가진 것을 지키는 쪽이 먼저 움직이는 편',
      reflection: '지킬 것과 시험해 볼 작은 범위를 따로 정해 봐요.',
    },
  },
} as const satisfies Record<AxisId, AxisContent>
