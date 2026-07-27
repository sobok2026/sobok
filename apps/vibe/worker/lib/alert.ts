// Best-effort Discord alert on money/ops-critical events (amount tampering, report-generation failure).
// The webhook URL is a Secrets Store secret; an empty value disables alerting (Workers Observability +
// console.error remain the durable record). Never throws — alerting must not break a request path.
export async function alertDiscord(webhookUrl: string, text: string): Promise<void> {
  if (!webhookUrl) {
    return
  }
  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({ content: text.slice(0, 1900) }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok) {
      console.error('deeptype.alert.rejected', { status: response.status })
    }
  } catch (error) {
    console.error('deeptype.alert.failed', { message: error instanceof Error ? error.message : String(error) })
  }
}
