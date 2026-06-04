# ⚡ AI Agent Playground

One prompt, three models, live tool traces — side by side.

Type a prompt and **Gemini 2.0 Flash**, **Groq (Llama 3.3 70B)**, and **OpenAI GPT-4o** all answer simultaneously. Each model can autonomously call client-side tools, and the UI exposes the full agentic chain: which tools it called, in what order, with what input and output.

## Features

- **3-column comparison** — each model streams its answer independently with response times
- **Autonomous tool use** — models can call: calculator, word counter, current date/time, JSON formatter (all client-side, no backend)
- **Tool call traces** — collapsible per-response chain showing `tool → input → output → next step`
- **Leaderboard** — avg response time, tool call counts, and sessions per model, persisted across sessions in localStorage
- **Bring your own keys** — entered in Settings, stored only in localStorage, sent directly from your browser to each provider. No server anywhere.

## Run it

```bash
npm install
npm run dev
```

Open the app, hit ⚙️ Settings, paste your API keys:

- Gemini → [Google AI Studio](https://aistudio.google.com/apikey)
- Groq → [console.groq.com](https://console.groq.com/keys)
- OpenAI → [platform.openai.com](https://platform.openai.com/api-keys)

Then try a prompt that forces tool use, like:

> What is 847 * 392, how many words are in "the quick brown fox", and what time is it right now?

## Stack

React 18 · Vite 6 · TypeScript · Tailwind CSS v4. Providers are called with plain `fetch` + hand-rolled SSE parsing — no SDKs.

## How the agent loop works

```
streamTurn → model responds
   ├─ plain text only? → done, that's the answer
   └─ tool calls? → execute locally → append results → streamTurn again
                    (max 5 iterations)
```

The loop lives in `src/providers/shared.ts` and is identical for all providers; each provider adapter (`openaiCompatible.ts`, `gemini.ts`) only translates its own wire format.
