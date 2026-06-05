// Settings live in localStorage: API keys plus which models are selected
// for comparison. Keys never leave the browser except in the actual API
// requests.

import { useCallback, useState } from 'react'
import type { ProviderId } from '../types'
import { MODELS } from '../types'

const KEYS_STORAGE = 'playground:keys'
const ACTIVE_STORAGE = 'playground:activeModels'

export type ApiKeys = Record<ProviderId, string>

// Keys can come from two places, in priority order:
//   1. what you typed in the Settings panel (localStorage)
//   2. a local .env.local file (VITE_*_API_KEY) - handy for dev so you don't
//      retype keys after clearing storage. .env.local is gitignored, so keys
//      never land on GitHub. (Remember: VITE_ vars get baked into the bundle,
//      so never ship a public build with keys in .env.local.)
const ENV_KEYS: ApiKeys = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY ?? '',
  groq: import.meta.env.VITE_GROQ_API_KEY ?? '',
  openai: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  cerebras: import.meta.env.VITE_CEREBRAS_API_KEY ?? '',
  openrouter: import.meta.env.VITE_OPENROUTER_API_KEY ?? '',
  mistral: import.meta.env.VITE_MISTRAL_API_KEY ?? '',
  cohere: import.meta.env.VITE_COHERE_API_KEY ?? '',
}

// Build the empty/default shapes from MODELS so adding a provider is a
// one-line change in types/index.ts, not a scavenger hunt through hooks.
const EMPTY_KEYS = Object.fromEntries(MODELS.map((m) => [m.id, ''])) as ApiKeys
const DEFAULT_ACTIVE = Object.fromEntries(MODELS.map((m) => [m.id, true])) as Record<ProviderId, boolean>

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
    // env keys only fill the gaps - anything typed in Settings wins
    return Object.fromEntries(MODELS.map((m) => [m.id, stored[m.id] || ENV_KEYS[m.id]])) as ApiKeys
  })
  const [activeModels, setActiveModelsState] = useState<Record<ProviderId, boolean>>(() =>
    loadJson(ACTIVE_STORAGE, DEFAULT_ACTIVE),
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

  /** Models that are selected AND have an API key set. */
  const sendableModels = MODELS.filter((m) => activeModels[m.id] && apiKeys[m.id].trim() !== '')

  return { apiKeys, setApiKey, activeModels, toggleModel, sendableModels }
}
