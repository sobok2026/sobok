import {
  initializeFaro,
  PerformanceInstrumentation,
  SessionInstrumentation,
  ViewInstrumentation,
  WebVitalsInstrumentation,
} from '@grafana/faro-web-sdk'
import { getDefaultOTELInstrumentations, TracingInstrumentation } from '@grafana/faro-web-tracing'
import * as Sentry from '@sentry/nextjs'
import {
  createSentryInitOptions,
  FARO_IGNORED_URLS,
  isBrowserNoiseEvent,
  SENTRY_BROWSER_DENY_URLS,
  SENTRY_BROWSER_IGNORE_ERRORS,
} from '@sobok/observability'
import { scrubSentryEvent } from '../../../packages/observability/src/sentry'
import { installTranslatorDomGuard } from './utils/translator-dom-guard'

installTranslatorDomGuard()

// Errors are owned by Sentry. Faro provides RUM (Web Vitals, sessions, views, perf), browser→API distributed tracing.
initializeFaro({
  app: {
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
    name: 'sobok-browser',
    version: process.env.NEXT_PUBLIC_COMMIT_SHA,
  },
  instrumentations: [
    new SessionInstrumentation(),
    new ViewInstrumentation(),
    new WebVitalsInstrumentation(),
    new PerformanceInstrumentation(),
    new TracingInstrumentation({
      resourceAttributes: {
        'service.namespace': 'sobok',
      },
      instrumentations: getDefaultOTELInstrumentations({
        ignoreUrls: FARO_IGNORED_URLS,
      }),
    }),
  ],
  sessionTracking: {
    samplingRate: 0.5,
    persistent: true,
  },
  url: process.env.NEXT_PUBLIC_FARO_URL,
})

Sentry.init({
  ...createSentryInitOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'local',
    release: process.env.NEXT_PUBLIC_COMMIT_SHA,
    service: 'sobok-browser',
  }),
  beforeSend: (event) => (isBrowserNoiseEvent(event) ? null : scrubSentryEvent(event)),
  denyUrls: SENTRY_BROWSER_DENY_URLS,
  ignoreErrors: SENTRY_BROWSER_IGNORE_ERRORS,
  debug: false,
  sampleRate: 0.5,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
