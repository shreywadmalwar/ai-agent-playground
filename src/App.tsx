// App shell with two views:
//   1. picker  - the landing page where you choose which models to race
//   2. compare - the side-by-side table of ONLY the selected models
// With 7+ providers, rendering everything at once stopped making sense;
// columns now flex to fill the row and scroll horizontally past four.

import { useCallback, useEffect, useState } from 'react'
import { MODELS } from './types'
import { useSettings } from './hooks/useSettings'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useChat } from './hooks/useChat'
import { useTheme } from './hooks/useTheme'
import { ChatColumn } from './components/ChatColumn'
import { ModelPicker } from './components/ModelPicker'
import { About } from './components/About'
import { SettingsPanel } from './components/SettingsPanel'
import { MessageInput } from './components/MessageInput'
import { Leaderboard } from './components/Leaderboard'

export default function App() {
  const { apiKeys, setApiKey, activeModels, toggleModel, sendableModels } = useSettings()
  const { stats, recordResult, reset } = useLeaderboard()
  const { columns, send, stop, clear, isBusy } = useChat(apiKeys, recordResult)
  const { theme, toggleTheme } = useTheme()

  // The view survives refreshes: mid-conversation reloads land back in the
  // compare table, not on the landing page. First-time visitors (nothing
  // stored) start at the picker. The about page is hash-routed (#/about) so
  // it's linkable and the browser back button works - no router library
  // needed for a static GitHub Pages deploy.
  type View = 'picker' | 'compare' | 'about'
  const storedView = (): View =>
    localStorage.getItem('playground:view') === 'compare' ? 'compare' : 'picker'
  const [view, setViewState] = useState<View>(() =>
    window.location.hash === '#/about' ? 'about' : storedView(),
  )
  const setView = useCallback((v: View) => {
    if (v !== 'about') localStorage.setItem('playground:view', v)
    // keep the URL honest; pushes a history entry so Back leaves the about page
    if (v === 'about' && window.location.hash !== '#/about') window.location.hash = '#/about'
    if (v !== 'about' && window.location.hash === '#/about') window.location.hash = ''
    setViewState(v)
  }, [])
  // browser back/forward between #/about and the app
  useEffect(() => {
    const onHash = () => setViewState(window.location.hash === '#/about' ? 'about' : storedView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  const selectedModels = MODELS.filter((m) => activeModels[m.id])

  // quiet ghost buttons - text does the talking, surface only on hover
  const headerButton =
    'rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'

  return (
    <div className="flex h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <h1 className="text-base font-semibold tracking-tight">
          AI Agent Playground
          <span className="ml-3 hidden text-sm font-normal text-zinc-500 lg:inline">
            One prompt, many models, live tool traces
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {view === 'compare' && (
            <button onClick={() => setView('picker')} className={headerButton}>
              ← Models
            </button>
          )}
          <button onClick={toggleTheme} title="Toggle dark/light mode" className={headerButton}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {view === 'compare' && (
            <button
              onClick={clear}
              title="Start a fresh session - clears all conversations (keys and stats are kept)"
              className={headerButton}
            >
              New chat
            </button>
          )}
          <button onClick={() => setLeaderboardOpen(true)} className={headerButton}>
            Leaderboard
          </button>
          <button onClick={() => setSettingsOpen(true)} title="API keys" className={headerButton}>
            Settings
          </button>
          {view !== 'about' && (
            <button onClick={() => setView('about')} title="About this project" className={headerButton}>
              About
            </button>
          )}
        </div>
      </header>

      {/* key={view} remounts this wrapper on navigation, replaying the
          view-in animation; flex column so each view keeps its own sizing */}
      <div key={view} className="view-transition flex min-h-0 flex-1 flex-col">
      {view === 'about' ? (
        <About onBack={() => setView(storedView())} />
      ) : view === 'picker' ? (
        <ModelPicker
          activeModels={activeModels}
          onToggle={toggleModel}
          apiKeys={apiKeys}
          onCompare={() => setView('compare')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAbout={() => setView('about')}
        />
      ) : (
        <>
          {/* count-aware grid: up to 3 models share one row; 4 becomes 2x2;
              5-6 becomes 3x2; 7+ becomes 4x2. Everything stays visible at
              once - no horizontal scrolling, no cut-off columns. On small
              screens it stacks vertically with a sane minimum height. */}
          <main
            className={`grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 ${
              selectedModels.length <= 1
                ? 'md:grid-cols-1'
                : selectedModels.length === 2
                  ? 'md:grid-cols-2'
                  : selectedModels.length === 3
                    ? 'md:grid-cols-3'
                    : selectedModels.length === 4
                      ? 'md:grid-cols-2 md:grid-rows-2'
                      : selectedModels.length <= 6
                        ? 'md:grid-cols-3 md:grid-rows-2'
                        : 'md:grid-cols-4 md:grid-rows-2'
            }`}
          >
            {selectedModels.map((m) => (
              <div key={m.id} className="flex min-h-96 md:min-h-0">
                <ChatColumn
                  model={m}
                  state={columns[m.id]}
                  hasKey={apiKeys[m.id].trim() !== ''}
                  onRemove={() => toggleModel(m.id)}
                />
              </div>
            ))}
          </main>

          <MessageInput
            onSend={(prompt) =>
              // only send to models that are selected AND have a key
              send(
                prompt,
                sendableModels.map((m) => m.id),
              )
            }
            onStop={stop}
            busy={isBusy}
            disabled={sendableModels.length === 0}
            disabledReason={
              MODELS.some((m) => apiKeys[m.id].trim() !== '')
                ? 'No selected model has an API key - pick models or add keys in Settings'
                : 'Add an API key in Settings to start chatting…'
            }
          />
        </>
      )}
      </div>

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
