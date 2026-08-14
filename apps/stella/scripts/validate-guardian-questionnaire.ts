import { guardianQuestionnaire } from '../worker/guardian/questionnaire-content'

const questionnaire = guardianQuestionnaire('guardian-report-full-v1', 'ko')
const optionCount = questionnaire.questions.reduce(
  (count, question) => count + (question.kind === 'single_choice' ? question.options.length : 0),
  0,
)

console.log(
  `validated: ${questionnaire.productSku}/${questionnaire.locale} (${questionnaire.questions.length} questions, ${optionCount} options)`,
)
