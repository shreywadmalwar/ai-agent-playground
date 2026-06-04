// The conductor: one send() fans the prompt out to every active model at
// once. Each model gets its own column state, its own provider session, and
// its own agent loop — they stream independently and one failing never
// touches the others.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ColumnState, Message, ModelConfig, ProviderId, ToolCall } from '../types'
import { MODELS } from '../types'
import { runAgentLoop } from '../providers/shared'
import type { ProviderSession } from '../providers/shared'
import { createOpenAiSession } from '../providers/openai'
import { createGroqSession } from '../providers/groq'
import { createGeminiSession } from '../providers/gemini'
import { createCerebrasSession } from '../providers/cerebras'
import { createOpenRouterSession } from '../providers/openrouter'
import { createMistralSession } from '../providers/mistral'
import { createCohereSession } from '../providers/cohere'
import type { ApiKeys } from './useSettings'

const emptyColumn = (): ColumnState => ({
  messages: [],
  status: 'idle',
  draft: '',
  draftToolCalls: [],
})

type Columns = Record<ProviderId, ColumnState>

// Build the empty shape from MODELS so adding a provider never touches
// this file's state plumbing.
const emptyColumns = (): Columns =>
  Object.fromEntries(MODELS.map((m) => [m.id, emptyColumn()])) as Columns

// Conversations survive a refresh via localStorage. We only persist the
// finished messages — transient stuff (streaming drafts, status) makes no
// sense to restore, so every page load starts in a clean idle state with
// the history intact. Keep the last 50 messages per column so localStorage
// (~5MB) never fills up from marathon sessions.
const CHAT_STORAGE = 'playground:conversations'
const MAX_STORED_MESSAGES = 50

function loadColumns(): Columns {
  const fresh = emptyColumns()
  try {
    const raw = localStorage.getItem(CHAT_STORAGE)
    if (!raw) return fresh
    const stored = JSON.parse(raw)
    for (const id of Object.keys(fresh) as ProviderId[]) {
      if (Array.isArray(stored[id])) fresh[id].messages = stored[id]
    }
  } catch {
    // corrupted storage — just start clean rather than crash the app
  }
  return fresh
}

function saveColumns(columns: Columns) {
  try {
    const slim = Object.fromEntries(
      (Object.keys(columns) as ProviderId[]).map((id) => [
        id,
        columns[id].messages.slice(-MAX_STORED_MESSAGES),
      ]),
    )
    localStorage.setItem(CHAT_STORAGE, JSON.stringify(slim))
  } catch {
    // quota exceeded or storage unavailable — losing persistence is fine,
    // breaking the chat is not
  }
}

// Picks the right session factory for a model. History only carries the
// plain user/assistant text — tool chatter from previous turns stays out so
// each new prompt starts with a clean, compact context.
function createSession(
  model: ModelConfig,
  apiKey: string,
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  switch (model.id) {
    case 'openai':
      return createOpenAiSession(apiKey, model.model, prompt, history)
    case 'groq':
      return createGroqSession(apiKey, model.model, prompt, history)
    case 'gemini':
      return createGeminiSession(apiKey, model.model, prompt, history)
    case 'cerebras':
      return createCerebrasSession(apiKey, model.model, prompt, history)
    case 'openrouter':
      return createOpenRouterSession(apiKey, model.model, prompt, history)
    case 'mistral':
      return createMistralSession(apiKey, model.model, prompt, history)
    case 'cohere':
      return createCohereSession(apiKey, model.model, prompt, history)
  }
}

export function useChat(
  apiKeys: ApiKeys,
  recordResult: (id: ProviderId, timeMs: number, toolCalls: number) => void,
) {
  const [columns, setColumns] = useState<Columns>(loadColumns)
  const abortRef = useRef<AbortController | null>(null)

  // Persist whenever a conversation actually changes. The joined length
  // signature only moves when some column's messages array changes —
  // streaming chunks (draft-only updates) never trigger a write.
  const messagesSignature = MODELS.map((m) => columns[m.id].messages.length).join(',')
  useEffect(() => {
    saveColumns(columns)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesSignature])

  // Tiny helper so every state update below stays a one-liner.
  const patch = useCallback((id: ProviderId, updater: (col: ColumnState) => ColumnState) => {
    setColumns((prev) => ({ ...prev, [id]: updater(prev[id]) }))
  }, [])

  const isBusy = Object.values(columns).some((c) => c.status === 'streaming' || c.status === 'tooling')

  const send = useCallback(
    async (prompt: string, activeIds: ProviderId[]) => {
      if (!prompt.trim() || activeIds.length === 0) return
      const controller = new AbortController()
      abortRef.current = controller

      const userMessage: Message = { role: 'user', content: prompt }

      // Kick off one independent run per active model.
      const runs = activeIds.map(async (id) => {
        const model = MODELS.find((m) => m.id === id)!

        // Snapshot this column's history BEFORE adding the new user message.
        let history: { role: 'user' | 'assistant'; content: string }[] = []
        setColumns((prev) => {
          history = prev[id].messages
            .filter((m) => !m.error)
            .map((m) => ({ role: m.role, content: m.content }))
          return prev
        })

        patch(id, (col) => ({
          ...col,
          messages: [...col.messages, userMessage],
          status: 'streaming',
          draft: '',
          draftToolCalls: [],
          error: undefined,
        }))

        const session = createSession(model, apiKeys[id], prompt, history)
        const started = performance.now()

        try {
          const result = await runAgentLoop(
            session,
            {
              onTextChunk: (t) => patch(id, (col) => ({ ...col, draft: col.draft + t })),
              onToolCall: (call: ToolCall) =>
                patch(id, (col) => ({ ...col, draftToolCalls: [...col.draftToolCalls, call] })),
              onStatus: (status) => patch(id, (col) => ({ ...col, status })),
            },
            controller.signal,
          )

          const elapsed = performance.now() - started
          // Promote the draft into a real message and clear the streaming state.
          patch(id, (col) => ({
            ...col,
            status: 'idle',
            draft: '',
            draftToolCalls: [],
            messages: [
              ...col.messages,
              {
                role: 'assistant',
                content: result.text,
                toolCalls: result.toolCalls,
                responseTimeMs: Math.round(elapsed),
              },
            ],
          }))
          recordResult(id, elapsed, result.toolCalls.length)
        } catch (err) {
          // Aborts are the user clicking Stop — not an error worth shouting about.
          const aborted = err instanceof DOMException && err.name === 'AbortError'
          const message = aborted ? 'Stopped' : err instanceof Error ? err.message : String(err)
          patch(id, (col) => ({
            ...col,
            status: aborted ? 'idle' : 'error',
            error: aborted ? undefined : message,
            draft: '',
            draftToolCalls: [],
            messages: aborted
              ? col.messages
              : [...col.messages, { role: 'assistant', content: '', error: message }],
          }))
        }
      })

      // Let all models finish in their own time; we never block one on another.
      await Promise.allSettled(runs)
      abortRef.current = null
    },
    [apiKeys, patch, recordResult],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const clear = useCallback(() => {
    localStorage.removeItem(CHAT_STORAGE)
    setColumns(emptyColumns())
  }, [])

  return { columns, send, stop, clear, isBusy }
}
