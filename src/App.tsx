// App shell: header (theme toggle + leaderboard + settings), the three model
// columns side by side, and the shared input bar at the bottom.
// Monochrome design language: deep neutral surfaces, hairline borders, type
// hierarchy — indigo appears ONLY on the primary action and active switches.

import { useState } from 'react'
import { MODELS } from './types'
import { useSettings } from './hooks/useSettings'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useChat } from './hooks/useChat'
import { useTheme } from './hooks/useTheme'
import { ChatColumn } from './components/ChatColumn'
import { SettingsPanel } from './components/SettingsPanel'
import { MessageInput } from './components/MessageInput'
import { Leaderboard } from './components/Leaderboard'

export default function App() {
  const { apiKeys, setApiKey, activeModels, toggleModel, sendableModels } = useSettings()
  const { stats, recordResult, reset } = useLeaderboard()
  const { columns, send, stop, clear, isBusy } = useChat(apiKeys, recordResult)
  const { theme, toggleTheme } = useTheme()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  // quiet ghost buttons — text does the talking, surface only on hover
  const headerButton =
    'rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'

  return (
    <div className="flex h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <h1 className="text-base font-semibold tracking-tight">
          AI Agent Playground
          <span className="ml-3 hidden text-sm font-normal text-zinc-500 lg:inline">
            one prompt, three models, live tool traces
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} title="Toggle dark/light mode" className={headerButton}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={clear} title="Clear all conversations" className={headerButton}>
            Clear
          </button>
          <button onClick={() => setLeaderboardOpen(true)} className={headerButton}>
            Leaderboard
          </button>
          <button onClick={() => setSettingsOpen(true)} title="API keys" className={headerButton}>
            Settings
          </button>
        </div>
      </header>

      {/* the three columns — stacks on small screens, side by side from md up */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-3">
        {MODELS.map((m) => (
          <ChatColumn
            key={m.id}
            model={m}
            state={columns[m.id]}
            hasKey={apiKeys[m.id].trim() !== ''}
            active={activeModels[m.id]}
            onToggle={() => toggleModel(m.id)}
          />
        ))}
      </main>

      <MessageInput
        onSend={(prompt) =>
          // only send to models that are toggled on AND have a key
          send(
            prompt,
            sendableModels.map((m) => m.id),
          )
        }
        onStop={stop}
        busy={isBusy}
        disabled={sendableModels.length === 0}
        disabledReason={
          // two different ways to end up with zero sendable models — say which one it is
          MODELS.some((m) => apiKeys[m.id].trim() !== '')
            ? 'All models are switched off — flip a switch in a column header to enable one'
            : 'Add an API key in Settings to start chatting…'
        }
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKeys={apiKeys}
        onSetKey={setApiKey}
      />
      <Leaderboard
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        stats={stats}
        onReset={reset}
      />
    </div>
  )
}
