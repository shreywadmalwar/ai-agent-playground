// The agentic chain, monochrome edition: steps separated by hairline
// dividers instead of colored cards, monospace for data, gray labels.
// No amber, no rainbow code colors - weight and spacing do the work.

import type { ToolCall } from '../types'

function pretty(value: unknown): string {
  // tool outputs are usually JSON-in-a-string - unpack and indent them so
  // they read as structure, not as a wall of characters
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value // plain text output, leave as-is
    }
  }
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
      className="rounded-lg border border-zinc-200 bg-zinc-50 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
      open={false}
    >
      <summary className="cursor-pointer select-none rounded-lg px-3.5 py-2.5 font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
        Tool calls ({toolCalls.length})
        <span className="ml-2 font-normal text-zinc-500">
          {/* quick inline summary so you can see the chain without expanding */}
          {toolCalls.map((c) => c.name).join(' → ')}
        </span>
      </summary>
      {/* hairline dividers between steps, no nested boxes */}
      <ol className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {toolCalls.map((call, i) => (
          <li key={call.id + i} className="px-3.5 py-2.5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {i + 1}. {call.name}
                {/* step = which loop iteration; lets you spot chained reasoning */}
                <span className="ml-2 text-xs font-normal text-zinc-500">step {call.step}</span>
              </span>
              <span className="text-xs tabular-nums text-zinc-500">{call.durationMs}ms</span>
            </div>
            {/* break-words (not break-all) so wraps land between words and
                JSON keys never split mid-name; values brightened to match
                conversation-text contrast */}
            <div className="space-y-1 font-mono text-[13px] leading-relaxed">
              <div>
                <span className="select-none text-zinc-400 dark:text-zinc-500">in&nbsp;&nbsp;→ </span>
                <span className="whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                  {pretty(call.input)}
                </span>
              </div>
              <div>
                <span className="select-none text-zinc-400 dark:text-zinc-500">out → </span>
                <span className="whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
                  {pretty(call.output)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
