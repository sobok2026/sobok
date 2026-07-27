// Best-effort Discord alert for ops-critical events (moderation storms, payment tampering, cron failures).
// The webhook URL is a Secrets Store secret; an empty value disables alerting (Workers Observability +
// console remain the durable record). Never throws — alerting must not break a request path.
//
// Callers decide what is worth alerting on, and are responsible for NOT putting identifiers in the text:
// the money paths send the event kind only, never a purchase or payment id.
export async function alertDiscord(webhookUrl: string, text: string): Promise<void> {
  if (!webhookUrl) {
    return
  }

  try {
    await fetch(webhookUrl, {
      body: JSON.stringify({ content: text.slice(0, 1900) }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  } catch {
    // swallow — alerts are advisory
  }
}
