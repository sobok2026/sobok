import type { Consumer, EachMessagePayload } from 'kafkajs'
import type { z } from 'zod'

import { kafka } from './client'

export type { EachMessagePayload }

export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({
    groupId,
    allowAutoTopicCreation: false,
  })
}

// A route stores its schema already welded to its handler. `handlers` is a heterogeneous map — every entry
// parses to a different event type — and no single type argument describes a map like that honestly: erasing to
// `unknown` breaks on the handler's contravariant parameter and erasing to `never` breaks on the schema, which
// is why this was `any`. So the pairing is closed over below and the map holds one opaque call instead.
export interface TopicRoute {
  run: (json: unknown, payload: EachMessagePayload) => Promise<void>
}

// Helper to preserve type inference for the handler callback
export function createTopicRoute<T>(
  schema: z.ZodType<T>,
  handle: (data: T, payload: EachMessagePayload) => Promise<void>,
): TopicRoute {
  return {
    run: async (json, payload) => {
      const parsed = schema.safeParse(json)

      if (!parsed.success) {
        console.error(`kafka: dropping invalid event from topic ${payload.topic}`, parsed.error.issues)
        return
      }

      await handle(parsed.data, payload)
    },
  }
}

export interface RunConsumerOptions {
  fromBeginning?: boolean
  partitionsConsumedConcurrently?: number
  handlers: Record<string, TopicRoute>
}

export async function runConsumer(
  consumer: Consumer,
  { fromBeginning = false, partitionsConsumedConcurrently, handlers }: RunConsumerOptions,
) {
  const topics = Object.keys(handlers)

  await consumer.connect()
  await consumer.subscribe({ topics, fromBeginning })

  await consumer.run({
    partitionsConsumedConcurrently,
    eachMessage: async (payload) => {
      const { topic, message } = payload
      const route = handlers[topic]

      if (!route) {
        console.error(`kafka: dropping message, no handler registered for topic ${topic}`)
        return
      }

      if (!message.value) {
        return
      }

      let json: unknown
      try {
        json = JSON.parse(message.value.toString())
      } catch {
        console.error(`kafka: dropping non-JSON message from topic ${topic}`)
        return
      }

      await route.run(json, payload)
    },
  })
}
