// API key settings. A centered modal, not a flyout — three inputs don't need
// a full-height panel, and a modal keeps the eye in one place.

import { Modal } from './Modal'
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
  return (
    <Modal open={open} onClose={onClose} title="⚙️ API Keys">
      <p className="mb-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Keys are stored only in your browser's localStorage and sent directly to each provider — no
        backend involved.
      </p>

      <div className="space-y-5">
        {MODELS.map((m) => (
          <label key={m.id} className="block">
            <span className={`mb-1.5 block text-sm font-semibold ${m.accent}`}>{m.label}</span>
            <input
              type="password"
              value={apiKeys[m.id]}
              onChange={(e) => onSetKey(m.id, e.target.value)}
              placeholder={KEY_HINTS[m.id]}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 font-mono text-base text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
            />
          </label>
        ))}
      </div>
    </Modal>
  )
}
