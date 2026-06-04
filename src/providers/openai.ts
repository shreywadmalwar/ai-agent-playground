// OpenAI — just the OpenAI-compatible session pointed at api.openai.com.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createOpenAiSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://api.openai.com',
    apiKey,
    model,
    providerLabel: 'OpenAI',
    userPrompt,
    history,
  })
}
