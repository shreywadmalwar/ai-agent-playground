// The whole point of this playground: showing the agentic chain. Each tool
// call renders as one step — tool name, what went in, what came out — inside
// a collapsible block so long chains don't bury the actual answer.

import type { ToolCall } from '../types'

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function ToolCallTrace({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (toolCalls.length === 0) return null

  return (
    <details className="group rounded-lg border border-zinc-700 bg-zinc-900/60 text-xs" open={false}>
      <summary className="cursor-pointer select-none px-3 py-2 font-medium text-amber-300/90 hover:text-amber-200">
        🔧 {toolCalls.length} tool call{toolCalls.length > 1 ? 's' : ''}
        <span className="ml-2 text-zinc-500">
          {/* quick inline summary so you can see the chain without expanding */}
          {toolCalls.map((c) => c.name).join(' → ')}
        </span>
      </summary>
      <ol className="space-y-2 px-3 pb-3">
        {toolCalls.map((call, i) => (
          <li key={call.id + i} className="rounded-md border border-zinc-800 bg-zinc-950/70 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-amber-300">
                {i + 1}. {call.name}
                {/* step = which loop iteration; lets you spot chained reasoning */}
                <span className="ml-2 font-normal text-zinc-500">step {call.step}</span>
              </span>
              <span className="text-zinc-500">{call.durationMs}ms</span>
            </div>
            <div className="grid gap-1">
              <div>
                <span className="text-zinc-400">input → </span>
                <code className="whitespace-pre-wrap break-all text-sky-300">{pretty(call.input)}</code>
              </div>
              <div>
                <span className="text-zinc-400">output → </span>
                <code className="whitespace-pre-wrap break-all text-emerald-300">{pretty(call.output)}</code>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
