// Tiny markdown renderer — covers just the bits chat models actually emit:
// **bold**, `inline code`, and bullet lines. Raw asterisks all over the
// answers were the single biggest readability problem; a full markdown
// library is overkill for three patterns.

import type { ReactNode } from 'react'

// Turn **bold** and `code` spans into real elements; leave the rest alone.
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // non-greedy so "**847 * 392**" (single * inside bold) still matches
  const re = /(\*\*.+?\*\*|`[^`]+`)/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      out.push(
        <strong key={`${keyBase}b${i++}`} className="font-semibold text-zinc-950 dark:text-white">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(
        <code
          key={`${keyBase}c${i++}`}
          className="rounded bg-zinc-200/70 px-1 font-mono text-[0.9em] dark:bg-zinc-800"
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ content }: { content: string }) {
  return (
    <>
      {content.split('\n').map((line, i) => {
        // blank line = paragraph break, give it real height
        if (line.trim() === '') return <div key={i} className="h-3" />
        // "* item" / "- item" → a clean bullet with a hanging indent
        const isBullet = /^\s*[*-]\s+/.test(line)
        const clean = isBullet ? line.replace(/^\s*[*-]\s+/, '') : line
        return isBullet ? (
          <div key={i} className="flex gap-2 pl-1">
            <span className="select-none text-zinc-400 dark:text-zinc-500">•</span>
            <span>{renderInline(clean, String(i))}</span>
          </div>
        ) : (
          <div key={i}>{renderInline(clean, String(i))}</div>
        )
      })}
    </>
  )
}
