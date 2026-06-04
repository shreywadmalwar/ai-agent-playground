// Cross-session stats, persisted in localStorage. Every completed response
// adds to a model's totals; the UI derives averages from them. A "session"
// is counted once per page load, the first time a model actually answers.

import { useCallback, useRef, useState } from 'react'
import type { LeaderboardEntry, ProviderId } from '../types'

const STORAGE_KEY = 'playground:leaderboard'

type Stats = Record<ProviderId, LeaderboardEntry>

const emptyEntry = (id: ProviderId): LeaderboardEntry => ({
  providerId: id,
  totalResponses: 0,
  totalTimeMs: 0,
  toolCallCount: 0,
  sessions: 0,
})

const emptyStats = (): Stats => ({
  gemini: emptyEntry('gemini'),
  groq: emptyEntry('groq'),
  openai: emptyEntry('openai'),
})

function load(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats()
    // Merge over the empty shape so old/partial data never crashes the UI.
    const parsed = JSON.parse(raw)
    const base = emptyStats()
    for (const id of Object.keys(base) as ProviderId[]) {
      base[id] = { ...base[id], ...parsed[id] }
    }
    return base
  } catch {
    return emptyStats()
  }
}

export function useLeaderboard() {
  const [stats, setStats] = useState<Stats>(load)
  // Tracks which models already got their "session" tick this page load.
  const sessionCounted = useRef<Set<ProviderId>>(new Set())

  const recordResult = useCallback((id: ProviderId, timeMs: number, toolCalls: number) => {
    setStats((prev) => {
      const entry = prev[id]
      const next: Stats = {
        ...prev,
        [id]: {
          ...entry,
          totalResponses: entry.totalResponses + 1,
          totalTimeMs: entry.totalTimeMs + Math.round(timeMs),
          toolCallCount: entry.toolCallCount + toolCalls,
          // First response from this model since the page loaded counts as
          // one session — refreshing and answering again counts a new one.
          sessions: entry.sessions + (sessionCounted.current.has(id) ? 0 : 1),
        },
      }
      sessionCounted.current.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    sessionCounted.current.clear()
    setStats(emptyStats())
  }, [])

  return { stats, recordResult, reset }
}
