// The four client-side tools every model can call. Each one is dead simple
// and runs entirely in the browser - the point isn't the tools themselves,
// it's watching HOW each model decides to use them.

import { evaluateExpression } from './calculator'

// We describe parameters in plain JSON Schema once, then convert to each
// provider's flavor below (OpenAI wraps it in {type:'function'}, Gemini
// wants functionDeclarations).
interface JsonSchemaProperty {
  type: string
  description: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
    required: string[]
  }
  execute: (args: Record<string, unknown>) => string
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'calculator',
    description:
      'Evaluates a math expression and returns the numeric result. Supports + - * / % ^ parentheses, and the functions sqrt, abs, round, floor, ceil, log, ln. Example: "sqrt(2^10) + abs(3 * -4)"',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'The math expression to evaluate' },
      },
      required: ['expression'],
    },
    execute: (args) => {
      const expression = String(args.expression ?? '')
      const result = evaluateExpression(expression)
      return JSON.stringify({ expression, result })
    },
  },
  {
    name: 'word_counter',
    description: 'Counts words, characters, and lines in a given text string.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to analyze' },
      },
      required: ['text'],
    },
    execute: (args) => {
      const text = String(args.text ?? '')
      const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
      return JSON.stringify({
        words,
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/g, '').length,
        lines: text === '' ? 0 : text.split('\n').length,
      })
    },
  },
  {
    name: 'current_datetime',
    description: 'Returns the current date and time (ISO 8601 plus a human-readable local string).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: () => {
      const now = new Date()
      return JSON.stringify({
        iso: now.toISOString(),
        local: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        unixSeconds: Math.floor(now.getTime() / 1000),
      })
    },
  },
  {
    name: 'json_formatter',
    description: 'Parses a JSON string and returns it pretty-printed with 2-space indentation.',
    parameters: {
      type: 'object',
      properties: {
        json: { type: 'string', description: 'The JSON string to format' },
      },
      required: ['json'],
    },
    execute: (args) => {
      const raw = String(args.json ?? '')
      return JSON.stringify(JSON.parse(raw), null, 2)
    },
  },
]

const toolMap = new Map(TOOLS.map((t) => [t.name, t]))

// Runs a tool by name. Errors come back as a STRING instead of throwing -
// that way the model sees "Error: division by zero" and can correct itself
// on the next turn instead of the whole chat blowing up.
export function executeTool(name: string, args: Record<string, unknown>): string {
  const tool = toolMap.get(name)
  if (!tool) return `Error: unknown tool "${name}"`
  try {
    return tool.execute(args)
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`
  }
}

/** OpenAI / Groq chat-completions `tools` format. */
export function toOpenAITools() {
  return TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

/** Gemini `tools.functionDeclarations` format (subset of JSON Schema only). */
export function toGeminiTools() {
  return [
    {
      functionDeclarations: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        // Gemini rejects empty properties objects on some models; omit parameters when empty
        ...(Object.keys(t.parameters.properties).length > 0 ? { parameters: t.parameters } : {}),
      })),
    },
  ]
}
