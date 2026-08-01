import type { Locale } from '@sobok/domain/locale'
import type { GuardianRarity, GuardianReportSlot } from '../../worker/guardian/manifest'

export type GuardianPreviewTone = 'comfort' | 'honesty' | 'action' | 'possibility'
export type GuardianPreviewMovement = 'start' | 'continue' | 'recover' | 'release'

type PreviewQuestion<OptionId extends string> = {
  label: string
  prompt: string
  supportingText: string
  options: readonly { id: OptionId; label: string }[]
}

type GuardianReportUiContent = {
  published: boolean
  meta: {
    title: string
    description: string
  }
  home: {
    eyebrow: string
    title: string
    body: string
    badges: readonly string[]
    sampleLabel: string
    cta: string
  }
  landing: {
    back: string
    hero: {
      eyebrow: string
      title: string
      body: string
      cta: string
      secondaryCta: string
      sampleLabel: string
      trustItems: readonly string[]
    }
    product: {
      eyebrow: string
      title: string
      body: string
      items: readonly { glyph: string; title: string; body: string }[]
    }
    process: {
      eyebrow: string
      title: string
      steps: readonly { number: string; title: string; body: string }[]
    }
    quiz: {
      eyebrow: string
      title: string
      body: string
      tone: PreviewQuestion<GuardianPreviewTone>
      movement: PreviewQuestion<GuardianPreviewMovement>
      position: (current: number, total: number) => string
      next: string
      result: string
    }
    preview: {
      eyebrow: string
      title: string
      body: string
      slots: Record<GuardianReportSlot, { label: string; glyph: string }>
      toneLines: Record<GuardianPreviewTone, string>
      movementLines: Record<GuardianPreviewMovement, string>
      sealedLabel: string
      lockedEyebrow: string
      lockedTitle: string
      lockedItems: readonly { title: string; preview: string }[]
      unlock: string
      chartRequiredTitle: string
      chartRequiredBody: string
      chartRequiredCta: string
      chartLoading: string
    }
    purchase: {
      eyebrow: string
      title: string
      body: string
      includes: readonly string[]
      priceLoading: string
      priceSuffix: string
      cta: string
      oddsTitle: string
      rarityLabels: Record<GuardianRarity, string>
      guarantee: (interval: number) => string
      guaranteeInitial: string
    }
    checkout: {
      title: string
      body: string
      emailLabel: string
      emailPlaceholder: string
      emailHint: string
      securityHint: string
      submit: string
      submitting: string
      close: string
    }
    resume: {
      eyebrow: string
      title: string
      body: string
      reportCta: string
      paymentCta: string
    }
    faq: {
      eyebrow: string
      title: string
      items: readonly { question: string; answer: string }[]
    }
    errors: {
      answerRequired: string
      chartUnavailable: string
      storage: string
      turnstile: string
      rateLimited: string
      serviceUnavailable: string
      genericCheckout: string
      paymentInterrupted: string
    }
  }
  paid: {
    meta: {
      title: string
      description: string
    }
    missing: {
      title: string
      body: string
      cta: string
    }
    status: {
      verifyingTitle: string
      verifyingBody: string
      pendingTitle: string
      pendingBody: string
      retry: string
      returnToPreview: string
      fulfillingTitle: string
      fulfillingBody: string
      terminalBody: string
      terminalTitles: Record<'failed' | 'cancelled' | 'refunded', string>
      errorTitle: string
      retryLoad: string
      forget: string
    }
    questionnaire: {
      slotLabels: Record<GuardianReportSlot, string>
      core: string
      adaptive: string
      notePhase: string
      position: (current: number, maximum: number) => string
      milestonePosition: (answered: number) => string
      optional: string
      range: (minimum: number, maximum: number) => string
      promptEyebrow: string
      noteEyebrow: string
      notePlaceholder: string
      noteLength: (current: number, maximum: number) => string
      noteSubmit: string
      noteSubmitWithText: string
      noteSubmitting: string
      autosave: string
    }
    reveal: {
      eyebrow: string
      title: string
      body: string
      tap: string
      next: string
      read: string
      skip: string
      signatureRarity: string
      rarityLabels: Record<GuardianRarity, string>
    }
    report: {
      cardsLabel: string
      mapEyebrow: string
      mapTitle: string
      mapBody: string
      chartClues: string
      guidance: string
      reflection: string
      placementsEyebrow: string
      placementsTitle: string
      placementsBody: string
      actionEyebrow: string
      actionTitle: string
      closingGlyph: string
    }
    errors: {
      paymentRequired: string
      reportUnavailable: string
      serviceUnavailable: string
      genericReport: string
      questionConflict: string
      invalidAnswer: string
      genericAnswer: string
      milestoneConflict: string
    }
  }
}

const KO_CONTENT: GuardianReportUiContent = {
  published: true,
  meta: {
    title: '별자리 수호령 전체 리포트',
    description: '출생 차트와 답변을 바탕으로 네 장의 수호령 카드와 사랑·일·자기이해·결정 리포트를 받아보세요.',
  },
  home: {
    eyebrow: 'STELLA GUARDIAN REPORT',
    title: '네 별을 닮은 수호령이 기다리고 있어요',
    body: '두 가지 무료 질문으로 지금 필요한 이야기와 네 장의 카드를 미리 만나보세요.',
    badges: ['무료 미리보기', '수호령 카드 4장', '개인화 전체 리포트'],
    sampleLabel: '카드 예시',
    cta: '내 수호령 무료로 만나기',
  },
  landing: {
    back: '무료 출생 차트로 돌아가기',
    hero: {
      eyebrow: 'STELLA PREMIUM READING',
      title: '별이 고른 네 장으로\n지금의 나를 깊이 읽어요',
      body: '출생 차트와 마음의 답을 함께 읽어 자기이해·사랑·일·결정에 관한 소장용 카드와 한 편의 리포트를 만들어요.',
      cta: '2문항 무료 미리보기',
      secondaryCta: '무엇을 받는지 먼저 보기',
      sampleLabel: '실제 카드 예시',
      trustItems: ['회원가입 없이 시작', '결제 전 무료 결과 확인', '결제 후 답변 자동 저장'],
    },
    product: {
      eyebrow: 'WHAT YOU RECEIVE',
      title: '짧은 운세가 아니라, 나를 위해 완성되는 한 편의 이야기',
      body: '같은 별자리라도 출생 차트와 답변의 흐름에 따라 카드와 본문의 초점이 달라져요.',
      items: [
        {
          glyph: '✦',
          title: '소장용 수호령 카드 4장',
          body: '자기이해·사랑·일·결정을 상징하는 3:4 일러스트 카드가 한 장씩 찾아와요.',
        },
        {
          glyph: '☾',
          title: '16~20문항 개인화',
          body: '핵심 12문항 뒤 답변에 맞는 질문만 이어져 불필요하게 길지 않아요.',
        },
        {
          glyph: '◇',
          title: '연결해서 읽는 전체 리포트',
          body: '네 주제를 따로 설명하는 데 그치지 않고 반복되는 마음의 패턴과 다음 행동을 함께 정리해요.',
        },
        {
          glyph: '♡',
          title: '희귀도가 있는 사랑 카드',
          body: '사랑 카드에는 오비트부터 스텔라까지 네 희귀도 중 하나가 정해져요.',
        },
      ],
    },
    process: {
      eyebrow: 'HOW IT WORKS',
      title: '무료로 먼저 확인하고, 원할 때만 더 깊이',
      steps: [
        { number: '01', title: '두 가지 마음 질문', body: '지금 듣고 싶은 목소리와 향하고 싶은 방향을 골라요.' },
        {
          number: '02',
          title: '무료 결과와 잠긴 미리보기',
          body: '개인화 한 줄과 전체 리포트의 구성을 먼저 확인해요.',
        },
        { number: '03', title: '결제 후 맞춤 질문', body: '핵심 12문항과 답변에 따라 이어지는 4~8문항에 답해요.' },
        {
          number: '04',
          title: '카드 공개와 전체 리포트',
          body: '네 장을 차례로 열고 시각 자료와 풍부한 본문을 읽어요.',
        },
      ],
    },
    quiz: {
      eyebrow: 'FREE PREVIEW',
      title: '지금의 마음부터 가볍게 알려주세요',
      body: '정답은 없어요. 가장 먼저 눈에 들어오는 답을 고르면 돼요.',
      tone: {
        label: '듣고 싶은 목소리',
        prompt: '지금 수호령에게 어떤 이야기를 듣고 싶나요?',
        supportingText: '결과 문장의 온도와 조언 방식을 정하는 답이에요.',
        options: [
          { id: 'comfort', label: '다정한 위로' },
          { id: 'honesty', label: '솔직한 통찰' },
          { id: 'action', label: '구체적인 행동' },
          { id: 'possibility', label: '새로운 가능성' },
        ],
      },
      movement: {
        label: '지금의 방향',
        prompt: '지금 마음은 어느 쪽으로 움직이고 있나요?',
        supportingText: '전체 리포트가 집중할 변화의 방향을 정하는 답이에요.',
        options: [
          { id: 'start', label: '새로 시작하고 싶어요' },
          { id: 'continue', label: '지금의 흐름을 이어가고 싶어요' },
          { id: 'recover', label: '흔들린 마음을 회복하고 싶어요' },
          { id: 'release', label: '놓아야 할 것을 알고 싶어요' },
        ],
      },
      position: (current, total) => `${current} / ${total}`,
      next: '다음 질문',
      result: '무료 결과 보기',
    },
    preview: {
      eyebrow: 'YOUR FREE PREVIEW',
      title: '지금 네 수호령이 먼저 건넨 말',
      body: '이 한 줄은 무료 답변만 반영한 미리보기예요. 카드와 전체 본문은 더 깊은 답변이 모두 모인 뒤 정해져요.',
      slots: {
        self: { label: '자기이해', glyph: '☾' },
        love: { label: '사랑', glyph: '♡' },
        work: { label: '일', glyph: '✦' },
        choice: { label: '결정', glyph: '◇' },
      },
      toneLines: {
        comfort: '지금의 마음을 다그치지 않아도 괜찮아요.',
        honesty: '이미 알고 있지만 미뤄 둔 마음이 한 가지 보여요.',
        action: '작은 행동 하나가 흐름을 바꿀 때예요.',
        possibility: '아직 이름 붙이지 않은 가능성이 가까이 있어요.',
      },
      movementLines: {
        start: '새 출발은 완벽한 확신보다 작은 첫걸음에서 열려요.',
        continue: '지금 쌓아 온 흐름을 믿고 한 걸음만 더 이어가 보세요.',
        recover: '회복은 멈춤이 아니라 내 리듬을 다시 찾는 과정이에요.',
        release: '놓아준 자리에 내게 맞는 다음 장면이 들어올 거예요.',
      },
      sealedLabel: '결제 후 공개',
      lockedEyebrow: 'LOCKED REPORT',
      lockedTitle: '전체 리포트에 이어질 이야기',
      lockedItems: [
        { title: '나를 지키는 방식', preview: '감정이 흔들릴 때 반복되는 반응과 회복의 조건…' },
        { title: '사랑이 움직이는 속도', preview: '다가감과 기다림 사이에서 관계가 필요로 하는 여백…' },
        { title: '일의 리듬과 압박', preview: '성취를 만드는 힘과 에너지를 소모시키는 마찰…' },
        { title: '결정을 막는 진짜 조건', preview: '비교가 길어지는 이유와 책임지고 싶은 선택의 방향…' },
      ],
      unlock: '네 장과 전체 이야기 열기',
      chartRequiredTitle: '먼저 무료 출생 차트를 만들어주세요',
      chartRequiredBody:
        '수호령 리포트는 출생 차트를 함께 읽어요. 차트를 만든 뒤 이 페이지로 돌아오면 무료 답변은 이 탭에 그대로 남아 있어요.',
      chartRequiredCta: '무료 출생 차트 만들기',
      chartLoading: '출생 차트의 별빛을 읽고 있어요…',
    },
    purchase: {
      eyebrow: 'FULL REPORT',
      title: '네 답이 모두 모인 뒤에만 정해지는 카드',
      body: '결제 직후 카드를 무작위로 보여주지 않아요. 핵심 질문과 맞춤 질문을 모두 마친 뒤 출생 차트와 답변을 함께 읽어 카드와 본문을 완성해요.',
      includes: ['수호령 카드 4장', '개인화 질문 16~20개', '네 주제 상세 본문', '시각 요약과 행동 문장'],
      priceLoading: '가격 확인 중',
      priceSuffix: '한 번 결제',
      cta: '전체 리포트 시작하기',
      oddsTitle: '사랑 카드 희귀도 확률',
      rarityLabels: { orbit: '오비트', nebula: '네뷸라', eclipse: '이클립스', stella: '스텔라' },
      guarantee: (interval) => `사랑 카드 유료 재추첨 ${interval}회마다 미보유 카드 1장 보장`,
      guaranteeInitial: '첫 전체 리포트의 사랑 카드는 재추첨 보장 횟수에 포함되지 않아요.',
    },
    checkout: {
      title: '리포트를 다시 찾을 이메일',
      body: '결제 영수증과 재열람 링크를 받을 주소예요. Stella 계정을 만드는 단계는 아니에요.',
      emailLabel: '복구 이메일',
      emailPlaceholder: 'you@example.com',
      emailHint: '오타가 있으면 리포트를 다시 찾기 어려워요.',
      securityHint: '안전한 결제를 위해 보안 확인을 완료해주세요.',
      submit: '결제하고 맞춤 질문 시작하기',
      submitting: '결제창을 준비하고 있어요…',
      close: '이전으로',
    },
    resume: {
      eyebrow: 'CONTINUE',
      title: '이 브라우저에 이어볼 리포트가 있어요',
      body: '결제 결과를 확인하거나 중단했던 결제를 다시 열 수 있어요.',
      reportCta: '결제 결과·리포트 확인',
      paymentCta: '결제 다시 열기',
    },
    faq: {
      eyebrow: 'BEFORE YOU BEGIN',
      title: '시작하기 전에 궁금한 점',
      items: [
        {
          question: '무료 결과와 유료 결과는 무엇이 다른가요?',
          answer:
            '무료 결과는 두 답을 반영한 한 줄과 잠긴 구성을 보여줘요. 유료 결과는 출생 차트와 16~20개 답을 바탕으로 네 장의 카드, 상세 본문, 연결 요약과 행동 문장을 완성해요.',
        },
        {
          question: '질문이 왜 사람마다 다른가요?',
          answer: '첫 12문항은 모두 같고, 이후에는 앞선 답에서 더 살펴볼 필요가 있는 주제만 4~8문항으로 이어져요.',
        },
        {
          question: '결제 후 중간에 나가도 되나요?',
          answer: '답변은 한 문항씩 저장돼요. 같은 브라우저와 탭에서는 다시 돌아와 이어서 답할 수 있어요.',
        },
      ],
    },
    errors: {
      answerRequired: '두 가지 무료 질문에 먼저 답해주세요.',
      chartUnavailable: '출생 차트를 다시 계산한 뒤 시도해주세요.',
      storage:
        '이 브라우저에서는 안전한 이어보기를 저장할 수 없어요. 브라우저 저장 공간을 허용한 뒤 다시 시도해주세요.',
      turnstile: '보안 확인 시간이 지났어요. 다시 확인한 뒤 결제를 눌러주세요.',
      rateLimited: '잠시 요청이 많아요. 조금 뒤 다시 시도해주세요.',
      serviceUnavailable: '결제 준비가 잠시 지연되고 있어요. 조금 뒤 다시 시도해주세요.',
      genericCheckout: '결제창을 준비하지 못했어요. 잠시 뒤 다시 시도해주세요.',
      paymentInterrupted: '결제가 완료되지 않았어요. 원할 때 다시 시도할 수 있어요.',
    },
  },
  paid: {
    meta: {
      title: '내 별자리 수호령 리포트',
      description: '결제한 별자리 수호령 리포트의 맞춤 질문에 답하고 네 장의 카드를 확인하세요.',
    },
    missing: {
      title: '이어볼 리포트가 없어요',
      body: '무료 미리보기와 결제를 시작한 브라우저에서 다시 열거나, 상품 페이지에서 새 리포트를 시작해주세요.',
      cta: '무료 미리보기로 이동',
    },
    status: {
      verifyingTitle: '결제 결과를 확인하고 있어요',
      verifyingBody: '결제를 다시 시도하지 않아도 돼요. 서버에서 승인 상태를 확인하고 있습니다.',
      pendingTitle: '아직 결제 완료를 기다리고 있어요',
      pendingBody: '결제를 마쳤다면 잠시 후 다시 확인해주세요. 결제창을 닫았다면 무료 결과에서 다시 열 수 있어요.',
      retry: '결제 상태 다시 확인',
      returnToPreview: '무료 결과로 돌아가기',
      fulfillingTitle: '네 수호령이 카드를 고르고 있어요',
      fulfillingBody: '출생 차트와 답변을 한데 모아 마지막 이야기를 만들고 있습니다.',
      terminalBody: '상품 페이지에서 새 리포트를 시작할 수 있어요. 기존 결제는 중복 승인되지 않습니다.',
      terminalTitles: {
        failed: '결제가 승인되지 않았어요',
        cancelled: '결제가 취소되었어요',
        refunded: '환불된 결제예요',
      },
      errorTitle: '리포트를 불러오지 못했어요',
      retryLoad: '다시 확인하기',
      forget: '이 브라우저의 이어보기 기록 지우기',
    },
    questionnaire: {
      slotLabels: { self: '나', love: '사랑', work: '일', choice: '선택' },
      core: '핵심 질문',
      adaptive: '맞춤 질문',
      notePhase: '마지막 · 선택 메모',
      position: (current, maximum) => `${current} / 최대 ${maximum}`,
      milestonePosition: (answered) => `핵심 ${answered}문항 완료`,
      optional: '선택 사항',
      range: (minimum, maximum) => `답변에 따라 최소 ${minimum}개, 최대 ${maximum}개의 질문을 받아요.`,
      promptEyebrow: '수호령이 묻고 있어요',
      noteEyebrow: '마지막으로 남기고 싶은 말',
      notePlaceholder: '비워두어도 괜찮아요.',
      noteLength: (current, maximum) => `${current} / ${maximum}`,
      noteSubmit: '메모 없이 리포트 만들기',
      noteSubmitWithText: '이 마음까지 담아 리포트 만들기',
      noteSubmitting: '리포트를 만들고 있어요…',
      autosave: '답변은 바로 저장돼요. 새로고침하거나 다른 페이지를 다녀와도 이 탭에서 이어볼 수 있어요.',
    },
    reveal: {
      eyebrow: 'YOUR GUARDIANS',
      title: '네 답을 따라 찾아온 수호령',
      body: '카드를 한 장씩 눌러 지금의 이야기를 만나보세요.',
      tap: '카드를 눌러 공개하기',
      next: '다음 카드 만나기',
      read: '네 장의 전체 리포트 읽기',
      skip: '공개를 건너뛰고 리포트 읽기',
      signatureRarity: '시그니처',
      rarityLabels: { orbit: '오비트', nebula: '네뷸라', eclipse: '이클립스', stella: '스텔라' },
    },
    report: {
      cardsLabel: '선택된 수호령 카드',
      mapEyebrow: 'FOUR THEMES, ONE STORY',
      mapTitle: '네 주제가 이어지는 지도',
      mapBody: '각 카드의 한 줄은 따로 떨어진 답이 아니라 같은 마음이 다른 장면에서 드러난 모습이에요.',
      chartClues: '출생 차트가 들려주는 단서',
      guidance: '지금 가져갈 방향',
      reflection: '마음에 남길 문장',
      placementsEyebrow: 'REPEATED CLUES',
      placementsTitle: '리포트를 서로 잇는 별의 단서',
      placementsBody: '네 주제에 등장한 주요 배치예요. 여러 주제에서 다시 나타난 단서는 횟수와 함께 표시했어요.',
      actionEyebrow: 'KEEP THESE CLOSE',
      actionTitle: '오늘부터 곁에 둘 네 문장',
      closingGlyph: '✦',
    },
    errors: {
      paymentRequired: '결제 승인이 아직 리포트에 반영되지 않았어요. 잠시 후 다시 확인해주세요.',
      reportUnavailable: '이 브라우저에서 리포트 이어보기 정보를 찾지 못했어요.',
      serviceUnavailable: '결제 서버와 연결이 잠시 지연되고 있어요. 조금 뒤 다시 확인해주세요.',
      genericReport: '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
      questionConflict: '다른 탭에서 진행 상태가 먼저 바뀌었어요. 최신 질문을 다시 불러왔습니다.',
      invalidAnswer: '이 답변을 저장할 수 없어요. 다른 선택지를 골라주세요.',
      genericAnswer: '답변을 저장하지 못했어요. 잠시 후 다시 눌러주세요.',
      milestoneConflict: '중간 결과의 진행 상태가 바뀌었어요. 최신 질문을 다시 불러와 이어갈게요.',
    },
  },
}

function emptyContent(): GuardianReportUiContent {
  const empty = ''
  const emptySlot = { label: empty, glyph: empty }
  const emptyQuestion = {
    label: empty,
    prompt: empty,
    supportingText: empty,
    options: [],
  }

  return {
    published: false,
    meta: { title: empty, description: empty },
    home: { eyebrow: empty, title: empty, body: empty, badges: [], sampleLabel: empty, cta: empty },
    landing: {
      back: empty,
      hero: {
        eyebrow: empty,
        title: empty,
        body: empty,
        cta: empty,
        secondaryCta: empty,
        sampleLabel: empty,
        trustItems: [],
      },
      product: { eyebrow: empty, title: empty, body: empty, items: [] },
      process: { eyebrow: empty, title: empty, steps: [] },
      quiz: {
        eyebrow: empty,
        title: empty,
        body: empty,
        tone: emptyQuestion,
        movement: emptyQuestion,
        position: () => empty,
        next: empty,
        result: empty,
      },
      preview: {
        eyebrow: empty,
        title: empty,
        body: empty,
        slots: { self: emptySlot, love: emptySlot, work: emptySlot, choice: emptySlot },
        toneLines: { comfort: empty, honesty: empty, action: empty, possibility: empty },
        movementLines: { start: empty, continue: empty, recover: empty, release: empty },
        sealedLabel: empty,
        lockedEyebrow: empty,
        lockedTitle: empty,
        lockedItems: [],
        unlock: empty,
        chartRequiredTitle: empty,
        chartRequiredBody: empty,
        chartRequiredCta: empty,
        chartLoading: empty,
      },
      purchase: {
        eyebrow: empty,
        title: empty,
        body: empty,
        includes: [],
        priceLoading: empty,
        priceSuffix: empty,
        cta: empty,
        oddsTitle: empty,
        rarityLabels: { orbit: empty, nebula: empty, eclipse: empty, stella: empty },
        guarantee: () => empty,
        guaranteeInitial: empty,
      },
      checkout: {
        title: empty,
        body: empty,
        emailLabel: empty,
        emailPlaceholder: empty,
        emailHint: empty,
        securityHint: empty,
        submit: empty,
        submitting: empty,
        close: empty,
      },
      resume: { eyebrow: empty, title: empty, body: empty, reportCta: empty, paymentCta: empty },
      faq: { eyebrow: empty, title: empty, items: [] },
      errors: {
        answerRequired: empty,
        chartUnavailable: empty,
        storage: empty,
        turnstile: empty,
        rateLimited: empty,
        serviceUnavailable: empty,
        genericCheckout: empty,
        paymentInterrupted: empty,
      },
    },
    paid: {
      meta: { title: empty, description: empty },
      missing: { title: empty, body: empty, cta: empty },
      status: {
        verifyingTitle: empty,
        verifyingBody: empty,
        pendingTitle: empty,
        pendingBody: empty,
        retry: empty,
        returnToPreview: empty,
        fulfillingTitle: empty,
        fulfillingBody: empty,
        terminalBody: empty,
        terminalTitles: { failed: empty, cancelled: empty, refunded: empty },
        errorTitle: empty,
        retryLoad: empty,
        forget: empty,
      },
      questionnaire: {
        slotLabels: { self: empty, love: empty, work: empty, choice: empty },
        core: empty,
        adaptive: empty,
        notePhase: empty,
        position: () => empty,
        milestonePosition: () => empty,
        optional: empty,
        range: () => empty,
        promptEyebrow: empty,
        noteEyebrow: empty,
        notePlaceholder: empty,
        noteLength: () => empty,
        noteSubmit: empty,
        noteSubmitWithText: empty,
        noteSubmitting: empty,
        autosave: empty,
      },
      reveal: {
        eyebrow: empty,
        title: empty,
        body: empty,
        tap: empty,
        next: empty,
        read: empty,
        skip: empty,
        signatureRarity: empty,
        rarityLabels: { orbit: empty, nebula: empty, eclipse: empty, stella: empty },
      },
      report: {
        cardsLabel: empty,
        mapEyebrow: empty,
        mapTitle: empty,
        mapBody: empty,
        chartClues: empty,
        guidance: empty,
        reflection: empty,
        placementsEyebrow: empty,
        placementsTitle: empty,
        placementsBody: empty,
        actionEyebrow: empty,
        actionTitle: empty,
        closingGlyph: empty,
      },
      errors: {
        paymentRequired: empty,
        reportUnavailable: empty,
        serviceUnavailable: empty,
        genericReport: empty,
        questionConflict: empty,
        invalidAnswer: empty,
        genericAnswer: empty,
        milestoneConflict: empty,
      },
    },
  }
}

export const GUARDIAN_REPORT_UI = {
  ko: KO_CONTENT,
  en: emptyContent(),
  ja: emptyContent(),
  zh: emptyContent(),
} as const satisfies Record<Locale, GuardianReportUiContent>

export type GuardianReportHomeContent = GuardianReportUiContent['home']
export type GuardianReportLandingContent = GuardianReportUiContent['landing']
export type GuardianReportPaidContent = GuardianReportUiContent['paid']
