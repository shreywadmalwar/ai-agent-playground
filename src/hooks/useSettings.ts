// Settings live in localStorage: the three API keys plus which models are
// toggled on. Keys never leave the browser except in the actual API requests.

import { useCallback, useState } from 'react'
import type { ProviderId } from '../types'
import { MODELS } from '../types'

const KEYS_STORAGE = 'playground:keys'
const ACTIVE_STORAGE = 'playground:activeModels'

export type ApiKeys = Record<ProviderId, string>

// Keys can come from two places, in priority order:
//   1. what you typed in the Settings panel (localStorage)
//   2. a local .env.local file (VITE_*_API_KEY) — handy for dev so you don't
//      retype keys after clearing storage. .env.local is gitignored, so keys
//      never land on GitHub. (Remember: VITE_ vars get baked into the bundle,
//      so never ship a public build with keys in .env.local.)
const ENV_KEYS: ApiKeys = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY ?? '',
  groq: import.meta.env.VITE_GROQ_API_KEY ?? '',
  openai: import.meta.env.VITE_OPENAI_API_KEY ?? '',
}

const EMPTY_KEYS: ApiKeys = { gemini: '', groq: '', openai: '' }

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function useSettings() {
  const [apiKeys, setApiKeysState] = useState<ApiKeys>(() => {
    const stored = loadJson(KEYS_STORAGE, EMPTY_KEYS)
    // env keys only fill the gaps — anything typed in Settings wins
    return {
      gemini: stored.gemini || ENV_KEYS.gemini,
      groq: stored.groq || ENV_KEYS.groq,
      openai: stored.openai || ENV_KEYS.openai,
    }
  })
  const [activeModels, setActiveModelsState] = useState<Record<ProviderId, boolean>>(() =>
    loadJson(ACTIVE_STORAGE, { gemini: true, groq: true, openai: true }),
  )

  const setApiKey = useCallback((id: ProviderId, key: string) => {
    setApiKeysState((prev) => {
      const next = { ...prev, [id]: key }
      localStorage.setItem(KEYS_STORAGE, JSON.stringify(next))
      return next
    })
  }, [])

  const toggleModel = useCallback((id: ProviderId) => {
    setActiveModelsState((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(ACTIVE_STORAGE, JSON.stringify(next))
      return next
    })
  }, [])

  /** Models that are toggled on AND have an API key set. */
  const sendableModels = MODELS.filter((m) => activeModels[m.id] && apiKeys[m.id].trim() !== '')

  return { apiKeys, setApiKey, activeModels, toggleModel, sendableModels }
}
