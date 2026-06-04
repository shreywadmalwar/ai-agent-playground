// One column = one model. Shows its full conversation, live streaming text,
// the tool chain per response, response times, and any error — everything
// you need to compare models side by side.

import { useEffect, useRef } from 'react'
import type { ColumnState, ModelConfig } from '../types'
import { ToolCallTrace } from './ToolCallTrace'

const STATUS_LABEL: Record<ColumnState['status'], string> = {
  idle: '',
  streaming: 'streaming…',
  tooling: 'calling tools…',
  error: 'error',
}

export function ChatColumn({
  model,
  state,
  hasKey,
}: {
  model: ModelConfig
  state: ColumnState
  hasKey: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest content in view while streaming.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.messages, state.draft, state.draftToolCalls])

  const busy = state.status === 'streaming' || state.status === 'tooling'

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
      {/* column header: model name + live status */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <h2 className={`text-sm font-semibold ${model.accent}`}>{model.label}</h2>
        <span className={`text-xs ${state.status === 'error' ? 'text-red-400' : 'text-zinc-400'}`}>
          {busy && <span className="mr-1 inline-block animate-pulse">●</span>}
          {STATUS_LABEL[state.status]}
        </span>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {!hasKey && (
          <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-500">
            No API key set for {model.label}. Add one in Settings (gear icon) to activate this column.
          </p>
        )}

        {state.messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="ml-6 rounded-lg bg-indigo-600/20 px-3 py-2 text-sm text-indigo-100">
              {msg.content}
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {/* the tool chain sits between the question and the answer,
                  mirroring the order things actually happened */}
              {msg.toolCalls && msg.toolCalls.length > 0 && <ToolCallTrace toolCalls={msg.toolCalls} />}
              {msg.error ? (
                <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                  {msg.error}
                </div>
              ) : (
                <div className="mr-6 whitespace-pre-wrap rounded-lg bg-zinc-800/70 px-3 py-2 text-sm text-zinc-100">
                  {msg.content}
                </div>
              )}
              {msg.responseTimeMs !== undefined && (
                <p className="text-right text-[10px] text-zinc-500">{(msg.responseTimeMs / 1000).toFixed(2)}s</p>
              )}
            </div>
          ),
        )}

        {/* in-flight response: tool calls appear live as the loop executes them,
            and the draft text streams in below */}
        {busy && (
          <div className="space-y-2">
            {state.draftToolCalls.length > 0 && <ToolCallTrace toolCalls={state.draftToolCalls} />}
            {state.draft && (
              <div className="mr-6 whitespace-pre-wrap rounded-lg bg-zinc-800/70 px-3 py-2 text-sm text-zinc-100">
                {state.draft}
                <span className="animate-pulse">▍</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
