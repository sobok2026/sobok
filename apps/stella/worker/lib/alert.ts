// Best-effort Discord alert for moderation/ops events (report-storm auto-hides, purge errors). The webhook
// URL is a Secrets Store secret; an empty value disables alerting (Workers Observability + console remain the
// durable record). Never throws — alerting must not break a request path.
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
