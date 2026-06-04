// The single input bar at the bottom. Enter sends to every active model at
// once; Shift+Enter makes a newline. While models are running the send
// button flips into a Stop button.

import { useState } from 'react'

export function MessageInput({
  onSend,
  onStop,
  busy,
  disabled,
}: {
  onSend: (prompt: string) => void
  onStop: () => void
  busy: boolean
  disabled: boolean // true when zero models are sendable
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const prompt = value.trim()
    if (!prompt || busy || disabled) return
    setValue('')
    onSend(prompt)
  }

  return (
    <div className="flex items-end gap-2 border-t border-zinc-800 bg-zinc-950 p-3">
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
          disabled
            ? 'Add an API key in Settings to start chatting…'
            : 'Ask all active models… (Enter to send, Shift+Enter for newline)'
        }
        disabled={disabled}
        className="min-h-[3rem] flex-1 resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
      />
      {busy ? (
        <button
          onClick={onStop}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      )}
    </div>
  )
}
