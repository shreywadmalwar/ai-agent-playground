// One column = one model. Shows its full conversation, live streaming text,
// the tool chain per response, response times, and any error — everything
// you need to compare models side by side. The switch in the header is THE
// way to include/exclude a model from sends (replaced the old header pills).

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
  active,
  onToggle,
}: {
  model: ModelConfig
  state: ColumnState
  hasKey: boolean
  active: boolean // toggled on = receives prompts
  onToggle: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest content in view while streaming.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.messages, state.draft, state.draftToolCalls])

  const busy = state.status === 'streaming' || state.status === 'tooling'

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* column header: model name + live status + on/off switch */}
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className={`text-base font-semibold ${model.accent}`}>{model.label}</h2>
        <span className={`text-sm ${state.status === 'error' ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {busy && <span className="mr-1 inline-block animate-pulse">●</span>}
          {STATUS_LABEL[state.status]}
        </span>
        {/* the include/exclude switch — green = gets the next prompt */}
        <button
          onClick={onToggle}
          title={active ? 'On — click to exclude from sends' : 'Off — click to include in sends'}
          className={`relative ml-auto h-6 w-11 shrink-0 rounded-full transition-colors ${
            active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              active ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </header>

      {/* dim the whole column when it's switched off, so the state is obvious */}
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-3 ${active ? '' : 'opacity-40'}`}
      >
        {!hasKey && (
          <p className="rounded-lg border border-dashed border-zinc-400 p-3 text-sm text-zinc-500 dark:border-zinc-700">
            No API key set for {model.label}. Add one in Settings (gear icon) to activate this column.
          </p>
        )}
        {!active && hasKey && (
          <p className="rounded-lg border border-dashed border-zinc-400 p-3 text-sm text-zinc-500 dark:border-zinc-700">
            Switched off — this model won't receive prompts. Flip the switch above to include it.
          </p>
        )}

        {state.messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div
              key={i}
              className="ml-6 rounded-lg bg-indigo-100 px-3 py-2 text-base text-indigo-900 dark:bg-indigo-600/20 dark:text-indigo-100"
            >
              {msg.content}
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {/* the tool chain sits between the question and the answer,
                  mirroring the order things actually happened */}
              {msg.toolCalls && msg.toolCalls.length > 0 && <ToolCallTrace toolCalls={msg.toolCalls} />}
              {msg.error ? (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {msg.error}
                </div>
              ) : msg.content.trim() !== '' ? (
                <div className="mr-6 whitespace-pre-wrap rounded-lg bg-zinc-100 px-3 py-2 text-base text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-100">
                  {msg.content}
                </div>
              ) : (
                // model ran tools but sent no text back — say so instead of
                // rendering a confusing empty bubble
                <p className="text-sm italic text-zinc-500">(no text in response — see tool calls above)</p>
              )}
              {msg.responseTimeMs !== undefined && (
                <p className="text-right text-xs text-zinc-500">{(msg.responseTimeMs / 1000).toFixed(2)}s</p>
              )}
            </div>
          ),
        )}

        {/* in-flight response: tool calls appear live as the loop executes
            them, the draft text types in below with a cursor, and if there's
            no text yet we still show SOMETHING so the column never looks dead */}
        {busy && (
          <div className="space-y-2">
            {state.draftToolCalls.length > 0 && <ToolCallTrace toolCalls={state.draftToolCalls} />}
            {state.draft ? (
              <div className="mr-6 whitespace-pre-wrap rounded-lg bg-zinc-100 px-3 py-2 text-base text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-100">
                {state.draft}
                <span className="animate-pulse">▍</span>
              </div>
            ) : (
              <p className="animate-pulse text-sm text-zinc-500">
                {state.status === 'tooling' ? '🔧 running tools…' : '✦ thinking…'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
