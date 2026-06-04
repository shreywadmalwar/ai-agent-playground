// All-time stats table inside the shared Modal shell. Data comes from
// useLeaderboard (localStorage), so it survives reloads until you hit Reset.

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
      title="🏆 Leaderboard"
      actions={
        <button
          onClick={onReset}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-400/40 dark:text-red-400 dark:hover:bg-red-400/10"
        >
          Reset stats
        </button>
      }
    >
      <table className="w-full text-left text-base">
        <thead>
          <tr className="border-b border-zinc-200 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th className="py-2 pr-3 font-medium">Model</th>
            <th className="py-2 pr-3 font-medium">Avg response</th>
            <th className="py-2 pr-3 font-medium">Responses</th>
            <th className="py-2 pr-3 font-medium">Tool calls</th>
            <th className="py-2 font-medium">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ model, entry, avgMs }, i) => (
            <tr key={model.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-700/50">
              <td className={`py-3 pr-3 font-semibold ${model.accent}`}>
                {/* medal for the fastest model that actually answered */}
                {i === 0 && avgMs !== Infinity && <span className="mr-1.5">🥇</span>}
                {model.label}
              </td>
              <td className="py-3 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                {avgMs === Infinity ? '—' : `${(avgMs / 1000).toFixed(2)}s`}
              </td>
              <td className="py-3 pr-3 text-zinc-700 dark:text-zinc-300">{entry.totalResponses}</td>
              <td className="py-3 pr-3 text-zinc-700 dark:text-zinc-300">{entry.toolCallCount}</td>
              <td className="py-3 text-zinc-700 dark:text-zinc-300">{entry.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Stats accumulate across sessions in localStorage. A session counts once per page load, per model.
      </p>
    </Modal>
  )
}
