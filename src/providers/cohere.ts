// Cohere - exposes an OpenAI-compatible layer at /compatibility/v1, so the
// shared session works as-is. Command A is their flagship; trial keys are
// free with rate limits.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createCohereSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://api.cohere.ai/compatibility',
    apiKey,
    model,
    providerLabel: 'Cohere',
    userPrompt,
    history,
  })
}
