import { createDeepTypeContent } from './create-content'
import { enQuestionOptions } from './question-options/en'
import { enQuestionPrompts } from './question-prompts/en'

export const deepTypeContent = createDeepTypeContent({
  metadata: {
    title: 'DeepType Inner Exploration',
    description:
      'Explore context-dependent traits and inner motives through continuous scores and a 16×16×16 type system.',
  },
  ui: {
    analyzingBody: 'We are scoring all 50 responses under one model and building your three-layer profile.',
    analyzingTitle: 'Mapping your three layers',
    backCta: 'Previous question',
    clarityBands: { clear: 'Clear', moderate: 'Moderate', slight: 'Slight' },
    clarityLabel: 'Clarity',
    clarityNote: 'The longer the bar, the more clearly that direction appeared across your responses.',
    closestAnswerHint: 'If none fits exactly, choose the option closest to you.',
    contextBody:
      'The same constructs were asked about in social and private contexts. Differences describe context-dependent expression, not a contradictory personality.',
    contextTitle: 'How expression shifts by context',
    gemIntroBody:
      'The final 20 questions explore the basis of self-worth, connection and autonomy, emotion processing, and goal focus.',
    gemIntroCta: 'Start Gem questions',
    gemIntroHint: 'Choose what you actually tend to do, not what sounds most desirable.',
    gemIntroTitle: 'STEP 3. Inner motives',
    gemStepLabel: 'STEP 3 · Gem',
    innerIntroBody: 'Now answer the same trait dimensions while imagining yourself alone or outside a social role.',
    innerIntroCta: 'Start Inner questions',
    innerIntroHint: 'It is fine if this differs from earlier answers. Choose what feels closest when you are off duty.',
    innerIntroTitle: 'STEP 2. Outside your roles',
    innerStepLabel: 'STEP 2 · Inner',
    landingCta: 'Start inner exploration',
    reopenCta: 'Reopen a purchased report',
    landingNote: 'Free · about 7 minutes · see your place among 4,096 combinations instantly',
    landingStepGemDesc: '16 Gems built from self-worth, relationships, emotion processing, and goal focus',
    landingStepInnerDesc: 'One of 16 types outside social roles',
    landingStepOuterDesc: 'One of 16 types expressed around other people',
    landingSubtitle:
      'Compare the person you express around others with the person you are outside a role, then explore four motives that shape your inner life.',
    landingTitle: 'Why do I feel different across situations?',
    layerGem: 'Gem · motive profile',
    layerInner: 'Inner type',
    layerPersona: 'Persona type',
    methodologyCta: 'See DeepType design principles',
    methodologyNoteBody:
      'Reading continuous scores alongside context shifts helps you use the result beyond the three type codes.',
    methodologyNoteTitle: 'Get more from your result',
    personaIntroBody:
      'Answer while thinking about how you naturally behave around other people or while performing a social role.',
    personaIntroCta: 'Start Persona questions',
    personaIntroHint:
      'You do not need a perfect match. Think about how you have usually been lately and choose the closest option.',
    personaIntroTitle: 'STEP 1. Around other people',
    personaStepLabel: 'STEP 1 · Persona',
    profileTitle: 'Continuous score profile',
    refinedLabel: 'Deepening responses applied',
    reflectionBody: 'Use these prompts to explore how your clearest Gem directions show up in everyday life.',
    reflectionTitle: 'Reflection prompts',
    reportDisclaimer:
      'This self-exploration report reflects your current responses. How you express these patterns can shift with context.',
    reportRestartCta: 'Start again',
    reportShareCopied: 'Result text copied.',
    reportShareCta: 'Share result',
    reportShareText: 'My DeepType is Persona {persona}, Inner {inner}, and Gem {gem}.',
    summaryTemplate:
      'Around others you answered closer to {persona}; outside a role, closer to {inner}. Your inner-motive combination is {gem}, one of 4,096 total combinations.',
  },
  paywall: {
    unlockCta: 'See my in-depth report',
    title: 'See how your patterns show up in relationships and everyday life',
    body: 'Connect your Persona–Inner shifts with your Gem motives in 12 personalized sections covering relationships, emotions, motivation, and recovery.',
    benefits: [
      'The situations where your Persona and Inner patterns shift',
      'The connection and personal space that help relationships feel easier',
      'Practical ideas for emotions, motivation, and recovery',
    ],
    discountTemplate: '{discount}% off',
    emailLabel: 'Email to save and reopen your report',
    emailPlaceholder: 'you@example.com',
    effortNote: 'After payment, complete 24 short questions (about 3–4 minutes) and we will create your report.',
    consentWithdrawal: 'I agree that my digital report can begin generating immediately after payment.',
    consentPrivacy: 'I agree to the use of my information for payment, report storage, and reopening.',
    ageConfirmation: 'I am at least 14 years old.',
    notice: 'This is a one-time purchase, not a subscription. You can reopen the completed report with this email.',
    cta: 'Start my in-depth report',
    processing: 'Preparing payment...',
    errorGeneric: 'Payment could not be completed. Please try again shortly.',
    closeCta: 'Return to the free result',
    generatingTitle: 'Writing your in-depth report',
    generatingBody:
      'We are turning your responses into 12 insights on relationships, emotions, motivation, and recovery.',
    fallbackNote: 'Report generation failed, so your free result is shown instead.',
    refinementIntroTitle: 'STEP 4. Complete your profile',
    refinementIntroBody:
      'These 24 short questions explore eight key dimensions in greater depth. Your answers complete your Inner and Gem profile and shape the personalized report.',
    refinementIntroCta: 'Complete my profile',
    refinementIntroHint:
      'You do not need to match your earlier result. The closest answer makes your report more specific.',
    refinementStepLabel: 'STEP 4 · Profile completion',
    refinementSubmitting: 'Completing your final profile...',
    refundCta: 'Request payment cancellation',
    refundPending: 'Processing cancellation...',
    refundDone: 'Your payment was canceled.',
    refundFailed: 'Automatic cancellation failed. Please contact support.',
  },
  axes: {
    EI: {
      name: 'Social energy',
      description: 'Compares energy from active interaction with recovery in lower-stimulation settings.',
      first: {
        label: 'Outer engagement',
        description: 'Energy tends to rise while initiating and sustaining interaction',
        reflection: 'Notice which interactions genuinely restore energy and which ones drain it.',
      },
      second: {
        label: 'Inner recovery',
        description: 'Energy tends to return through solitude and reduced stimulation',
        reflection: 'Ask whether time alone is serving recovery or avoidance today.',
      },
    },
    SN: {
      name: 'Information focus',
      description:
        'Compares attention to concrete evidence and application with attention to patterns and possibilities.',
      first: {
        label: 'Concrete evidence',
        description: 'Prioritizes verifiable facts and what can be applied now',
        reflection: 'Check both whether you have enough facts and whether you are missing the larger pattern.',
      },
      second: {
        label: 'Possibilities and patterns',
        description: 'Notices hidden connections and what could emerge next',
        reflection: 'Choose one promising possibility that can be tested now.',
      },
    },
    TF: {
      name: 'Decision criterion',
      description: 'Compares emphasis on consistent criteria with emphasis on effects on people.',
      first: {
        label: 'Analysis and consistency',
        description: 'Checks coherence of reasons and equal application of standards first',
        reflection: 'Write down both the consistent standard and the human impact of the decision.',
      },
      second: {
        label: 'Relationships and impact',
        description: 'Considers context and effects on people first',
        reflection: 'Put both your care for people and the standard you want to protect into words.',
      },
    },
    JP: {
      name: 'Action style',
      description: 'Compares creating structure and closure with keeping options open and adapting.',
      first: {
        label: 'Structure and closure',
        description: 'Uses plans and deadlines to reduce uncertainty',
        reflection: 'Check whether the plan gives useful structure without blocking new information.',
      },
      second: {
        label: 'Flexibility and exploration',
        description: 'Keeps options open and adjusts to emerging conditions',
        reflection: 'Choose one option to keep open and one decision to close today.',
      },
    },
    NE: {
      name: 'Emotional reactivity',
      description: 'Compares sensitivity under uncertainty and pressure with relatively rapid emotional recovery.',
      first: {
        label: 'Sensitive response',
        description: 'Small uncertainties linger and pressure brings larger emotional shifts',
        reflection: 'Separate the signal your sensitivity offers from the level of actual risk.',
      },
      second: {
        label: 'Steady recovery',
        description: 'Returns to an even state relatively quickly after discomfort',
        reflection: 'Distinguish genuine recovery from emotions that have simply not been addressed yet.',
      },
    },
    RM: {
      name: 'Basis of self-worth',
      description:
        'Compares an internally anchored evaluation with value that is more responsive to others’ reactions.',
      first: {
        label: 'Internal anchor',
        description: 'Uses feedback while retaining an independent sense of value',
        reflection: 'Take in useful feedback while naming the standard that matters to you.',
      },
      second: {
        label: 'Response-sensitive',
        description: 'Motivation and felt value shift more with recognition and response',
        reflection: 'Name whether you need information, recognition, or connection right now.',
      },
    },
    OA: {
      name: 'Connection and autonomy',
      description: 'Compares security through frequent connection with security through sufficient personal space.',
      first: {
        label: 'Connection preference',
        description: 'Feels steadier when contact and everyday life are shared regularly',
        reflection: 'Describe the amount and form of connection you need in concrete terms.',
      },
      second: {
        label: 'Autonomy preference',
        description: 'Values independent time and boundaries even in close relationships',
        reflection: 'Communicate both the need for space and a signal that the relationship matters.',
      },
    },
    VH: {
      name: 'Emotion processing',
      description: 'Compares organizing emotion through conversation with processing internally before sharing.',
      first: {
        label: 'Shared processing',
        description: 'Emotions become clearer while speaking with a trusted person',
        reflection: 'Before talking, say whether you need a solution, empathy, or company.',
      },
      second: {
        label: 'Private processing',
        description: 'Expression becomes more accurate after enough time to understand feelings alone',
        reflection: 'Ask for time to think and also agree on when to return to the conversation.',
      },
    },
    UO: {
      name: 'Goal focus',
      description:
        'Compares movement toward gains and growth with attention to preventing loss and preserving stability.',
      first: {
        label: 'Growth focus',
        description: 'New opportunities and desired change create stronger momentum',
        reflection: 'Define both the opportunity you want and the loss you can reasonably absorb.',
      },
      second: {
        label: 'Preservation focus',
        description: 'Reducing risk and protecting what already works creates stronger momentum',
        reflection: 'Separate what must be protected from a small area where experimentation is safe.',
      },
    },
  },
  gemNames: {
    ROVU: 'Ruby',
    ROVO: 'Amber',
    ROHU: 'Garnet',
    ROHO: 'Jade',
    RAVU: 'Turquoise',
    RAVO: 'Aquamarine',
    RAHU: 'Obsidian',
    RAHO: 'Diamond',
    MOVU: 'Topaz',
    MOVO: 'Rose Quartz',
    MOHU: 'Moonstone',
    MOHO: 'Pearl',
    MAVU: 'Opal',
    MAVO: 'Peridot',
    MAHU: 'Sapphire',
    MAHO: 'Smoky Quartz',
  },
  methodology: {
    title: 'DeepType design principles and research background',
    intro:
      'DeepType is a self-exploration framework designed to connect context-dependent personality expression with inner motives. Principles from personality and motivation research shape its three layers, continuous scores, and type combinations.',
    modelTitle: 'Three layers and 4,096 combinations',
    modelBody:
      'Persona and Inner use the same five dimensions. The dominant directions on four dimensions create a 16-type code for each layer; emotional reactivity remains continuous and does not enter the code. Four motive dimensions create 16 Gems, producing 16×16×16, or 4,096 total classifications.',
    scoringTitle: 'Questions and scoring',
    scoringBody:
      'The free stage has 50 questions, followed after payment by 24 questions that explore eight key dimensions in greater depth. Each question asks for the closest of four concrete options and includes reverse-keyed items. The server checks IDs, duplicates, omissions, and ranges before computing equal-weighted axis means.',
    evidenceTitle: 'Conceptual starting points',
    evidenceBody:
      'Context-dependent expression draws on Whole Trait Theory and cross-role trait research. The self-worth dimension references contingencies of self-worth; connection and autonomy draw on attachment research and self-determination theory. Emotion processing and goal focus incorporate perspectives from emotion-regulation and regulatory-focus research.',
    principlesTitle: 'Principles for reading your result',
    principles: [
      'Read each dimension’s continuous score and clarity alongside the letter codes.',
      'Treat Persona–Inner differences as context-dependent expression rather than contradiction.',
      'Every direction offers useful strengths and trade-offs depending on the situation.',
      'Use the report’s prompts and small experiments to find applications that fit your daily life.',
    ],
    sourcesTitle: 'Research and standards referenced',
    sourcesIntro: 'These are the main studies and standards referenced in DeepType design and interpretation.',
    backCta: 'Return to DeepType',
  },
  questionOptions: enQuestionOptions,
  questionPrompts: enQuestionPrompts,
})
