// Shared modal shell so Settings and Leaderboard look and behave identically.
// Elevation on dark themes can't come from shadows alone (shadows vanish on
// dark backgrounds), so we stack three cues: a lighter surface than the page,
// a faint light ring around the edge, and a deep shadow — plus a blurred,
// dimmed backdrop to push the page back.

import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  actions,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  actions?: ReactNode // extra buttons next to the close button (e.g. Reset)
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl shadow-zinc-500/30 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:shadow-black/60 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <div className="flex items-center gap-2">
            {actions}
            {/* a real button with a visible boundary — not a floating ✕ */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
