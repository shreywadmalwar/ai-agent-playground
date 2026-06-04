// App shell: header (model toggles + leaderboard + settings), the three
// model columns side by side, and the shared input bar at the bottom.

import { useState } from 'react'
import { MODELS } from './types'
import { useSettings } from './hooks/useSettings'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useChat } from './hooks/useChat'
import { ChatColumn } from './components/ChatColumn'
import { ModelSelector } from './components/ModelSelector'
import { SettingsPanel } from './components/SettingsPanel'
import { MessageInput } from './components/MessageInput'
import { Leaderboard } from './components/Leaderboard'

export default function App() {
  const { apiKeys, setApiKey, activeModels, toggleModel, sendableModels } = useSettings()
  const { stats, recordResult, reset } = useLeaderboard()
  const { columns, send, stop, clear, isBusy } = useChat(apiKeys, recordResult)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-bold tracking-wide">
          ⚡ AI Agent Playground
          <span className="ml-2 font-normal text-zinc-500">one prompt, three models, live tool traces</span>
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <ModelSelector activeModels={activeModels} onToggle={toggleModel} />
          <button
            onClick={clear}
            title="Clear all conversations"
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
          >
            Clear
          </button>
          <button
            onClick={() => setLeaderboardOpen(true)}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="API keys"
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* the three columns — stacks on small screens, side by side from md up */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-3">
        {MODELS.map((m) => (
          <ChatColumn key={m.id} model={m} state={columns[m.id]} hasKey={apiKeys[m.id].trim() !== ''} />
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
