export type ProviderId = 'gemini' | 'groq' | 'openai'

export interface ToolCall {
  id: string
  name: string
  input: unknown
  output: string
  durationMs: number
  /** Which agent-loop iteration this call happened in (1-based). */
  step: number
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  responseTimeMs?: number
  error?: string
}

export interface ModelConfig {
  id: ProviderId
  label: string
  model: string
  accent: string
}

export interface LeaderboardEntry {
  providerId: ProviderId
  totalResponses: number
  totalTimeMs: number
  toolCallCount: number
  sessions: number
}

export type ColumnStatus = 'idle' | 'streaming' | 'tooling' | 'error'

export interface ColumnState {
  messages: Message[]
  status: ColumnStatus
  /** Partial assistant text while streaming. */
  draft: string
  /** Tool calls accumulated for the in-flight response. */
  draftToolCalls: ToolCall[]
  error?: string
}

export const MODELS: ModelConfig[] = [
  // gemini-flash-latest, not gemini-2.0-flash: Google cut free-tier quota to
  // zero on the older model (429 limit:0), the -latest alias still has it.
  { id: 'gemini', label: 'Gemini Flash (latest)', model: 'gemini-flash-latest', accent: 'text-sky-400' },
  { id: 'groq', label: 'Groq · Llama 3.3 70B', model: 'llama-3.3-70b-versatile', accent: 'text-orange-400' },
  { id: 'openai', label: 'OpenAI GPT-4o', model: 'gpt-4o', accent: 'text-emerald-400' },
]
