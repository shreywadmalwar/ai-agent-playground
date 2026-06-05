// OpenRouter - a meta-provider routing to hundreds of models behind one
// OpenAI-compatible API. We use the free Nemotron 3 Ultra. Their stream
// sends ": OPENROUTER PROCESSING" keepalive comments; the SSE reader only
// looks at data: lines, so those are ignored automatically.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createOpenRouterSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://openrouter.ai/api',
    apiKey,
    model,
    providerLabel: 'OpenRouter',
    userPrompt,
    history,
  })
}
