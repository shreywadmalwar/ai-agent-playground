// App shell with two views:
//   1. picker  - the landing page where you choose which models to race
//   2. compare - the side-by-side table of ONLY the selected models
// With 7+ providers, rendering everything at once stopped making sense;
// columns now flex to fill the row and scroll horizontally past four.

import { useCallback, useEffect, useRef, useState } from 'react'
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
  // phone header collapses everything but "back" into one overflow menu -
  // wrapping six pills into two rows ate a third of the screen
  const [menuOpen, setMenuOpen] = useState(false)

  const selectedModels = MODELS.filter((m) => activeModels[m.id])

  // On phones the side-by-side grid is hopeless - stacking seven full
  // conversations meant scrolling through one model's entire chat to reach
  // the next. Below md we show ONE column at a time and a tab strip to flip
  // between models; every column stays mounted so streams keep flowing and
  // scroll positions survive tab switches. Desktop keeps the grid.
  const [mobileModelId, setMobileModelId] = useState<string>(() => selectedModels[0]?.id ?? '')
  useEffect(() => {
    // if the visible model gets removed (or nothing was ever picked), fall
    // back to the first selected one so the mobile view never goes blank
    if (!selectedModels.some((m) => m.id === mobileModelId)) {
      setMobileModelId(selectedModels[0]?.id ?? '')
    }
  }, [selectedModels, mobileModelId])

  // The tab strip scrolls sideways past ~4 models, and a clipped name is the
  // only native hint that it does. Edge fades make the overflow explicit:
  // each side shows a gradient only while there's actually content hidden
  // beyond it, recomputed on scroll and resize.
  const tabsRef = useRef<HTMLElement>(null)
  const [tabFade, setTabFade] = useState({ left: false, right: false })
  const updateTabFade = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setTabFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])
  useEffect(() => {
    updateTabFade()
    window.addEventListener('resize', updateTabFade)
    return () => window.removeEventListener('resize', updateTabFade)
  }, [updateTabFade, selectedModels.length, view])

  // raised buttons - a light grey fill lifts them off the header, and a hairline
  // white inset along the top edge fakes a catch-light so they read as slightly
  // embossed. still monochrome zinc, just one surface step up instead of flat.
  const headerButton =
    'shrink-0 whitespace-nowrap rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)] dark:hover:bg-zinc-800 dark:hover:text-zinc-100'

  return (
    <div className="flex h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="relative flex items-center gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5 dark:border-zinc-800">
        <h1 className="truncate text-base font-semibold tracking-tight">
          AI Agent Playground
          <span className="ml-3 hidden text-sm font-normal text-zinc-500 lg:inline">
            One prompt, many models, live tool traces
          </span>
        </h1>

        {/* desktop: the full button row, exactly as before */}
        <div className="ml-auto hidden items-center gap-2 sm:flex">
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

        {/* phones: back stays inline (it's the one navigational action),
            everything else lives behind one overflow button so the header
            never grows past a single line */}
        <div className="ml-auto flex items-center gap-2 sm:hidden">
          {view === 'compare' && (
            <button onClick={() => setView('picker')} className={headerButton}>
              ← Models
            </button>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className={headerButton}
          >
            ⋯
          </button>
        </div>

        {menuOpen && (
          <>
            {/* invisible backdrop: any tap outside the menu dismisses it */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-full z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg sm:hidden dark:border-zinc-800 dark:bg-zinc-900">
              {(
                [
                  [theme === 'dark' ? 'Light mode' : 'Dark mode', toggleTheme],
                  ...(view === 'compare' ? ([['New chat', clear]] as const) : []),
                  ['Leaderboard', () => setLeaderboardOpen(true)],
                  ['Settings', () => setSettingsOpen(true)],
                  ...(view !== 'about' ? ([['About', () => setView('about')]] as const) : []),
                ] as const
              ).map(([label, action]) => (
                <button
                  key={label}
                  onClick={() => {
                    setMenuOpen(false)
                    action()
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
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
          {/* mobile tab strip: dot + provider name per selected model, the
              active one raised on a white surface. The dot doubles as a live
              status light - it pulses while that model streams or runs tools,
              and an error grows a small red companion dot - so you can see a
              background column finish without switching to it. Hidden at md+
              where the grid shows everything anyway. */}
          {selectedModels.length > 1 && (
            <div className="relative shrink-0 md:hidden">
              <nav
                ref={tabsRef}
                onScroll={updateTabFade}
                className="flex gap-1.5 overflow-x-auto border-b border-zinc-200 px-4 py-2 dark:border-zinc-800"
              >
                {selectedModels.map((m) => {
                  const status = columns[m.id]?.status
                  const busy = status === 'streaming' || status === 'tooling'
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMobileModelId(m.id)}
                      className={`flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm transition ${
                        m.id === mobileModelId
                          ? 'border-zinc-200 bg-white font-medium text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${m.accent} ${busy ? 'animate-pulse' : ''}`} />
                      {/* just the provider half of "Groq · Llama 3.3 70B" -
                          the column itself carries the full label on desktop */}
                      {m.label.split('·')[0].trim()}
                      {status === 'error' && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </button>
                  )
                })}
              </nav>
              {/* overflow hints: a fade on whichever edge still hides tabs */}
              {tabFade.left && (
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950" />
              )}
              {tabFade.right && (
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950" />
              )}
            </div>
          )}

          {/* count-aware grid: up to 3 models share one row; 4 becomes 2x2;
              5-6 becomes 3x2; 7+ becomes 4x2. Everything stays visible at
              once - no horizontal scrolling, no cut-off columns. Below md
              this is a flex column holding the single visible chat, which
              fills the screen and scrolls internally. */}
          <main
            className={`flex min-h-0 flex-1 flex-col gap-4 p-4 md:grid md:overflow-y-auto ${
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
              // hidden-not-unmounted on mobile: switching tabs must not kill
              // an in-flight stream or reset the conversation scroll
              <div
                key={m.id}
                className={`min-h-0 flex-1 md:flex ${m.id === mobileModelId ? 'flex' : 'hidden'}`}
              >
                <ChatColumn
                  model={m}
                  state={columns[m.id]}
                  hasKey={apiKeys[m.id].trim() !== ''}
                  onRemove={() => toggleModel(m.id)}
                  // with the tab strip up, the column header would repeat the
                  // same dot + name 50px below it - drop it on phones
                  headerHiddenOnMobile={selectedModels.length > 1}
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
