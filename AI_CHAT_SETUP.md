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
  - `show_job_match`: the visitor shares a job offer, either pasted or as a link. The model lists the offer's key requirements, each marked met, partial or gap, with evidence and project slugs. The server keeps only the project slugs that exist (they become chips that open the project on the site) and **computes the verdict** from coverage, a partial counting half: excellent ≥ 85 %, good ≥ 65 %, partial ≥ 40 %, low otherwise.
  - `web_fetch` (Anthropic server tool, `web_fetch_20260209`): reads a job offer from a link. It runs on Anthropic's side, only fetches URLs present in the conversation, and is limited to 2 fetches and 12k tokens per page. Pages behind a login (LinkedIn) fail; the assistant then asks for the pasted text.
  - `suggest_follow_ups`: 2 or 3 follow-up questions, shown as buttons under the answer. The model calls it as the last step of every answer. It is a *terminal* tool (`TERMINAL_TOOLS`): when a turn only calls it, the server does not send its result back to the model, so it costs no extra round trip.
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
| `idle` | nothing happening (floats, sways its head, eyes wander, blinks often, sometimes twice) |
| `listening` | the visitor is typing (ears perk up, sound waves) |
| `thinking` | request sent or tool running (eyes look around, horns glow) |
| `speaking` | text is streaming; the mouth stops during pauses |
| `showing` | a card was displayed (wide eyes, two sparkles) |
| `navigating` | a site action ran (head tilts toward the page) |
| `error` | error or refusal (half-closed eyes, small shake) |

Colors come from `--oni-line`, `--oni-eyes` and `--oni-shine`. The chat variant is set in `app.config.ts` (`petitOni.variant`: `mono` by default, or `color`). `prefers-reduced-motion` disables the loops.

The `/oni-lab` page shows every state side by side. It is available in dev, and in production only when `NUXT_PUBLIC_ONI_LAB=true`; otherwise it returns 404.

## Job offer matcher

The "Évaluer une offre d'emploi" button (under the welcome questions) switches the composer to *offer mode*: the next message is framed as a job offer to assess. Pasting a long text into the one-line bottom bar also opens the chat in offer mode with the text ready to send. The answer is a `ChatJobMatchCard` showing:
- the verdict and the coverage;
- each requirement with its evidence and project chips;
- buttons to book a call or open the contact form.

A pasted offer costs about $0.01 to $0.02, and a link about $0.07 (the page is read in full).

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
| `AI_CHAT_MODEL` | no | Model for everyday questions. Defaults to `claude-haiku-4-5` (cheapest; 42/45 on the eval, the 3 misses being omissions rather than errors). |
| `AI_CHAT_MATCHER_MODEL` | no | Model for job offers. Defaults to `claude-sonnet-5`, which is stricter and more nuanced than Haiku for this analysis. A request counts as a job offer when it is sent in offer mode, contains a link, or is ≥ 400 characters. |
| `SUPABASE_URL` | no | Defaults to the existing project. |
| `SUPABASE_KEY` | no | Enables logging to `ai_chat_interactions` and the `/chat-logs` page. |
| `BEST_PASSWORD` | no | Password of `/chat-logs`, sent as a `Bearer` header. |
| `BOTID_ENFORCE` | no | `true` to return 403 to requests BotID classifies as bots. Off by default (observation only). |
| `AI_CHAT_DEBUG` | no | `1` exposes `/api/chat-debug` outside `nuxt dev`. Never set it in production. |

## Safety and cost controls

- **Input validation** (zod): at most 24 messages, 6,000 characters per question (a pasted job offer fits), 30,000 characters for the whole conversation, and the last message must come from the user.
- **Bots**: [Vercel BotID](https://vercel.com/docs/botid) protects `/api/chat`. The `botid/nuxt` module and `app/plugins/botid.client.ts` attach an invisible challenge, and `checkBotId()` blocks bots with a 403. The check only runs on Vercel and fails open. **Observation mode by default**: the verdict is logged (`[AI Chat] BotID {…}`) but only blocks when `BOTID_ENFORCE=true`. Enforcing blocked real visitors in production; turn it on once the logs show humans classified as humans (`isBot: false`, `humanHeader: true`).
- **Rate limiting** per IP (8 requests/min, 60/hour), kept in memory. This is best effort, because each Vercel instance has its own memory. For a hard global limit, add a Vercel Firewall rate-limit rule on `/api/chat`.
- **Output limits**: `max_tokens` 4096, `effort: low`, at most 5 tool rounds per question.
- **Refusal fallback**: when `AI_CHAT_MODEL` is an Opus 5 / Fable 5 model, `fallbacks: "default"` re-runs a policy-declined request on a fallback model.
- **Rendering**: assistant markdown goes through `marked` + DOMPurify. Scripts, event handlers and `javascript:` links are stripped, and only same-site images are kept.
- **Cost**: about $0.004 per question with Haiku and a warm prompt cache.
  - `web_fetch` is only offered when the question contains a link; its definition adds ~4k tokens to every request.
  - Answers to the 4 welcome questions are generated once, then replayed for free (`server/utils/ai/answer-cache.ts`: in memory, 24 h, invalidated when the model, prompt or tools change).
  - The first question after 5 minutes without traffic pays the prompt cache write (~$0.01 with Haiku).
- **Logs**: every answer is written to Supabase with token usage and an estimated cost (cache reads and writes included).

## Evaluation

`pnpm eval:chat` runs a golden set of 43 FR/EN questions (every answer must also offer 2-3 follow-up suggestions) against `/api/chat`: one question per project in each language (which must not drive the site), site-driving requests, plus profile, contact and guardrail questions. It checks which tools were called, which cards were shown, the facts each answer must mention, and what it must refuse (off-topic requests, prompt extraction). `ONLY=project,pilot pnpm eval:chat` runs selected groups. It calls the model, so it costs tokens.

```bash
pnpm dev
BASE_URL=http://localhost:3000 pnpm eval:chat
```
