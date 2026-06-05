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

  // Bar charts only make sense for models that have actually answered; the
  // max of each metric sets the 100% mark so the longest bar always fills
  // the track and the rest read as proportions of it.
  const answered = rows.filter((r) => r.avgMs !== Infinity)
  const maxAvg = Math.max(...answered.map((r) => r.avgMs), 1)
  const maxCalls = Math.max(...answered.map((r) => r.entry.toolCallCount), 1)

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
                {avgMs === Infinity ? '-' : `${(avgMs / 1000).toFixed(2)}s`}
              </td>
              <td className="py-3 pr-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.totalResponses}</td>
              <td className="py-3 pr-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.toolCallCount}</td>
              <td className="py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{entry.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Two quiet bar charts under the table: speed and tool-call appetite.
          Pure CSS - a chart library would be absurd for a handful of divs.
          Bars stay zinc; the identity dots are the only color, same as the
          table above. */}
      {answered.length > 0 && (
        <div className="mt-6 grid gap-6 border-t border-zinc-200 pt-5 sm:grid-cols-2 dark:border-zinc-800">
          {(
            [
              {
                heading: 'Avg response',
                value: (r: (typeof answered)[number]) => r.avgMs,
                max: maxAvg,
                format: (v: number) => `${(v / 1000).toFixed(2)}s`,
              },
              {
                heading: 'Tool calls',
                value: (r: (typeof answered)[number]) => r.entry.toolCallCount,
                max: maxCalls,
                format: (v: number) => String(v),
              },
            ] as const
          ).map(({ heading, value, max, format }) => (
            <div key={heading}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{heading}</h3>
              <div className="mt-3 space-y-2.5">
                {answered.map((r) => (
                  <div key={r.model.id} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.model.accent}`} />
                    <span className="w-28 truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {r.model.label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-[width] dark:bg-zinc-500"
                        style={{ width: `${(value(r) / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {format(value(r))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Stats accumulate across sessions in localStorage. A session counts once per page load, per model.
      </p>
    </Modal>
  )
}
