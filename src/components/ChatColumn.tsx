// One column = one model. Monochrome design: hierarchy comes from type
// weight, spacing, and hairline borders — not color. The only color in a
// column is the model's tiny identity dot and the single indigo accent on
// the active switch.

import { useEffect, useRef } from 'react'
import type { ColumnState, ModelConfig } from '../types'
import { ToolCallTrace } from './ToolCallTrace'
import { Markdown } from './Markdown'

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
    <section className="flex min-h-0 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* column header: identity dot + model name + live status + switch */}
      <header className="flex items-center gap-2.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className={`h-2 w-2 shrink-0 rounded-full ${model.accent}`} />
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">{model.label}</h2>
        <span
          className={`text-sm ${state.status === 'error' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}
        >
          {STATUS_LABEL[state.status]}
        </span>
        {/* the include/exclude switch — indigo (the one accent color) = on */}
        <button
          onClick={onToggle}
          title={active ? 'On — click to exclude from sends' : 'Off — click to include in sends'}
          className={`relative ml-auto h-5 w-9 shrink-0 rounded-full transition-colors ${
            active ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              active ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </header>

      {/* dim the whole column when it's switched off, so the state is obvious */}
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ${active ? '' : 'opacity-40'}`}
      >
        {!hasKey && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm leading-relaxed text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No API key set for {model.label}. Add one in Settings to activate this column.
          </p>
        )}
        {!active && hasKey && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm leading-relaxed text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Switched off — this model won't receive prompts. Flip the switch above to include it.
          </p>
        )}

        {state.messages.map((msg, i) =>
          msg.role === 'user' ? (
            // user prompts: right-shifted, slightly raised surface
            <div
              key={i}
              className="ml-8 rounded-lg bg-zinc-100 px-3.5 py-2.5 text-base leading-relaxed text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {msg.content}
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {/* the tool chain sits between the question and the answer,
                  mirroring the order things actually happened */}
              {msg.toolCalls && msg.toolCalls.length > 0 && <ToolCallTrace toolCalls={msg.toolCalls} />}
              {msg.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-relaxed text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  {msg.error}
                </div>
              ) : msg.content.trim() !== '' ? (
                // answers: left-aligned, hairline border instead of a fill —
                // keeps long text calm and readable. Markdown renderer turns
                // the model's **bold** and bullets into real formatting.
                <div className="mr-8 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base leading-relaxed text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                  <Markdown content={msg.content} />
                </div>
              ) : (
                // model ran tools but sent no text back — say so instead of
                // rendering a confusing empty bubble
                <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
                  (no text in response — see tool calls above)
                </p>
              )}
              {msg.responseTimeMs !== undefined && (
                <p className="text-right text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {(msg.responseTimeMs / 1000).toFixed(2)}s
                </p>
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
              <div className="mr-8 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-base leading-relaxed text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                <Markdown content={state.draft} />
                <span className="animate-pulse text-zinc-400">▍</span>
              </div>
            ) : (
              <p className="animate-pulse text-sm text-zinc-500 dark:text-zinc-400">
                {state.status === 'tooling' ? 'running tools…' : 'thinking…'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
