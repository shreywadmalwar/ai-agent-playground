import { useCallback, useState } from 'react'
import type { ProviderId } from '../types'
import { MODELS } from '../types'

const KEYS_STORAGE = 'playground:keys'
const ACTIVE_STORAGE = 'playground:activeModels'

export type ApiKeys = Record<ProviderId, string>

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
  const [apiKeys, setApiKeysState] = useState<ApiKeys>(() => loadJson(KEYS_STORAGE, EMPTY_KEYS))
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
