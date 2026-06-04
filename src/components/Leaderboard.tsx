// All-time stats table inside the shared Modal shell. Monochrome: identity
// dots for the models, tabular numbers, a quiet "fastest" tag instead of a
// medal emoji.

import { Modal } from './Modal'
import type { LeaderboardEntry, ProviderId } from '../types'
import { MODELS } from '../types'

export function Leaderboard({
  open,
  onClose,
  stats,
  onReset,
}: {
  open: boolean
  onClose: () => void
  stats: Record<ProviderId, LeaderboardEntry>
  onReset: () => void
}) {
  // Rank fastest-average first; models that never answered sink to the bottom.
  const rows = MODELS.map((m) => {
    const s = stats[m.id]
    const avgMs = s.totalResponses > 0 ? s.totalTimeMs / s.totalResponses : Infinity
    return { model: m, entry: s, avgMs }
  }).sort((a, b) => a.avgMs - b.avgMs)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Leaderboard"
      actions={
        <button
          onClick={onReset}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-600 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-400"
        >
          Reset stats
        </button>
      }
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <th className="py-2 pr-3 font-medium">Model</th>
            <th className="py-2 pr-3 font-medium">Avg response</th>
            <th className="py-2 pr-3 font-medium">Responses</th>
            <th className="py-2 pr-3 font-medium">Tool calls</th>
            <th className="py-2 font-medium">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ model, entry, avgMs }, i) => (
            <tr key={model.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
              <td className="py-3 pr-3">
                <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                  <span className={`h-1.5 w-1.5 rounded-full ${model.accent}`} />
                  {model.label}
                  {/* quiet tag for the fastest model that actually answered */}
                  {i === 0 && avgMs !== Infinity && (
                    <span className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      fastest
                    </span>
                  )}
                </span>
              </td>
              <td className="py-3 pr-3 tabular-nums text-zinc-900 dark:text-zinc-100">
                {avgMs === Infinity ? '—' : `${(avgMs / 1000).toFixed(2)}s`}
              </td>
              <td className="py-3 pr-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.totalResponses}</td>
              <td className="py-3 pr-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.toolCallCount}</td>
              <td className="py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-xs text-zinc-500">
        Stats accumulate across sessions in localStorage. A session counts once per page load, per model.
      </p>
    </Modal>
  )
}
