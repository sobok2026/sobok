import type { Locale } from '@sobok/domain/locale'
import type { ElementId } from '@/chart/types'
import type { GuardianRarity, GuardianReportSlot } from '../../worker/guardian/manifest'

export type GuardianPreviewTone = 'comfort' | 'honesty' | 'action' | 'possibility'
export type GuardianPreviewMovement = 'start' | 'continue' | 'recover' | 'release'

type PreviewQuestion<OptionId extends string> = {
  header: {
    title: string
    body: string
  }
  label: string
  prompt: string
  supportingText: string
  options: readonly { id: OptionId; label: string }[]
}

type FreeResultInsight = {
  label: string
  title: string
  body: string
}

/**
 * Sections carry a standfirst only where it says something the section's own contents do not. Where a chart,
 * a matrix or a labelled figure already answers "what am I looking at", the paragraph under the heading was
 * just a third block of grey text before the reader reached anything — so those sections omit it.
 */
type GuardianFreeResultContent = {
  hero: {
    eyebrow: string
    title: string
    body: string
    toneLines: Record<GuardianPreviewTone, string>
    movementLines: Record<GuardianPreviewMovement, string>
  }
  reading: {
    eyebrow: string
    title: string
    toneLabel: string
    movementLabel: string
    /** Axis captions and the "1 of 16" line for the combination matrix. */
    matrixToneAxis: string
    matrixMovementAxis: string
    matrixCaption: (total: number) => string
    toneInsights: Record<GuardianPreviewTone, FreeResultInsight>
    movementInsights: Record<GuardianPreviewMovement, FreeResultInsight>
  }
  chart: {
    eyebrow: string
    title: string
    sunLabel: string
    moonLabel: string
    moonRangeLabel: string
    risingLabel: string
    risingUnknown: string
    dominantLabel: string
    balanceLabel: string
    bridge: (movement: string, element: string) => string
    elements: Record<ElementId, FreeResultInsight & { glyph: string }>
  }
  action: {
    eyebrow: string
    title: string
    reflectionLabel: string
    actions: Record<GuardianPreviewMovement, Record<GuardianPreviewTone, string>>
    reflections: Record<GuardianPreviewMovement, string>
  }
  paywall: {
    eyebrow: string
    titles: Record<GuardianPreviewMovement, string>
    body: string
    slots: Record<GuardianReportSlot, { label: string; glyph: string }>
    sealedLabel: string
    sampleLabel: string
    lockedTitle: string
    lockedItems: readonly { title: string; preview: string }[]
    unlock: string
    /** The CTA island has room for a few characters, not for the full sentence. */
    unlockShort: string
    /** Sits beside the price in the island and yields to it when the screen is narrow. */
    unlockNote: string
  }
  states: {
    chartRequiredTitle: string
    chartRequiredBody: string
    chartRequiredCta: string
    chartLoading: string
    missingTitle: string
    missingBody: string
    missingCta: string
  }
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
    navigation: {
      backToLanding: string
      backToFree: string
      reopen: string
    }
    hero: {
      eyebrow: string
      title: string
      body: string
      cta: string
      /** Under the CTA: what the paid step costs, before anyone has to click to find out. */
      offerNote: (price: string) => string
      sampleLabel: string
      trustItems: readonly string[]
    }
    /** The one section that shows the product itself rather than describing it. */
    sample: {
      eyebrow: string
      title: string
      body: string
      caption: string
      section: {
        label: string
        title: string
        guardians: string
        oneLine: string
        chartSummary: string
        placements: readonly string[]
        detail: { title: string; body: string }
        guidance: { title: string; body: string }
        reflection: string
      }
      continues: string
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
      tone: PreviewQuestion<GuardianPreviewTone>
      movement: PreviewQuestion<GuardianPreviewMovement>
      position: (current: number, total: number) => string
      next: string
      result: string
    }
    freeResult: GuardianFreeResultContent
    purchase: {
      eyebrow: string
      title: string
      body: string
      includes: readonly string[]
      priceSuffix: string
      cta: string
      /** 전자상거래법 §13 wants the withdrawal terms readable before the offer is accepted, not only after. */
      refundNote: string
      refundLink: string
    }
    /** Mobile CTA bar, pinned once the hero's own call to action has scrolled away. */
    stickyCta: {
      /** Yields to the price when the screen is narrow, so the number is never the part that clips. */
      note: string
      cta: string
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
      /**
       * 전자상거래법 §8(2) wants the buyer to confirm the order's terms before the contract forms, and §13(2)
       * makes the product name, the price and the withdrawal terms the things that have to be confirmed. So
       * the summary is not decoration — it is the disclosure, and the consents below it are the agreement.
       */
      orderTitle: string
      orderProductLabel: string
      orderPriceLabel: string
      orderDeliveryLabel: string
      orderDeliveryValue: string
      consentTitle: string
      consentAge: string
      consentPrivacy: string
      consentWithdrawal: string
      consentRequired: string
      minorNotice: string
      /** Path segment under the locale root → label, for the documents linked beside the consents. */
      docLinks: readonly { path: 'terms' | 'refund' | 'privacy'; label: string }[]
    }
    resume: {
      eyebrow: string
      title: string
      body: string
      reportCta: string
      paymentCta: string
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
      reopenCta: string
    }
    reopen: {
      metaTitle: string
      metaDescription: string
      eyebrow: string
      title: string
      body: string
      emailLabel: string
      emailPlaceholder: string
      requestCta: string
      requesting: string
      deliveryNote: string
      linkTitle: string
      linkBody: string
      linkCta: string
      opening: string
      acceptedTitle: string
      acceptedBody: string
      invalidTitle: string
      invalidBody: string
      startOverCta: string
      genericError: string
      turnstileError: string
      rateLimitedError: string
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
      accountSave: {
        eyebrow: string
        title: string
        body: string
        reward: string
        signIn: string
        save: string
        saving: string
        savedTitle: string
        savedBody: string
        library: string
        error: string
      }
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
    navigation: {
      backToLanding: '상품 소개로 돌아가기',
      backToFree: '두 질문 다시 고르기',
      reopen: '구매한 리포트 다시 열기',
    },
    hero: {
      eyebrow: 'STELLA PREMIUM READING',
      title: '별이 고른 네 장으로\n지금의 나를 깊이 읽어요',
      body: '출생 차트와 마음의 답을 함께 읽어 자기이해·사랑·일·결정에 관한 소장용 카드와 한 편의 리포트를 만들어요.',
      cta: '2문항 무료로 시작하기',
      offerNote: (price) => `전체 리포트는 ${price} 한 번 결제예요. 무료 결과를 보고 나서 정해도 늦지 않아요.`,
      sampleLabel: '실제 카드 예시',
      trustItems: ['회원가입 없이 시작', '결제 전 무료 결과 확인', '열기 전에는 전액 환불'],
    },
    sample: {
      eyebrow: 'INSIDE THE REPORT',
      title: '리포트는 이렇게 쓰여 있어요',
      body: '네 주제마다 한 장의 카드와 이만큼의 본문이 붙어요. 아래는 자기이해 편의 일부예요.',
      caption: '실제 리포트 화면의 일부',
      section: {
        label: '자기이해',
        title: '회복할 여백',
        guardians: '게자리 수호령 · 달의 결',
        oneLine: '지금은 더 잘해내는 것보다 아무것도 증명하지 않고 쉬는 시간이 너를 다시 반짝이게 해.',
        chartSummary:
          '달이 물의 자리에 놓여 감정의 파도를 먼저 감지하고, 토성이 네 번째 하우스를 지나며 안에서 버티는 힘을 시험하고 있어.',
        placements: ['달 · 게자리', '토성 · 4하우스', '태양 · 12하우스'],
        detail: {
          title: '나를 지키는 방식',
          body: '너는 힘들다는 신호를 밖으로 먼저 보내지 않아. 대신 하던 일의 밀도를 높여서 마음의 소란을 덮어. 그 방식은 짧게는 잘 통하지만 회복의 순서를 계속 뒤로 미뤄. 그래서 무너질 때는 예고 없이 한 번에 무너지는 것처럼 느껴져.',
        },
        guidance: {
          title: '이번 주에 해볼 한 가지',
          body: '하루에 한 번 아무 목적 없는 30분을 정해 두고, 그 시간에는 무엇도 완성하지 않기로 해. 쉬는 시간을 성과로 바꾸지 않는 연습이 지금의 너에게 가장 필요한 훈련이야.',
        },
        reflection: '증명하지 않아도 남아 있는 것이 진짜 내 것이야.',
      },
      continues: '이 아래로 사랑·일·결정 편이 같은 밀도로 이어져요',
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
          body: '지금의 마음을 읽은 작은 리포트와 오늘의 한 걸음을 먼저 받아요.',
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
      tone: {
        header: {
          title: '지금의 마음부터 가볍게 알려주세요',
          body: '정답은 없어요. 가장 먼저 눈에 들어오는 답을 고르면 돼요.',
        },
        label: '듣고 싶은 목소리',
        prompt: '지금 수호령에게 어떤 이야기를 듣고 싶나요?',
        supportingText: '고른 목소리에 맞춰 결과를 들려드릴게요.',
        options: [
          { id: 'comfort', label: '다정한 위로' },
          { id: 'honesty', label: '솔직한 통찰' },
          { id: 'action', label: '구체적인 행동' },
          { id: 'possibility', label: '새로운 가능성' },
        ],
      },
      movement: {
        header: {
          title: '이제 마지막 질문이에요',
          body: '답을 고르면 바로 결과를 보여드릴게요.',
        },
        label: '지금의 방향',
        prompt: '지금 마음은 어느 쪽으로 움직이고 있나요?',
        supportingText: '고른 방향이 결과를 여는 첫 단서가 돼요.',
        options: [
          { id: 'start', label: '새로 시작하고 싶어요' },
          { id: 'continue', label: '지금의 흐름을 이어가고 싶어요' },
          { id: 'recover', label: '흔들린 마음을 회복하고 싶어요' },
          { id: 'release', label: '놓아야 할 것을 알고 싶어요' },
        ],
      },
      position: (current, total) => `${current} / ${total}`,
      next: '다음 질문',
      result: '결과 보기',
    },
    freeResult: {
      hero: {
        eyebrow: 'YOUR FREE READING',
        title: '수호령이 먼저 읽은 지금의 마음',
        body: '두 답에서 지금의 마음과 오늘 해볼 한 걸음을 읽었어요.',
        toneLines: {
          comfort: '지금은 스스로를 다그치는 답보다 마음이 안심할 수 있는 말이 먼저 필요해요.',
          honesty: '지금은 듣기 좋은 답보다 마음속에서 이미 알고 있는 사실을 바로 보는 일이 필요해요.',
          action: '지금은 더 생각하는 것보다 작게라도 움직이며 확인하는 일이 필요해요.',
          possibility: '지금은 하나의 결론보다 아직 열어보지 않은 가능성을 만나는 일이 필요해요.',
        },
        movementLines: {
          start: '그 마음은 새로운 시작을 향하고 있어요.',
          continue: '그 마음은 지금의 흐름을 더 단단하게 이어가고 싶어 해요.',
          recover: '그 마음은 서두르기보다 잃어버린 리듬을 되찾고 싶어 해요.',
          release: '그 마음은 오래 붙잡은 것을 내려놓고 다음 자리를 만들고 싶어 해요.',
        },
      },
      reading: {
        eyebrow: 'TWO CLUES',
        title: '두 답 사이에서 보이는 지금의 마음',
        toneLabel: '지금 필요한 목소리',
        movementLabel: '마음이 향하는 방향',
        matrixToneAxis: '가로 · 목소리',
        matrixMovementAxis: '세로 · 방향',
        matrixCaption: (total) => `${total}가지 조합 가운데 지금의 나`,
        toneInsights: {
          comfort: {
            label: '다정한 위로',
            title: '안심할 수 있어야 다시 움직일 수 있어요',
            body: '다정한 위로를 고른 건 답을 몰라서라기보다, 스스로를 재촉하는 방식으로는 더 움직이기 어렵다는 신호에 가까워요. 안심할 자리를 먼저 만들면 다음 선택도 선명해질 수 있어요.',
          },
          honesty: {
            label: '솔직한 통찰',
            title: '돌려 말하지 않는 기준이 필요해요',
            body: '솔직한 통찰을 고른 마음은 막연한 위로보다 이미 느끼고 있던 사실에 이름을 붙이고 싶어 해요. 불편하더라도 분명한 문장 하나가 오래 끌던 망설임을 줄여줄 수 있어요.',
          },
          action: {
            label: '구체적인 행동',
            title: '생각을 끝낼 작은 움직임이 필요해요',
            body: '구체적인 행동을 고른 마음에는 이해만으로는 충분하지 않다는 감각이 있어요. 완벽한 계획보다 지금 확인할 수 있는 작은 행동 하나가 답을 현실에 가깝게 데려와요.',
          },
          possibility: {
            label: '새로운 가능성',
            title: '닫힌 결론보다 새 선택지가 필요해요',
            body: '새로운 가능성을 고른 건 지금 가진 선택지만으로 마음을 설명하고 싶지 않다는 뜻에 가까워요. 당장 결정하지 않아도 다른 길이 있다는 감각이 숨을 돌릴 여백을 만들어줘요.',
          },
        },
        movementInsights: {
          start: {
            label: '새로운 시작',
            title: '확신을 기다리기보다 시작하며 확인하고 싶어요',
            body: '새로 시작하고 싶은 마음은 지금까지를 모두 부정하려는 것이 아니라, 달라질 수 있다는 증거를 직접 만들고 싶어 해요. 첫걸음은 작아도 방향이 분명하면 충분해요.',
          },
          continue: {
            label: '흐름 이어가기',
            title: '버리는 것보다 지금의 흐름을 다듬고 싶어요',
            body: '이어가고 싶은 마음에는 이미 쌓아온 시간과 감각을 쉽게 포기하지 않는 힘이 있어요. 같은 방식만 반복하기보다 지킬 것과 조정할 것을 나누면 흐름이 다시 살아나요.',
          },
          recover: {
            label: '내 리듬 회복',
            title: '예전으로가 아니라 내 리듬으로 돌아가고 싶어요',
            body: '회복하고 싶은 마음은 무조건 빨리 괜찮아지는 것보다 소모된 감각을 알아차리는 데 가까워요. 지금의 나에게 맞는 속도를 다시 찾는 것이 다음 움직임의 시작이에요.',
          },
          release: {
            label: '놓아주기',
            title: '붙잡는 이유보다 놓은 뒤의 나를 보고 싶어요',
            body: '놓고 싶은 마음은 그동안의 선택이 틀렸다는 뜻이 아니라, 이제 다른 것을 지키기 위해 자리를 만들고 싶다는 신호예요. 무엇을 끝낼지보다 무엇을 남길지 먼저 보면 덜 흔들려요.',
          },
        },
      },
      chart: {
        eyebrow: 'BIRTH CHART CLUE',
        title: '출생 차트에서 가져온 한 가지 단서',
        sunLabel: '태양',
        moonLabel: '달',
        moonRangeLabel: '달 범위',
        risingLabel: '상승',
        risingUnknown: '태어난 시각이 필요해요',
        dominantLabel: '지금 함께 볼 가장 강한 결',
        balanceLabel: '내 차트의 원소 분포',
        bridge: (movement, element) =>
          `지금 고른 ‘${movement}’ 방향도 ${element} 기운의 방식을 존중할 때 더 자연스럽게 이어져요.`,
        elements: {
          fire: {
            label: '불',
            glyph: '△',
            title: '움직여 보며 답을 만드는 힘이 커요',
            body: '불의 기운은 마음이 향하는 곳을 행동으로 확인하려 해요. 의욕을 한 번에 태우기보다 오늘 끝낼 수 있는 크기로 나누면 추진력이 오래가요.',
          },
          earth: {
            label: '흙',
            glyph: '□',
            title: '손에 잡히는 변화에서 안심을 얻어요',
            body: '흙의 기운은 말보다 실제로 달라진 조건에서 확신을 얻어요. 시간, 순서, 기준처럼 구체적인 한 가지를 정하면 마음도 함께 안정돼요.',
          },
          air: {
            label: '바람',
            glyph: '≋',
            title: '이름 붙이고 연결할 때 길이 보여요',
            body: '바람의 기운은 생각을 말이나 글로 꺼낼 때 선택지를 발견해요. 혼자 결론을 밀어붙이기보다 질문 하나를 정확히 만들면 다음 방향이 가벼워져요.',
          },
          water: {
            label: '물',
            glyph: '◡',
            title: '마음이 납득해야 오래 움직일 수 있어요',
            body: '물의 기운은 겉으로 맞는 답보다 안에서 편안해지는 답을 오래 지켜요. 감정을 없애려 하기보다 무엇을 지키려는 감정인지 살펴보면 힘이 생겨요.',
          },
        },
      },
      action: {
        eyebrow: 'ONE SMALL MOVE',
        title: '오늘 바로 해볼 한 가지',
        reflectionLabel: '오늘 마음에 남길 질문',
        actions: {
          start: {
            comfort: '시작하고 싶은 일을 한 문장으로 적고, 가장 부담 없는 5분짜리 첫 동작만 골라보세요.',
            honesty: '시작을 미루게 만든 진짜 이유를 한 문장으로 적고, 그래도 감수할 수 있는 비용 하나를 정해보세요.',
            action: '10분 안에 끝낼 수 있는 첫 단계를 정해 오늘 일정에 바로 넣어보세요.',
            possibility: '해보고 싶은 선택지 세 개를 적고, 결과를 쉽게 확인할 수 있는 작은 실험 하나를 골라보세요.',
          },
          continue: {
            comfort: '지금까지 이어온 것 중 이미 잘하고 있는 한 가지를 적고, 오늘 같은 속도로 한 번만 더 반복해보세요.',
            honesty: '계속하는 이유가 애정인지 관성인지 적어보고, 남길 것 하나와 바꿀 것 하나를 골라보세요.',
            action: '다음 진행을 막는 병목 하나를 골라 15분 동안 그것만 정리해보세요.',
            possibility: '현재 흐름을 버리지 않고 새롭게 바꿀 수 있는 10%를 하나 시험해보세요.',
          },
          recover: {
            comfort: '오늘 에너지를 빼앗는 일 하나를 미뤄두고, 몸이 편안해지는 10분을 먼저 확보하세요.',
            honesty: '괜찮은 척했던 순간 하나와 그때 실제로 필요했던 것을 한 문장씩 적어보세요.',
            action: '회복을 위해 오늘 하지 않을 일 하나와 꼭 지킬 일 하나를 정하세요.',
            possibility: '예전 방식으로 돌아가기보다 지금의 나에게 맞는 회복 방법 하나를 새로 시험해보세요.',
          },
          release: {
            comfort: '놓고 싶은 것을 당장 없애려 하지 말고, 오늘 하루만 거리를 둘 방법 하나를 골라보세요.',
            honesty: '이미 끝났음을 알고 있는 것과 아직 붙잡고 있는 이유를 나란히 적어보세요.',
            action: '삭제, 취소, 거절 중 지금 할 수 있는 가장 작은 정리 하나를 실행하세요.',
            possibility: '비워진 자리에 들어오면 좋을 감정이나 장면을 세 단어로 적어보세요.',
          },
        },
        reflections: {
          start: '완벽하지 않아도 시작할 수 있는 가장 작은 모습은 무엇일까요?',
          continue: '계속 지키고 싶은 것과 이제 바꾸고 싶은 것은 각각 무엇일까요?',
          recover: '회복한 내가 다시 갖고 싶은 하루의 감각은 무엇일까요?',
          release: '놓고 나면 비로소 지킬 수 있는 것은 무엇일까요?',
        },
      },
      paywall: {
        eyebrow: 'GO DEEPER',
        titles: {
          start: '새로 시작하려는 마음을 네 삶의 네 장면으로 이어볼까요?',
          continue: '이어가고 싶은 흐름이 어디에서 힘을 얻는지 더 깊이 볼까요?',
          recover: '회복에 필요한 조건을 사랑, 일, 결정까지 연결해볼까요?',
          release: '무엇을 남기고 놓을지 네 삶의 네 장면에서 살펴볼까요?',
        },
        body: '무료 결과는 지금의 방향과 오늘의 한 걸음을 보여줬어요. 전체 리포트는 출생 차트와 16~20개 답을 함께 읽어, 같은 마음이 자기이해·사랑·일·결정에서 어떻게 다르게 나타나는지 풀어줘요.',
        slots: {
          self: { label: '자기이해', glyph: '☾' },
          love: { label: '사랑', glyph: '♡' },
          work: { label: '일', glyph: '✦' },
          choice: { label: '결정', glyph: '◇' },
        },
        sealedLabel: '결제 후 공개',
        sampleLabel: '실제 카드 예시',
        lockedTitle: '전체 리포트에서 이어지는 네 장면',
        lockedItems: [
          { title: '나를 지키는 방식', preview: '같은 마음이 반복되는 이유와 회복에 필요한 조건…' },
          { title: '사랑이 움직이는 속도', preview: '다가감과 기다림 사이에서 관계가 필요로 하는 여백…' },
          { title: '일의 리듬과 압박', preview: '성취를 만드는 힘과 에너지를 소모시키는 마찰…' },
          { title: '결정을 가르는 기준', preview: '비교가 길어지는 이유와 책임지고 싶은 선택의 방향…' },
        ],
        unlock: '네 장과 전체 리포트 열기',
        unlockShort: '전체 리포트 열기',
        unlockNote: '한 번 결제',
      },
      states: {
        chartRequiredTitle: '출생 차트를 더하면 결과가 완성돼요',
        chartRequiredBody:
          '두 답으로 읽은 마음과 오늘의 행동은 지금 확인할 수 있어요. 출생 차트를 만든 뒤 돌아오면 별자리 단서와 결제 버튼이 이어져요.',
        chartRequiredCta: '출생 차트 만들기',
        chartLoading: '출생 차트에서 지금의 단서를 찾고 있어요…',
        missingTitle: '먼저 두 질문에 답해주세요',
        missingBody: '두 가지 짧은 질문에 답하면 지금의 마음, 출생 차트 단서, 오늘의 한 걸음을 바로 확인할 수 있어요.',
        missingCta: '두 질문에 답하기',
      },
    },
    purchase: {
      eyebrow: 'FULL REPORT',
      title: '네 답이 모두 모인 뒤에만 정해지는 카드',
      body: '결제 직후 카드를 무작위로 보여주지 않아요. 핵심 질문과 맞춤 질문을 모두 마친 뒤 출생 차트와 답변을 함께 읽어 카드와 본문을 완성해요.',
      includes: ['수호령 카드 4장', '개인화 질문 16~20개', '네 주제 상세 본문', '시각 요약과 행동 문장'],
      priceSuffix: '한 번 결제 · 구독 아님',
      cta: '무료 미리보기부터 시작하기',
      refundNote: '완성된 리포트를 열기 전에는 언제든 전액 환불받을 수 있어요.',
      refundLink: '청약철회·환불 정책',
    },
    stickyCta: {
      note: '전체 리포트',
      cta: '무료로 시작하기',
    },
    checkout: {
      title: '리포트를 다시 찾을 이메일',
      body: '결제 영수증과 리포트를 다시 여는 링크를 이 주소로 보내드려요. 광고 메일은 보내지 않아요.',
      emailLabel: '구매 이메일',
      emailPlaceholder: 'you@example.com',
      emailHint: '오타가 있으면 리포트를 다시 찾기 어려워요.',
      securityHint: '안전한 결제를 위해 보안 확인을 완료해주세요.',
      submit: '결제하고 맞춤 질문 시작하기',
      submitting: '결제창을 준비하고 있어요…',
      close: '이전으로',
      orderTitle: '주문 내용',
      orderProductLabel: '상품',
      orderPriceLabel: '결제 금액',
      orderDeliveryLabel: '제공 방식',
      orderDeliveryValue: '맞춤 질문을 마치면 웹 화면으로 제공 · 1년간 재열람',
      consentTitle: '결제 전 확인',
      consentAge: '만 14세 이상입니다. 생년월일은 받지 않아요.',
      consentPrivacy: '리포트 결제와 생성 그리고 재열람에 필요한 개인정보 수집·이용에 동의합니다.',
      consentWithdrawal:
        '완성된 리포트를 열기 전에는 언제든 전액 환불받을 수 있고, 리포트를 연 뒤에는 전자상거래법에 따라 청약철회가 제한된다는 점에 동의합니다.',
      consentRequired: '결제를 진행하려면 위 세 가지를 모두 확인해주세요.',
      minorNotice:
        '미성년자가 법정대리인의 동의 없이 맺은 계약은 미성년자 본인이나 법정대리인이 취소할 수 있어요. 구매한 이메일과 함께 알려주시면 취소해 드려요.',
      docLinks: [
        { path: 'terms', label: '이용약관' },
        { path: 'refund', label: '청약철회·환불 정책' },
        { path: 'privacy', label: '개인정보처리방침' },
      ],
    },
    resume: {
      eyebrow: 'CONTINUE',
      title: '이 브라우저에 이어볼 리포트가 있어요',
      body: '결제 결과를 확인하거나 중단했던 결제를 다시 열 수 있어요.',
      reportCta: '결제 결과·리포트 확인',
      paymentCta: '결제 다시 열기',
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
      reopenCta: '구매 이메일로 다시 열기',
    },
    reopen: {
      metaTitle: '구매한 별자리 수호령 리포트 다시 열기',
      metaDescription: '구매 이메일로 일회용 링크를 받아 별자리 수호령 리포트를 이어서 확인하세요.',
      eyebrow: 'REPORT RECOVERY',
      title: '구매한 리포트를 다시 열어요',
      body: '결제할 때 입력한 이메일로 15분 동안 한 번 사용할 수 있는 링크를 보내드려요.',
      emailLabel: '구매 이메일',
      emailPlaceholder: 'you@example.com',
      requestCta: '재열람 링크 받기',
      requesting: '링크를 준비하고 있어요…',
      deliveryNote: '구매 내역이 없더라도 같은 안내 화면을 보여드려요. 메일이 보이지 않으면 스팸함도 확인해주세요.',
      linkTitle: '리포트를 열 준비가 됐어요',
      linkBody: '아래 버튼을 누르면 이 링크를 한 번 사용하고, 이 브라우저에서 질문이나 결과를 이어볼 수 있어요.',
      linkCta: '내 리포트 열기',
      opening: '안전한 재열람 링크를 확인하고 있어요…',
      acceptedTitle: '메일을 확인해주세요',
      acceptedBody: '구매 내역이 있는 주소라면 곧 재열람 링크가 도착해요. 링크는 15분 동안 한 번만 사용할 수 있어요.',
      invalidTitle: '이 링크를 사용할 수 없어요',
      invalidBody: '이미 사용했거나 15분이 지났을 수 있어요. 구매 이메일로 새 링크를 받아주세요.',
      startOverCta: '상품 소개로 돌아가기',
      genericError: '링크를 준비하지 못했어요. 잠시 뒤 다시 시도해주세요.',
      turnstileError: '보안 확인 시간이 지났어요. 다시 확인한 뒤 눌러주세요.',
      rateLimitedError: '재열람 요청이 잠시 많아요. 조금 뒤 다시 시도해주세요.',
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
      accountSave: {
        eyebrow: 'KEEP YOUR GUARDIANS',
        title: '이 카드들을 소복 계정에 간직할까요?',
        body: '구매한 리포트와 지금까지 모은 카드를 그대로 보관하고, 다른 기기에서도 다시 열 수 있어요.',
        reward: '보관하면 사랑 카드 무료 재추첨 1회를 드려요.',
        signIn: '소복 계정으로 보관하기',
        save: '이 계정에 카드 보관하기',
        saving: '카드를 안전하게 옮기는 중…',
        savedTitle: '소복 계정에 안전하게 보관했어요',
        savedBody: '게스트 열쇠는 닫혔고, 이제 로그인한 계정에서만 이 컬렉션을 열 수 있어요.',
        library: '내 카드 보관함 보기',
        error: '계정에 보관하지 못했어요. 잠시 뒤 다시 시도해주세요.',
      },
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
  const emptyInsight = { label: empty, title: empty, body: empty }
  const emptyElementInsight = { ...emptyInsight, glyph: empty }
  const emptyQuestion = {
    header: { title: empty, body: empty },
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
      navigation: { backToLanding: empty, backToFree: empty, reopen: empty },
      hero: {
        eyebrow: empty,
        title: empty,
        body: empty,
        cta: empty,
        offerNote: () => empty,
        sampleLabel: empty,
        trustItems: [],
      },
      sample: {
        eyebrow: empty,
        title: empty,
        body: empty,
        caption: empty,
        section: {
          label: empty,
          title: empty,
          guardians: empty,
          oneLine: empty,
          chartSummary: empty,
          placements: [],
          detail: { title: empty, body: empty },
          guidance: { title: empty, body: empty },
          reflection: empty,
        },
        continues: empty,
      },
      product: { eyebrow: empty, title: empty, body: empty, items: [] },
      process: { eyebrow: empty, title: empty, steps: [] },
      quiz: {
        eyebrow: empty,
        tone: emptyQuestion,
        movement: emptyQuestion,
        position: () => empty,
        next: empty,
        result: empty,
      },
      freeResult: {
        hero: {
          eyebrow: empty,
          title: empty,
          body: empty,
          toneLines: { comfort: empty, honesty: empty, action: empty, possibility: empty },
          movementLines: { start: empty, continue: empty, recover: empty, release: empty },
        },
        reading: {
          eyebrow: empty,
          title: empty,
          toneLabel: empty,
          movementLabel: empty,
          matrixToneAxis: empty,
          matrixMovementAxis: empty,
          matrixCaption: () => empty,
          toneInsights: {
            comfort: emptyInsight,
            honesty: emptyInsight,
            action: emptyInsight,
            possibility: emptyInsight,
          },
          movementInsights: {
            start: emptyInsight,
            continue: emptyInsight,
            recover: emptyInsight,
            release: emptyInsight,
          },
        },
        chart: {
          eyebrow: empty,
          title: empty,
          sunLabel: empty,
          moonLabel: empty,
          moonRangeLabel: empty,
          risingLabel: empty,
          risingUnknown: empty,
          dominantLabel: empty,
          balanceLabel: empty,
          bridge: () => empty,
          elements: {
            fire: emptyElementInsight,
            earth: emptyElementInsight,
            air: emptyElementInsight,
            water: emptyElementInsight,
          },
        },
        action: {
          eyebrow: empty,
          title: empty,
          reflectionLabel: empty,
          actions: {
            start: { comfort: empty, honesty: empty, action: empty, possibility: empty },
            continue: { comfort: empty, honesty: empty, action: empty, possibility: empty },
            recover: { comfort: empty, honesty: empty, action: empty, possibility: empty },
            release: { comfort: empty, honesty: empty, action: empty, possibility: empty },
          },
          reflections: { start: empty, continue: empty, recover: empty, release: empty },
        },
        paywall: {
          eyebrow: empty,
          titles: { start: empty, continue: empty, recover: empty, release: empty },
          body: empty,
          slots: { self: emptySlot, love: emptySlot, work: emptySlot, choice: emptySlot },
          sealedLabel: empty,
          sampleLabel: empty,
          lockedTitle: empty,
          lockedItems: [],
          unlock: empty,
          unlockShort: empty,
          unlockNote: empty,
        },
        states: {
          chartRequiredTitle: empty,
          chartRequiredBody: empty,
          chartRequiredCta: empty,
          chartLoading: empty,
          missingTitle: empty,
          missingBody: empty,
          missingCta: empty,
        },
      },
      purchase: {
        eyebrow: empty,
        title: empty,
        body: empty,
        includes: [],
        priceSuffix: empty,
        cta: empty,
        refundNote: empty,
        refundLink: empty,
      },
      stickyCta: { note: empty, cta: empty },
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
        orderTitle: empty,
        orderProductLabel: empty,
        orderPriceLabel: empty,
        orderDeliveryLabel: empty,
        orderDeliveryValue: empty,
        consentTitle: empty,
        consentAge: empty,
        consentPrivacy: empty,
        consentWithdrawal: empty,
        consentRequired: empty,
        minorNotice: empty,
        docLinks: [],
      },
      resume: { eyebrow: empty, title: empty, body: empty, reportCta: empty, paymentCta: empty },
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
      missing: { title: empty, body: empty, cta: empty, reopenCta: empty },
      reopen: {
        metaTitle: empty,
        metaDescription: empty,
        eyebrow: empty,
        title: empty,
        body: empty,
        emailLabel: empty,
        emailPlaceholder: empty,
        requestCta: empty,
        requesting: empty,
        deliveryNote: empty,
        linkTitle: empty,
        linkBody: empty,
        linkCta: empty,
        opening: empty,
        acceptedTitle: empty,
        acceptedBody: empty,
        invalidTitle: empty,
        invalidBody: empty,
        startOverCta: empty,
        genericError: empty,
        turnstileError: empty,
        rateLimitedError: empty,
      },
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
        accountSave: {
          eyebrow: empty,
          title: empty,
          body: empty,
          reward: empty,
          signIn: empty,
          save: empty,
          saving: empty,
          savedTitle: empty,
          savedBody: empty,
          library: empty,
          error: empty,
        },
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
