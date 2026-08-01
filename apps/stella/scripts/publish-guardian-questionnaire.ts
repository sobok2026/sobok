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
    'expected-hash': { type: 'string' },
    'validate-only': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help || !values.file) {
  console.log(`Usage:
  bun run questionnaire:validate --file <questionnaire.json>
  STELLA_DB_SCHEMA=stella_stg STELLA_POSTGRES_URL_DIRECT=<owner-url> \\
    bun run questionnaire:publish --file <questionnaire.json>
  STELLA_DB_SCHEMA=stella STELLA_POSTGRES_URL_DIRECT=<owner-url> \\
    bun run questionnaire:publish --file <questionnaire.json> --expected-hash <staging-sha256>

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
  const url = process.env.STELLA_POSTGRES_URL_DIRECT
  if (!url) {
    throw new Error('STELLA_POSTGRES_URL_DIRECT is required for publication')
  }
  if (!process.env.STELLA_DB_SCHEMA) {
    throw new Error('STELLA_DB_SCHEMA must explicitly be stella_stg or stella')
  }
  if (process.env.STELLA_DB_SCHEMA === 'stella' && !values['expected-hash']) {
    throw new Error('Production publication requires --expected-hash from the validated staging publication')
  }

  // Dynamic so validation does not need a database target. Importing the schema resolves STELLA_DB_SCHEMA at
  // module load; this fail-closed boundary prevents an omitted environment from publishing into production.
  const { guardianQuestionnaireVersionTable, guardianQuestionOptionTable, guardianQuestionTable } = await import(
    '../worker/db/schema/guardian-questionnaire'
  )
  const client = postgres(url, { max: 1, prepare: false, ssl: 'require' })
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
