// The first page: pick which models to race before anything else. Cards
// show key status at a glance; the compare view only renders what's chosen
// here, so the layout stays sane no matter how many providers we add.

import type { ProviderId } from '../types'
import { MODELS } from '../types'
import type { ApiKeys } from '../hooks/useSettings'

export function ModelPicker({
  activeModels,
  onToggle,
  apiKeys,
  onCompare,
  onOpenSettings,
  onOpenAbout,
}: {
  activeModels: Record<ProviderId, boolean>
  onToggle: (id: ProviderId) => void
  apiKeys: ApiKeys
  onCompare: () => void
  onOpenSettings: () => void
  onOpenAbout: () => void
}) {
  // only models with keys can actually answer — count those for the CTA
  const runnable = MODELS.filter((m) => activeModels[m.id] && apiKeys[m.id].trim() !== '').length
  const selected = MODELS.filter((m) => activeModels[m.id]).length

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Choose models to compare
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Every selected model gets the same prompt and the same tools — side by side, streaming live.
      </p>
      {/* the short pitch; the full story lives on the about page */}
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        This is a browser-only lab for racing language models head-to-head. Each model can
        autonomously call tools (calculator, word counter, time, JSON formatter) and the full
        reasoning chain — which tool, what input, what came back — is shown live in each column. Keys
        stay in your browser; there's no backend.{' '}
        <button
          onClick={onOpenAbout}
          className="text-zinc-700 underline decoration-zinc-400 underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Learn more →
        </button>
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODELS.map((m) => {
          const hasKey = apiKeys[m.id].trim() !== ''
          const on = activeModels[m.id]
          // Selection reads through elevation, not color: selected cards sit
          // on a raised surface with a slightly stronger border; unselected
          // ones recede via opacity. Indigo stays reserved for the CTA —
          // with most cards selected, accent borders carry no information.
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                on
                  ? 'border-zinc-300 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-900'
                  : 'border-zinc-200 opacity-55 hover:opacity-80 dark:border-zinc-800'
              }`}
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.accent}`} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-zinc-900 dark:text-zinc-100">{m.label}</span>
                <span className="block truncate font-mono text-xs text-zinc-500">{m.model}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {hasKey ? 'key set' : 'no key — add in Settings'}
                </span>
              </span>
              {/* quiet check, monochrome like everything else */}
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition ${
                  on
                    ? 'border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-100'
                    : 'border-zinc-300 text-transparent dark:border-zinc-700'
                }`}
              >
                ✓
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onCompare}
          disabled={runnable === 0}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-base font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare {selected} model{selected === 1 ? '' : 's'} →
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Settings
        </button>
        {runnable === 0 && selected > 0 && (
          <span className="text-sm text-zinc-500">none of the selected models has an API key yet</span>
        )}
      </div>
    </div>
  )
}
