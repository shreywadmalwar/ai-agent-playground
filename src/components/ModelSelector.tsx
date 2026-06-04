// Pill toggles in the header — click a model to include/exclude it from the
// next send. Greyed out means it won't receive prompts.

import type { ProviderId } from '../types'
import { MODELS } from '../types'

export function ModelSelector({
  activeModels,
  onToggle,
}: {
  activeModels: Record<ProviderId, boolean>
  onToggle: (id: ProviderId) => void
}) {
  return (
    <div className="flex gap-2">
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => onToggle(m.id)}
          title={activeModels[m.id] ? 'Click to exclude from sends' : 'Click to include in sends'}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            activeModels[m.id]
              ? 'border-indigo-500 bg-indigo-600/30 text-indigo-100'
              : 'border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
          }`}
        >
          {/* explicit on/off dot so it reads as a toggle, not a label */}
          <span className={activeModels[m.id] ? 'text-emerald-400' : 'text-zinc-600'}>●</span>{' '}
          {m.label}
        </button>
      ))}
    </div>
  )
}
