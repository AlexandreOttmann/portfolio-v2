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

## Driving the site

The assistant can show things instead of describing them:

- `show_on_site`: navigates to a page and scrolls to and highlights a section.
- `open_project_on_site`: opens the project dialog on `/works`.

Pages and sections are declared once in `PILOT_PAGES` (`shared/types/chat.ts`), and each section is marked in the templates with `data-pilot="<section>"`. To add a target, add it to `PILOT_PAGES` and put the attribute on the element.

The chat widget (`useSitePilot`) runs the actions and switches modes:
- `open`: centered, over a blurred page.
- `docked`: side panel on desktop, bottom sheet on mobile; no blur, and the page is pushed left.
- `minimized`: a small card.

A site action docks the chat on desktop and minimizes it on mobile. The chat lives in `app.vue`, so it stays open across navigations. It is teleported to `<body>` so it stays above the project dialog, which becomes non-modal while the chat is docked.

## Petit-Oni avatar

`app/components/chat/PetitOniAvatar.vue` is an inline SVG with the same geometry as `app/assets/icons/petit-oni.svg`. It is split into parts (horns, brow, ears, eyes, mouth, fangs) that CSS animates per state.

| State | Trigger (in `useAiChat`) |
| --- | --- |
| `idle` | nothing happening (floats, blinks at random) |
| `listening` | the visitor is typing (ears perk up, sound waves) |
| `thinking` | request sent or tool running (eyes look around, horns glow) |
| `speaking` | text is streaming; the mouth stops during pauses |
| `showing` | a card was displayed (wide eyes, sparkle) |
| `navigating` | a site action ran (head tilts toward the page) |
| `error` | error or refusal (half-closed eyes, small shake) |

Colors come from `--oni-line`, `--oni-eyes` and `--oni-shine`. The chat variant is set in `app.config.ts` (`petitOni.variant`: `color` or `mono`). `prefers-reduced-motion` disables the loops.

The `/oni-lab` page shows every state side by side. It is available in dev, and in production only when `NUXT_PUBLIC_ONI_LAB=true`; otherwise it returns 404.

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
| `ANTHROPIC_WORKSPACE_ID` | no | Only for API keys that are not scoped to a workspace (the API then rejects requests without it). |
| `AI_CHAT_MODEL` | no | Defaults to `claude-sonnet-5`. Any Claude model id works (e.g. `claude-opus-5` for more quality, `claude-haiku-4-5` for lower cost). |
| `SUPABASE_URL` | no | Defaults to the existing project. |
| `SUPABASE_KEY` | no | Enables logging to `ai_chat_interactions` and the `/chat-logs` page. |
| `BEST_PASSWORD` | no | Password of `/chat-logs`, sent as a `Bearer` header. |
| `AI_CHAT_DEBUG` | no | `1` exposes `/api/chat-debug` outside `nuxt dev`. Never set it in production. |

## Safety and cost controls

- **Input validation** (zod): at most 24 messages, 1000 characters per question, and the last message must come from the user.
- **Rate limiting** per IP (8 requests/min, 60/hour), kept in memory. This is best effort, because each Vercel instance has its own memory. For a hard global limit, add a Vercel Firewall rate-limit rule on `/api/chat`.
- **Output limits**: `max_tokens` 4096, `effort: low`, at most 5 tool rounds per question.
- **Refusal fallback**: when `AI_CHAT_MODEL` is an Opus 5 / Fable 5 model, `fallbacks: "default"` re-runs a policy-declined request on a fallback model.
- **Rendering**: assistant markdown goes through `marked` + DOMPurify. Scripts, event handlers and `javascript:` links are stripped, and only same-site images are kept.
- **Logs**: every answer is written to Supabase with token usage and an estimated cost (cache reads and writes included).

## Evaluation

`pnpm eval:chat` runs a golden set of 43 FR/EN questions against `/api/chat`: one question per project in each language (which must not drive the site), site-driving requests, plus profile, contact and guardrail questions. It checks which tools were called, which cards were shown, the facts each answer must mention, and what it must refuse (off-topic requests, prompt extraction). `ONLY=project,pilot pnpm eval:chat` runs selected groups. It calls the model, so it costs tokens.

```bash
pnpm dev
BASE_URL=http://localhost:3000 pnpm eval:chat
```
