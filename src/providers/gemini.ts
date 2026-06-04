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
  // Thinking models sign their parts; the API REJECTS replayed functionCall
  // parts that are missing their signature ("missing thought_signature" 400),
  // so we have to capture these and echo them back verbatim.
  thoughtSignature?: string
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

  // Signatures captured during the last streamTurn, keyed by our generated
  // call id (plus one for the text part). appendAssistantTurn reads these —
  // both live in this closure, so no need to widen the shared types.
  let lastCallSignatures = new Map<string, string>()
  let lastTextSignature: string | undefined

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
      lastCallSignatures = new Map()
      lastTextSignature = undefined

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
            if (part.thoughtSignature) lastTextSignature = part.thoughtSignature
          }
          if (part.functionCall) {
            // Gemini doesn't assign call ids, so we make one up — only our
            // UI uses it, the API matches responses by function name.
            const id = `gemini_${toolCalls.length}_${part.functionCall.name}`
            if (part.thoughtSignature) lastCallSignatures.set(id, part.thoughtSignature)
            toolCalls.push({
              id,
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
      // Each part carries its captured thoughtSignature — without these the
      // API rejects the request with a "missing thought_signature" 400.
      const parts: GeminiPart[] = []
      if (turn.text) parts.push({ text: turn.text, thoughtSignature: lastTextSignature })
      for (const call of turn.toolCalls) {
        parts.push({
          functionCall: { name: call.name, args: call.args },
          thoughtSignature: lastCallSignatures.get(call.id),
        })
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
