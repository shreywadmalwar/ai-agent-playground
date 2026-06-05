// Groq - same OpenAI-compatible API, different host. Their OpenAI-flavored
// endpoints live under the /openai path prefix.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createGroqSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://api.groq.com/openai',
    apiKey,
    model,
    providerLabel: 'Groq',
    userPrompt,
    history,
  })
}
