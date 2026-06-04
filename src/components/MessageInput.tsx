// The single input bar at the bottom. Enter sends to every active model at
// once; Shift+Enter makes a newline. While models are running the send
// button flips into a Stop button. The button stretches to match the
// textarea height so they always line up.

import { useState } from 'react'

export function MessageInput({
  onSend,
  onStop,
  busy,
  disabled,
  disabledReason,
}: {
  onSend: (prompt: string) => void
  onStop: () => void
  busy: boolean
  disabled: boolean // true when zero models are sendable
  disabledReason: string // tells the user WHY it's disabled (no keys vs. all toggled off)
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const prompt = value.trim()
    if (!prompt || busy || disabled) return
    setValue('')
    onSend(prompt)
  }

  return (
    // items-stretch + self-stretch on the button = button height always
    // matches the textarea, even when the user drags it taller
    <div className="flex items-stretch gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter = send, Shift+Enter = newline (the convention everyone expects)
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        rows={2}
        placeholder={
          disabled ? disabledReason : 'Ask all active models… (Enter to send, Shift+Enter for newline)'
        }
        disabled={disabled}
        className="min-h-[3.5rem] flex-1 resize-y rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
      />
      {busy ? (
        <button
          onClick={onStop}
          className="self-stretch rounded-lg bg-red-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-red-500"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="self-stretch rounded-lg bg-indigo-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      )}
    </div>
  )
}
