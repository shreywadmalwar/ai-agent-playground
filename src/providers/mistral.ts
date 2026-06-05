// Mistral - OpenAI-compatible API at api.mistral.ai. mistral-small-latest
// is on the free tier and supports tool calling.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createMistralSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://api.mistral.ai',
    apiKey,
    model,
    providerLabel: 'Mistral',
    userPrompt,
    history,
  })
}
