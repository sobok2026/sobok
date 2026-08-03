import type { StellaMaintenanceService, VibeMaintenanceService } from '@sobok/scheduler'

const RECONCILE_CRON = '*/15 * * * *'
const RETENTION_CRON = '0 3 * * *'

type MaintenanceBindings = {
  VIBE_PRODUCTION: VibeMaintenanceService
  VIBE_STAGING: VibeMaintenanceService
  STELLA_PRODUCTION: StellaMaintenanceService
  STELLA_STAGING: StellaMaintenanceService
}

type Bindings = Omit<CloudflareBindings, keyof MaintenanceBindings> & MaintenanceBindings

type ScheduledJob = {
  name: string
  run: () => Promise<void>
}

export default {
  async scheduled(controller: ScheduledController, env: Bindings): Promise<void> {
    const jobs = jobsFor(controller.cron, env)
    await runJobs(controller, jobs)
  },
} satisfies ExportedHandler<Bindings>

function jobsFor(cron: string, env: Bindings): ScheduledJob[] {
  switch (cron) {
    case RECONCILE_CRON:
      return [
        { name: 'vibe.production.reconcile-payments', run: () => env.VIBE_PRODUCTION.reconcilePendingPayments() },
        { name: 'vibe.staging.reconcile-payments', run: () => env.VIBE_STAGING.reconcilePendingPayments() },
        { name: 'stella.production.reconcile-payments', run: () => env.STELLA_PRODUCTION.reconcilePendingPayments() },
        { name: 'stella.staging.reconcile-payments', run: () => env.STELLA_STAGING.reconcilePendingPayments() },
      ]
    case RETENTION_CRON:
      return [
        { name: 'vibe.production.purge-retention', run: () => env.VIBE_PRODUCTION.purgeRetention() },
        { name: 'vibe.staging.purge-retention', run: () => env.VIBE_STAGING.purgeRetention() },
        { name: 'stella.production.purge-retention', run: () => env.STELLA_PRODUCTION.purgeRetention() },
        { name: 'stella.staging.purge-retention', run: () => env.STELLA_STAGING.purgeRetention() },
      ]
    default:
      throw new Error(`Unsupported scheduler cron: ${cron}`)
  }
}

async function runJobs(controller: ScheduledController, jobs: ScheduledJob[]): Promise<void> {
  const startedAt = Date.now()
  console.log(
    'scheduler.run.started',
    JSON.stringify({ cron: controller.cron, jobs: jobs.map((job) => job.name), scheduledAt: controller.scheduledTime }),
  )

  const outcomes = await Promise.allSettled(
    jobs.map(async (job) => {
      const jobStartedAt = Date.now()
      await job.run()
      console.log('scheduler.job.completed', JSON.stringify({ durationMs: Date.now() - jobStartedAt, job: job.name }))
    }),
  )

  const failures = outcomes.flatMap((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      return []
    }
    const failure = {
      error: outcome.reason instanceof Error ? outcome.reason.name : 'unknown',
      job: jobs[index]?.name ?? 'unknown',
    }
    console.error('scheduler.job.failed', JSON.stringify(failure))
    return [failure]
  })

  if (failures.length > 0) {
    throw new Error(`${failures.length} scheduled maintenance job(s) failed`)
  }

  console.log(
    'scheduler.run.completed',
    JSON.stringify({ cron: controller.cron, durationMs: Date.now() - startedAt, jobCount: jobs.length }),
  )
}
