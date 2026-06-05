// Groq copied OpenAI's chat-completions API almost exactly, so one implementation
// covers both providers - we just swap the base URL and model name.
// This file handles the tricky part: streaming + tool calls at the same time.

import type { ProviderSession, RequestedToolCall, TurnResult } from './shared'
import { readSse, throwHttpError } from './shared'
import { toOpenAITools } from '../tools'

// OpenAI-style message shapes. Assistant messages can carry tool_calls,
// and tool results go back as role:'tool' messages tied by tool_call_id.
interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: {
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }[]
  tool_call_id?: string
}

const SYSTEM_PROMPT =
  'You are a helpful assistant. You have tools available - use them whenever they help you answer accurately (math, counting, current time, JSON formatting) instead of guessing.'

export function createOpenAiCompatibleSession(opts: {
  baseUrl: string // e.g. https://api.openai.com or https://api.groq.com/openai
  apiKey: string
  model: string
  providerLabel: string // only used to make error messages readable
  userPrompt: string
  history: { role: 'user' | 'assistant'; content: string }[]
}): ProviderSession {
  // Build the running message list for this whole agentic exchange.
  // We start from prior conversation history, then keep appending
  // assistant turns + tool results as the loop progresses.
  const messages: OpenAiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...opts.history.map((m): OpenAiMessage => ({ role: m.role, content: m.content })),
    { role: 'user', content: opts.userPrompt },
  ]

  return {
    async streamTurn(signal, onTextChunk) {
      const response = await fetch(`${opts.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model,
          messages,
          tools: toOpenAITools(),
          stream: true,
        }),
      })
      if (!response.ok) await throwHttpError(response, opts.providerLabel)

      let text = ''
      // Tool calls arrive in fragments across many SSE chunks: the first
      // fragment has the id + function name, then the arguments string
      // trickles in piece by piece. We stitch them together by `index`.
      const pending: Map<number, { id: string; name: string; argsJson: string }> = new Map()

      await readSse(response, (payload) => {
        const chunk = JSON.parse(payload)
        const delta = chunk.choices?.[0]?.delta
        if (!delta) return

        // Plain text tokens - stream them straight to the UI.
        if (typeof delta.content === 'string' && delta.content !== '') {
          text += delta.content
          onTextChunk(delta.content)
        }

        // Tool call fragments - accumulate until the stream ends.
        if (Array.isArray(delta.tool_calls)) {
          for (const fragment of delta.tool_calls) {
            const idx: number = fragment.index ?? 0
            const entry = pending.get(idx) ?? { id: '', name: '', argsJson: '' }
            if (fragment.id) entry.id = fragment.id
            if (fragment.function?.name) entry.name += fragment.function.name
            if (fragment.function?.arguments) entry.argsJson += fragment.function.arguments
            pending.set(idx, entry)
          }
        }
      })

      // Stream is done - now the accumulated argument strings are complete
      // JSON, safe to parse. A malformed one becomes {} so the tool can at
      // least respond with its own error instead of crashing the loop.
      const toolCalls: RequestedToolCall[] = [...pending.entries()]
        .sort(([a], [b]) => a - b)
        .map(([idx, entry]) => {
          let args: Record<string, unknown> = {}
          try {
            args = entry.argsJson ? JSON.parse(entry.argsJson) : {}
          } catch {
            // leave args empty - executeTool will surface a useful error
          }
          return { id: entry.id || `call_${idx}`, name: entry.name, args }
        })

      return { text, toolCalls }
    },

    appendAssistantTurn(turn: TurnResult) {
      // Echo the model's own turn back into history, tool calls included -
      // the API requires this so the upcoming role:'tool' messages have
      // something to attach to.
      messages.push({
        role: 'assistant',
        content: turn.text || null,
        tool_calls: turn.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: JSON.stringify(c.args) },
        })),
      })
    },

    appendToolResults(results) {
      // One role:'tool' message per executed call, matched by tool_call_id.
      for (const { call, output } of results) {
        messages.push({ role: 'tool', content: output, tool_call_id: call.id })
      }
    },
  }
}
