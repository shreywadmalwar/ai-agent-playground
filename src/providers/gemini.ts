// Gemini speaks a different dialect than OpenAI: conversation lives in
// `contents` with user/model roles, tool calls come back as `functionCall`
// parts, and tool results go back as `functionResponse` parts inside a
// user-role message. Same agentic loop though — only the wire format differs.

import type { ProviderSession, RequestedToolCall, TurnResult } from './shared'
import { readSse, throwHttpError } from './shared'
import { toGeminiTools } from '../tools'

// A Gemini "part" is one piece of a message — plain text, a tool call the
// model wants to make, or a tool result we're sending back.
interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: Record<string, unknown> }
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

const SYSTEM_PROMPT =
  'You are a helpful assistant. You have tools available — use them whenever they help you answer accurately (math, counting, current time, JSON formatting) instead of guessing.'

export function createGeminiSession(
  apiKey: string,
  model: string,
  userPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): ProviderSession {
  // Gemini calls the assistant role "model". Build the running history the
  // same way as the OpenAI session: prior turns, then the new user prompt.
  const contents: GeminiContent[] = [
    ...history.map(
      (m): GeminiContent => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }),
    ),
    { role: 'user', parts: [{ text: userPrompt }] },
  ]

  return {
    async streamTurn(signal, onTextChunk) {
      // alt=sse makes Gemini stream Server-Sent Events instead of a JSON array.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
      const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          tools: toGeminiTools(),
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        }),
      })
      if (!response.ok) await throwHttpError(response, 'Gemini')

      let text = ''
      const toolCalls: RequestedToolCall[] = []

      await readSse(response, (payload) => {
        const chunk = JSON.parse(payload)
        // Each SSE chunk carries candidate parts — text streams in pieces,
        // functionCalls usually arrive whole (no fragment-stitching needed,
        // unlike OpenAI).
        const parts: GeminiPart[] = chunk.candidates?.[0]?.content?.parts ?? []
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text !== '') {
            text += part.text
            onTextChunk(part.text)
          }
          if (part.functionCall) {
            toolCalls.push({
              // Gemini doesn't assign call ids, so we make one up — only our
              // UI uses it, the API matches responses by function name.
              id: `gemini_${toolCalls.length}_${part.functionCall.name}`,
              name: part.functionCall.name,
              args: part.functionCall.args ?? {},
            })
          }
        }
      })

      return { text, toolCalls }
    },

    appendAssistantTurn(turn: TurnResult) {
      // Replay the model's turn into history: its text (if any) plus the
      // functionCall parts it made, so the functionResponses line up next.
      const parts: GeminiPart[] = []
      if (turn.text) parts.push({ text: turn.text })
      for (const call of turn.toolCalls) {
        parts.push({ functionCall: { name: call.name, args: call.args } })
      }
      contents.push({ role: 'model', parts })
    },

    appendToolResults(results) {
      // Tool outputs go back as functionResponse parts in ONE user message.
      // Gemini wants the response as an object, so we wrap the raw string.
      contents.push({
        role: 'user',
        parts: results.map(({ call, output }) => ({
          functionResponse: {
            name: call.name,
            response: { result: output },
          },
        })),
      })
    },
  }
}
