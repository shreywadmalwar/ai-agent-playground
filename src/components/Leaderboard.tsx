// Modal with the all-time stats table. Data comes from useLeaderboard
// (localStorage), so it survives reloads until you hit Reset.

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
  if (!open) return null

  // Rank fastest-average first; models that never answered sink to the bottom.
  const rows = MODELS.map((m) => {
    const s = stats[m.id]
    const avgMs = s.totalResponses > 0 ? s.totalTimeMs / s.totalResponses : Infinity
    return { model: m, entry: s, avgMs }
  }).sort((a, b) => a.avgMs - b.avgMs)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-zinc-300 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🏆 Leaderboard</h2>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Reset stats
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              ✕
            </button>
          </div>
        </div>

        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-zinc-300 text-sm text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3">Avg response</th>
              <th className="py-2 pr-3">Responses</th>
              <th className="py-2 pr-3">Tool calls</th>
              <th className="py-2">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ model, entry, avgMs }) => (
              <tr key={model.id} className="border-b border-zinc-200 dark:border-zinc-900">
                <td className={`py-2.5 pr-3 font-medium ${model.accent}`}>{model.label}</td>
                <td className="py-2.5 pr-3 text-zinc-800 dark:text-zinc-200">
                  {avgMs === Infinity ? '—' : `${(avgMs / 1000).toFixed(2)}s`}
                </td>
                <td className="py-2.5 pr-3 text-zinc-700 dark:text-zinc-300">{entry.totalResponses}</td>
                <td className="py-2.5 pr-3 text-zinc-700 dark:text-zinc-300">{entry.toolCallCount}</td>
                <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{entry.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-xs text-zinc-500">
          Stats accumulate across sessions in localStorage. A session counts once per page load, per model.
        </p>
      </div>
    </div>
  )
}
