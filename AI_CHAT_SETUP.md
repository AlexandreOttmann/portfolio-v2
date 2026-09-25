# AI Chat (Petit-Oni)

The portfolio assistant is a Claude agent that answers questions about Alex from the site's own content, streams its answers, and shows project, article and contact cards instead of plain links.

## Architecture

```
content/**  (Nuxt Content collections: the single source of truth)
   │
   ├─ server/utils/ai/knowledge.ts  compiles the profile + backs the tools
   ├─ server/utils/ai/prompt.ts     system prompt (cached)
   ├─ server/utils/ai/tools.ts      agent tools, validated with zod
   │
server/api/chat.post.ts  ── Claude (streaming, tool loop) ──► NDJSON stream
   │
app/composables/useAiChat.ts + app/components/home/AiChat.vue + app/components/chat/*
```

- **Always in context**: persona (`content/ai-context.md`), site pages, timeline, stack, the project index, the article list and the FAQ, compiled per locale (~4k tokens). This sits in the system prompt with **prompt caching**, so follow-up turns only pay cache-read rates.
- **On demand (tools)**:
  - `get_project_details`: the full write-up of a project, displayed as a card.
  - `list_projects`: project cards, optionally filtered by technology.
  - `get_article`: reads an article or the `red-wire` page, displayed as a link card.
  - `search_portfolio`: keyword search over every section of the markdown content. This is the single retrieval entry point: replace its implementation (e.g. pgvector hybrid search) without touching the agent.
  - `show_contact_options`: contact form, call booking, LinkedIn and CV download.
- **Streaming protocol**: one JSON event per line (`text`, `tool-start`, `tool-end` with a UI payload, `error`, `done`). Types live in `shared/types/chat.ts`.

## Editing what the assistant knows

Edit the content as usual (files or Nuxt Studio). There is no ingestion step: the next deploy picks it up.

- Facts about the projects, articles, timeline, stack or FAQ: edit their own files. The assistant reads them directly.
- Facts only the assistant needs (situation, education details, personal info, contact preferences): edit `content/ai-context.md`.
- Tone and rules: `server/utils/ai/prompt.ts`.

To see exactly what the model receives, run `pnpm dev` and open:

- `/api/chat-debug?locale=fr`: the system prompt and the tool definitions.
- `/api/chat-debug?locale=fr&tool=search_portfolio&input={"query":"kafka"}`: runs one tool.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | Claude API key. Without it, the chat answers with the contact card. |
| `AI_CHAT_MODEL` | no | Defaults to `claude-opus-5`. Any Claude model id works (e.g. `claude-sonnet-5`, `claude-haiku-4-5`) if you want to trade quality for cost. |
| `SUPABASE_URL` | no | Defaults to the existing project. |
| `SUPABASE_KEY` | no | Enables logging to `ai_chat_interactions` and the `/chat-logs` page. |
| `BEST_PASSWORD` | no | Password of `/chat-logs`, sent as a `Bearer` header. |
| `AI_CHAT_DEBUG` | no | `1` exposes `/api/chat-debug` outside `nuxt dev`. Never set it in production. |

## Safety and cost controls

- **Input validation** (zod): at most 24 messages, 1000 characters per question, and the last message must come from the user.
- **Rate limiting** per IP (8 requests/min, 60/hour), kept in memory. This is best effort, because each Vercel instance has its own memory. For a hard global limit, add a Vercel Firewall rate-limit rule on `/api/chat`.
- **Output limits**: `max_tokens` 4096, `effort: low`, at most 5 tool rounds per question.
- **Refusal fallback**: on Opus 5, `fallbacks: "default"` re-runs a policy-declined request on a fallback model.
- **Rendering**: assistant markdown goes through `marked` + DOMPurify. Scripts, event handlers and `javascript:` links are stripped, and only same-site images are kept.
- **Logs**: every answer is written to Supabase with token usage and an estimated cost (cache reads and writes included).

## Evaluation

`pnpm eval:chat` runs a golden set of about 16 FR/EN questions against `/api/chat`. It checks which tools were called, the facts each answer must mention, and what it must refuse (off-topic requests, prompt extraction). It calls the model, so it costs tokens.

```bash
pnpm dev
BASE_URL=http://localhost:3000 pnpm eval:chat
```
