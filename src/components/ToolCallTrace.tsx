// The whole point of this playground: showing the agentic chain. Each tool
// call renders as one step — tool name, what went in, what came out — inside
// a collapsible block so long chains don't bury the actual answer.
//
// Readability choices: an amber left-accent marks this as "tool territory" at
// a glance, step cards sit one elevation level UP from the block (lighter in
// dark mode, white in light), and code gets generous line height.

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
    <details
      className="rounded-lg border-l-4 border-amber-400 bg-amber-50 text-sm shadow-sm dark:border-amber-400/80 dark:bg-zinc-800"
      open={false}
    >
      <summary className="cursor-pointer select-none rounded-lg px-3 py-2.5 font-semibold text-amber-800 transition hover:bg-amber-100/60 dark:text-amber-300 dark:hover:bg-zinc-700/50">
        🔧 {toolCalls.length} tool call{toolCalls.length > 1 ? 's' : ''}
        <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-300">
          {/* quick inline summary so you can see the chain without expanding */}
          {toolCalls.map((c) => c.name).join(' → ')}
        </span>
      </summary>
      <ol className="space-y-2.5 px-3 pb-3">
        {toolCalls.map((call, i) => (
          <li
            key={call.id + i}
            className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm dark:border-zinc-600 dark:bg-zinc-700/60"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {i + 1}. {call.name}
                {/* step = which loop iteration; lets you spot chained reasoning */}
                <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">step {call.step}</span>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">{call.durationMs}ms</span>
            </div>
            <div className="space-y-1.5">
              {/* code sits on its own darker well so it reads as code */}
              <div className="rounded-md bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-900/80">
                <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-400">input →</span>
                <code className="whitespace-pre-wrap break-all leading-relaxed text-sky-700 dark:text-sky-300">
                  {pretty(call.input)}
                </code>
              </div>
              <div className="rounded-md bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-900/80">
                <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-400">output →</span>
                <code className="whitespace-pre-wrap break-all leading-relaxed text-emerald-700 dark:text-emerald-300">
                  {pretty(call.output)}
                </code>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
