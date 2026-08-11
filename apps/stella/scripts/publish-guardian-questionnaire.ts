import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { guardianProduct } from '../worker/guardian/manifest'
import {
  type GuardianQuestionnaireContent,
  GuardianQuestionnaireContentError,
  parseGuardianQuestionnaireContent,
} from '../worker/guardian/questionnaire'
import { validateGuardianReportCopyQuestionnaire } from '../worker/guardian/report'

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    environment: { type: 'string' },
    'expected-hash': { type: 'string' },
    'validate-only': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help || !values.file) {
  console.log(`Usage:
  bun run questionnaire:validate --file <questionnaire.json>
  SOBOK_MIGRATOR_URL=<staging-migrator-url> \\
    bun run questionnaire:publish --file <questionnaire.json> --environment staging
  SOBOK_MIGRATOR_URL=<production-migrator-url> \\
    bun run questionnaire:publish --file <questionnaire.json> --environment production \\
      --expected-hash <staging-sha256>

Questionnaire sources are tracked under apps/stella/content/guardian-questionnaires/.`)
  process.exit(values.help ? 0 : 1)
}

try {
  const raw = await readFile(values.file, 'utf8')
  const content = parseGuardianQuestionnaireContent(JSON.parse(raw) as unknown)
  const product = guardianProduct(content.productSku)
  if (product.kind !== 'full_report') {
    throw new GuardianQuestionnaireContentError([
      `Product ${content.productSku} is ${product.kind}; paid questionnaires require a full_report product`,
    ])
  }
  if (product.questionnaireVersions[content.locale] === content.version) {
    const copyVersion = product.reportCopyVersions[content.locale]
    if (!copyVersion) {
      throw new Error(`Product ${content.productSku} has no report copy for locale ${content.locale}`)
    }
    validateGuardianReportCopyQuestionnaire(copyVersion, content)
  }

  const contentHash = createHash('sha256').update(canonicalJson(content)).digest('hex')
  if (values['expected-hash'] && values['expected-hash'] !== contentHash) {
    throw new Error(`Questionnaire content hash does not match --expected-hash (actual ${contentHash})`)
  }
  if (values['validate-only']) {
    printSummary('validated', content, contentHash)
  } else {
    await publish(content, contentHash)
    printSummary('published', content, contentHash)
  }
} catch (error) {
  if (error instanceof GuardianQuestionnaireContentError) {
    console.error(error.message)
  } else if (error instanceof SyntaxError) {
    console.error('Invalid questionnaire JSON')
  } else {
    console.error(error instanceof Error ? error.message : 'Questionnaire publication failed')
  }
  process.exitCode = 1
}

async function publish(content: GuardianQuestionnaireContent, contentHash: string): Promise<void> {
  const url = process.env.SOBOK_MIGRATOR_URL
  if (!url) {
    throw new Error('SOBOK_MIGRATOR_URL is required for publication')
  }
  if (values.environment !== 'staging' && values.environment !== 'production') {
    throw new Error('--environment must explicitly be staging or production')
  }
  if (values.environment === 'production' && !values['expected-hash']) {
    throw new Error('Production publication requires --expected-hash from the validated staging publication')
  }

  // Dynamic so validation does not load database declarations. The credential URL selects the environment's
  // Supabase project; both projects intentionally use the same `stella` schema contract.
  const { guardianQuestionnaireVersionTable, guardianQuestionOptionTable, guardianQuestionTable } = await import(
    '../worker/db/schema/guardian-questionnaire'
  )
  const client = postgres(url, { max: 1, prepare: false, ssl: 'verify-full' })
  const db = drizzle({ client })

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ version: guardianQuestionnaireVersionTable.version })
        .from(guardianQuestionnaireVersionTable)
        .where(eq(guardianQuestionnaireVersionTable.version, content.version))
        .limit(1)
        .for('update')
      if (existing) {
        throw new Error(
          `Questionnaire ${content.version} is already published; published versions are immutable, use a new version`,
        )
      }

      const [version] = await tx
        .insert(guardianQuestionnaireVersionTable)
        .values({
          version: content.version,
          schemaVersion: content.schemaVersion,
          productSku: content.productSku,
          locale: content.locale,
          coreQuestionsPerSlot: content.coreQuestionsPerSlot,
          requiredAdaptiveQuestionsPerSlot: content.requiredAdaptiveQuestionsPerSlot,
          maximumAdaptiveQuestionsPerSlot: content.maximumAdaptiveQuestionsPerSlot,
          contentHash,
        })
        .returning({ id: guardianQuestionnaireVersionTable.id })
      if (!version) {
        throw new Error('Questionnaire version insert returned no row')
      }

      const questionRows = await tx
        .insert(guardianQuestionTable)
        .values(
          content.questions.map((question, position) => ({
            questionnaireVersionId: version.id,
            questionId: question.id,
            position,
            slot: question.phase === 'note' ? null : question.slot,
            phase: question.phase,
            kind: question.kind,
            prompt: question.prompt,
            supportingText: question.supportingText,
            selectionRole: question.phase === 'adaptive' ? question.selection.role : null,
            selectionPriority: question.phase === 'adaptive' ? question.selection.priority : null,
            selectionMinimumScore:
              question.phase === 'adaptive' && question.selection.role === 'deepening'
                ? question.selection.minimumScore
                : null,
            selectionSignalWeights: question.phase === 'adaptive' ? question.selection.signalWeights : null,
          })),
        )
        .returning({ id: guardianQuestionTable.id, questionId: guardianQuestionTable.questionId })
      const questionRowId = new Map(questionRows.map((question) => [question.questionId, question.id]))

      const optionValues = content.questions.flatMap((question) => {
        if (question.kind === 'free_text') {
          return []
        }
        const rowId = questionRowId.get(question.id)
        if (!rowId) {
          throw new Error(`Question insert returned no row for ${question.id}`)
        }
        return question.options.map((option, position) => ({
          questionId: rowId,
          optionId: option.id,
          position,
          label: option.label,
          signals: option.signals,
        }))
      })
      if (optionValues.length > 0) {
        await tx.insert(guardianQuestionOptionTable).values(optionValues)
      }
    })
  } finally {
    await client.end({ timeout: 5 })
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`
}

function printSummary(
  action: 'validated' | 'published',
  content: GuardianQuestionnaireContent,
  contentHash: string,
): void {
  const optionCount = content.questions.reduce(
    (count, question) => count + (question.kind === 'single_choice' ? question.options.length : 0),
    0,
  )
  console.log(
    `${action}: ${content.version} (${content.locale}, ${content.questions.length} questions, ${optionCount} options, sha256 ${contentHash})`,
  )
}
