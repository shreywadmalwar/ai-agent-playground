// Slide-over panel for the three API keys. Password inputs so keys don't sit
// on screen; everything saves straight to localStorage on change.

import type { ProviderId } from '../types'
import { MODELS } from '../types'
import type { ApiKeys } from '../hooks/useSettings'

const KEY_HINTS: Record<ProviderId, string> = {
  gemini: 'Google AI Studio → Get API key',
  groq: 'console.groq.com → API Keys',
  openai: 'platform.openai.com → API keys',
}

export function SettingsPanel({
  open,
  onClose,
  apiKeys,
  onSetKey,
}: {
  open: boolean
  onClose: () => void
  apiKeys: ApiKeys
  onSetKey: (id: ProviderId, key: string) => void
}) {
  if (!open) return null

  return (
    // dim the rest of the app; clicking the backdrop closes the panel
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="h-full w-96 max-w-full overflow-y-auto border-l border-zinc-300 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          Keys are stored only in your browser's localStorage and sent directly to each provider. No
          backend involved.
        </p>

        <div className="space-y-4">
          {MODELS.map((m) => (
            <label key={m.id} className="block">
              <span className={`mb-1 block text-sm font-medium ${m.accent}`}>{m.label}</span>
              <input
                type="password"
                value={apiKeys[m.id]}
                onChange={(e) => onSetKey(m.id, e.target.value)}
                placeholder={KEY_HINTS[m.id]}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
            </label>
          ))}
        </div>
      </aside>
    </div>
  )
}
