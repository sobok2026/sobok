export type TemplateTokens = {
  GF?: string
  H?: string
  T?: string
}

// {GF} must resolve before {T}/{H} — gemGroupFlavor text itself still contains a literal "{H}" token that
// only gets resolved on this second pass (mirrors the two-step tpl()/buildGem() substitution in the
// source prototype).
export function interpolate(text: string, tokens: TemplateTokens): string {
  let result = text

  if (tokens.GF !== undefined) {
    result = result.split('{GF}').join(tokens.GF)
  }

  if (tokens.T !== undefined) {
    result = result.split('{T}').join(tokens.T)
  }

  if (tokens.H !== undefined) {
    result = result.split('{H}').join(tokens.H)
  }

  return result
}
