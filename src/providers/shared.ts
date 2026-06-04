// The heart of the playground: a provider-agnostic agent loop.
// Each provider (OpenAI, Groq, Gemini) only knows how to stream ONE turn and
// how to append messages in its own wire format — this file does the rest:
// run a turn, execute whatever tools the model asked for, feed results back,
// and repeat until the model gives a plain-text answer.

import type { ToolCall } from '../types'
import { executeTool } from '../tools'

/** A requested tool invocation parsed from a model response. */
export interface RequestedToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

/** Result of one streamed model turn. */
export interface TurnResult {
  text: string
  toolCalls: RequestedToolCall[]
}

export interface StreamCallbacks {
  onTextChunk: (text: string) => void
  onToolCall: (call: ToolCall) => void
  onStatus: (status: 'streaming' | 'tooling') => void
}

/**
 * Provider adapter: runs ONE model turn (streaming), returning final text and
 * any requested tool calls. `appendAssistantTurn`/`appendToolResults` let the
 * shared agent loop extend the provider-native message history.
 */
export interface ProviderSession {
  streamTurn: (signal: AbortSignal, onTextChunk: (t: string) => void) => Promise<TurnResult>
  appendAssistantTurn: (turn: TurnResult) => void
  appendToolResults: (results: { call: RequestedToolCall; output: string }[]) => void
}

const MAX_ITERATIONS = 5

export interface AgentLoopResult {
  text: string
  toolCalls: ToolCall[]
}

/**
 * Drives the agentic chain for one user message: stream a turn, execute any
 * requested tools client-side, feed results back, repeat until the model
 * answers in plain text (or the iteration cap is hit).
 */
export async function runAgentLoop(
  session: ProviderSession,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<AgentLoopResult> {
  const allToolCalls: ToolCall[] = []
  let finalText = ''

  for (let step = 1; step <= MAX_ITERATIONS; step++) {
    callbacks.onStatus('streaming')
    const turn = await session.streamTurn(signal, callbacks.onTextChunk)
    finalText += turn.text

    // No tool calls means the model is done thinking — this text is the answer.
    if (turn.toolCalls.length === 0) {
      return { text: finalText, toolCalls: allToolCalls }
    }

    // The model wants tools. Echo its turn into history first (the APIs
    // require the request before the response), then run each tool locally.
    callbacks.onStatus('tooling')
    session.appendAssistantTurn(turn)

    const results = turn.toolCalls.map((call) => {
      const started = performance.now()
      const output = executeTool(call.name, call.args)
      const executed: ToolCall = {
        id: call.id,
        name: call.name,
        input: call.args,
        output,
        durationMs: Math.round(performance.now() - started),
        step,
      }
      allToolCalls.push(executed)
      callbacks.onToolCall(executed)
      return { call, output }
    })

    session.appendToolResults(results)
    // ...and loop: the next streamTurn call sends the tool outputs back to
    // the model so it can either answer or chain another tool.
  }

  // Safety valve — a model stuck in a tool-calling loop stops here instead
  // of burning API credits forever.
  return {
    text: finalText + '\n\n_(stopped: max tool iterations reached)_',
    toolCalls: allToolCalls,
  }
}

/**
 * Reads an SSE stream from a fetch Response, invoking `onData` for each
 * `data:` payload (excluding the `[DONE]` sentinel).
 */
export async function readSse(response: Response, onData: (json: string) => void): Promise<void> {
  if (!response.body) throw new Error('Response has no body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Network chunks can split an SSE line anywhere, so we only process
    // complete lines and keep the trailing partial one in the buffer.
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '' || payload === '[DONE]') continue
      onData(payload)
    }
  }
}

/** Normalizes provider HTTP errors into readable messages. */
export async function throwHttpError(response: Response, provider: string): Promise<never> {
  let detail = ''
  try {
    const body = await response.json()
    detail = body?.error?.message ?? JSON.stringify(body)
  } catch {
    detail = response.statusText
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`${provider}: invalid API key (${response.status}). ${detail}`)
  }
  if (response.status === 429) {
    throw new Error(`${provider}: rate limited (429). ${detail}`)
  }
  throw new Error(`${provider}: HTTP ${response.status}. ${detail}`)
}
