// The /about page (#/about) - the long-form story of what this playground
// is and how it works. Sections render from the live MODELS and TOOLS
// registries, so the docs can never drift out of sync with the app.

import { MODELS } from '../types'
import { TOOLS } from '../tools'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-200 py-8 first:border-t-0 dark:border-zinc-800">
      <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <div className="space-y-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{children}</div>
    </section>
  )
}

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <button
          onClick={onBack}
          className="mb-8 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to playground
        </button>

        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          About AI Agent Playground
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          One prompt, many models, live tool traces. A browser-only lab for watching language models
          think - and comparing how differently they do it.
        </p>

        <div className="mt-8">
          <Section title="What is this?">
            <p>
              Type a prompt once and every selected model answers side by side, streaming live. The
              twist: each model can autonomously call tools to work out its answer, and the full
              agentic chain - which tool, what input, what output, in what order - is exposed right
              in the conversation. It turns "which model is better?" from a vibe into something you
              can actually watch.
            </p>
          </Section>

          <Section title="How the agent loop works">
            <p>
              Every model runs the same provider-agnostic loop: stream a turn, and if the model
              requested tools, run them locally in your browser, feed the results back, and repeat -
              until the model answers in plain text (capped at 5 iterations so nobody loops forever).
            </p>
            <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
{`prompt → model streams a turn
   ├─ plain text only?  → done, that's the answer
   └─ tool calls?       → execute locally
                          → append results
                          → stream again`}
            </pre>
            <p>
              Models race concurrently and independently - one provider erroring or rate-limiting
              never blocks the others. Differences you'll see are real capability differences: some
              models chain three tools in one shot, some go step by step, some work around missing
              functions with algebra (computing a square root as <code className="rounded bg-zinc-200/70 px-1 font-mono text-[0.9em] dark:bg-zinc-800">x ^ 0.5</code>), and some
              just apologize.
            </p>
          </Section>

          <Section title="The models">
            <ul className="space-y-2">
              {MODELS.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.accent}`} />
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{m.label}</span>
                  <code className="truncate font-mono text-xs text-zinc-500">{m.model}</code>
                </li>
              ))}
            </ul>
            <p>
              All but Gemini speak the OpenAI chat-completions dialect, so each new provider is a
              ~15-line adapter. Gemini gets its own wire-format translation (including the thought
              signatures its thinking models require).
            </p>
          </Section>

          <Section title="The tools">
            <ul className="space-y-2">
              {TOOLS.map((t) => (
                <li key={t.name}>
                  <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                    {t.name}
                  </code>
                  <span className="ml-2">{t.description}</span>
                </li>
              ))}
            </ul>
            <p>
              Tools run entirely client-side - no backend, no external calls. They're deliberately
              simple: the point isn't the tools, it's watching <em className="italic">how</em> each
              model decides to use them. Tool errors are returned to the model as text so it can
              recover and retry instead of crashing the run.
            </p>
          </Section>

          <Section title="Privacy & keys">
            <p>
              There is no server. Your API keys live in your browser's localStorage and requests go
              straight from your browser to each provider. Conversations, the scoreboard, and your
              model lineup also persist locally - refresh and everything is exactly where you left
              it. Clearing your browser storage erases all of it.
            </p>
          </Section>

          <Section title="The leaderboard">
            <p>
              Every completed response feeds per-model stats: average response time, total responses,
              tool calls used, and sessions participated in. Stats accumulate across visits until you
              hit Reset - over time the speed differences between providers become very obvious.
            </p>
          </Section>

          <Section title="Stack">
            <p>
              React 18 · Vite · TypeScript · Tailwind CSS v4. Providers are called with plain{' '}
              <code className="rounded bg-zinc-200/70 px-1 font-mono text-[0.9em] dark:bg-zinc-800">fetch</code>{' '}
              and hand-rolled SSE parsing - no provider SDKs, which keeps the bundle small and the
              streaming logic honest. Built by Shreyash.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
