// Cerebras — another OpenAI-compatible API, famous for very fast inference.
// gpt-oss-120b also streams `reasoning` deltas (it thinks out loud); our
// parser only reads content/tool_calls, so the reasoning is simply skipped.
import { createOpenAiCompatibleSession } from './openaiCompatible'
import type { ProviderSession } from './shared'

export function createCerebrasSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  return createOpenAiCompatibleSession({
    baseUrl: 'https://api.cerebras.ai',
    apiKey,
    model,
    providerLabel: 'Cerebras',
    userPrompt,
    history,
  })
}
