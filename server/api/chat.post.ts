import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { checkBotId } from 'botid/server'
import { z } from 'zod/v4'
import { answerCacheKey, getCachedAnswer, isPresetQuestion, replayAnswer, setCachedAnswer } from '../utils/ai/answer-cache'
import { buildProfileContext, type Locale } from '../utils/ai/knowledge'
import { buildSystemPrompt } from '../utils/ai/prompt'
import { runTool, TERMINAL_TOOLS, toolDefinitions } from '../utils/ai/tools'
import { enforceRateLimit } from '../utils/rate-limit'
import { useServerSupabase } from '../utils/supabase'
import type { ChatStreamEvent } from '../../shared/types/chat'

const MODEL = process.env.AI_CHAT_MODEL || 'claude-haiku-4-5'
// Public endpoint: cap the output of a single answer (thinking included).
const MAX_TOKENS = 4096
// Max model round-trips per visitor message (each tool round is one).
const MAX_STEPS = 5

// $ per million tokens (input, output). Cache writes cost 1.25x input, reads 0.1x.
const PRICING: Record<string, [number, number]> = {
  'claude-opus-5-5': [4, 20],
  'claude-opus-5': [5, 25],
  'claude-sonnet-5': [2, 10],
  'claude-haiku-4-5': [1, 5],
}

// Long enough for a pasted job offer, bounded for cost.
const MAX_QUESTION_CHARS = 6000
const MAX_TOTAL_CHARS = 30000

const bodySchema = z.object({
  locale: z.enum(['fr', 'en']),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().max(8000),
  })).min(1).max(24),
}).refine(({ messages }) => messages.at(-1)?.role === 'user', 'The last message must come from the user')
  .refine(({ messages }) => (messages.at(-1)?.content.length ?? 0) <= MAX_QUESTION_CHARS, 'Message too long')
  .refine(({ messages }) => messages.reduce((sum, m) => sum + m.content.length, 0) <= MAX_TOTAL_CHARS, 'Conversation too long')
  .refine(({ messages }) => (messages.at(-1)?.content.length ?? 0) > 0, 'Empty message')

const FALLBACK_TEXT: Record<Locale, string> = {
  fr: 'Désolé, je ne suis pas disponible pour le moment. Vous pouvez contacter Alex directement :',
  en: 'Sorry, I\'m not available right now. You can reach Alex directly:',
}

// Anthropic-hosted fetch, used to read a job offer from a link. It only fetches
// URLs present in the conversation and never runs on this server. Its definition
// adds ~4k tokens to every request, so it is only offered when the question has a link.
// Dynamic filtering (20260209) needs Sonnet/Opus 4.6+; Haiku gets the basic version.
const WEB_FETCH_TOOL = MODEL.startsWith('claude-haiku')
  ? { type: 'web_fetch_20250910' as const, name: 'web_fetch' as const, max_uses: 2, max_content_tokens: 12000 }
  : { type: 'web_fetch_20260209' as const, name: 'web_fetch' as const, max_uses: 2, max_content_tokens: 12000 }
const LINK_RE = /https?:\/\/\S+/i
const SERVER_TOOL_RESULTS = new Set(['web_fetch_tool_result'])

// Keys that are not scoped to a workspace must name one on every request.
const anthropic = new Anthropic({
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID } : undefined,
})

/** Merge consecutive turns of the same role and drop empty ones. */
function toApiMessages(messages: Array<{ role: 'user' | 'assistant', content: string }>): Anthropic.Beta.BetaMessageParam[] {
  const result: Anthropic.Beta.BetaMessageParam[] = []
  for (const { role, content } of messages) {
    if (!content) continue
    const previous = result.at(-1)
    if (previous?.role === role) previous.content = `${previous.content}\n\n${content}`
    else result.push({ role, content })
  }
  while (result[0]?.role === 'assistant') result.shift()
  return result
}

function estimateCost(usage: { input: number, cacheWrite: number, cacheRead: number, output: number }) {
  const [input, output] = PRICING[MODEL] ?? [5, 25]
  return (usage.input * input + usage.cacheWrite * input * 1.25 + usage.cacheRead * input * 0.1 + usage.output * output) / 1_000_000
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    enforceRateLimit(event, 'chat', [
      { max: 8, ms: 60_000 },
      { max: 60, ms: 60 * 60_000 },
    ])
  }

  // Vercel BotID (invisible challenge, see app/plugins/botid.client.ts): bots don't burn API credits.
  // Only on Vercel, and fail open: the chat must not go down if the check itself fails.
  if (process.env.VERCEL) {
    const verification = await checkBotId({ advancedOptions: { headers: event.node.req.headers } }).catch((error) => {
      console.warn('[AI Chat] BotID check failed, letting the request through:', error instanceof Error ? error.message : error)
      return null
    })
    if (verification?.isBot) {
      throw createError({ statusCode: 403, statusMessage: 'Access denied' })
    }
  }

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid chat request' })
  }
  const { locale, messages } = parsed.data
  const question = messages.at(-1)!.content
  const tools = LINK_RE.test(question) ? [...toolDefinitions, WEB_FETCH_TOOL] : toolDefinitions
  // First message that is one of the welcome questions: same answer for everyone.
  const cacheable = messages.length === 1 && isPresetQuestion(locale, question)

  setResponseHeaders(event, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  })

  const abort = new AbortController()
  event.node.res.on('close', () => {
    if (!event.node.res.writableFinished) abort.abort()
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const recorded: ChatStreamEvent[] = []
      const send = (payload: ChatStreamEvent) => {
        if (cacheable) recorded.push(payload)
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      }

      let answer = ''
      let failed = false
      let cachedReplay = false
      const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }

      const suggestFollowUps = async (history: Anthropic.Beta.BetaMessageParam[]) => {
        // Forced tool choice is rejected by these models: they keep the prompt-only behavior.
        if (/^claude-(opus-5-5|fable-5-1)/.test(MODEL)) return
        try {
          const message = await anthropic.beta.messages.create({
            model: MODEL,
            max_tokens: 400,
            system: [{ type: 'text', text: buildSystemPrompt(locale, await buildProfileContext(event, locale)), cache_control: { type: 'ephemeral' } }],
            tools,
            tool_choice: { type: 'tool', name: 'suggest_follow_ups' },
            // Forced tool use cannot be combined with thinking.
            thinking: { type: 'disabled' },
            messages: [...history, { role: 'user', content: 'Suggest follow-up questions for the visitor.' }],
          }, { signal: abort.signal })
          usage.input += message.usage.input_tokens
          usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0
          usage.cacheRead += message.usage.cache_read_input_tokens ?? 0
          usage.output += message.usage.output_tokens
          const toolUse = message.content.find((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use')
          if (!toolUse) return
          const output = await runTool(toolUse.name, toolUse.input, { event, locale })
          if (output.ui) send({ type: 'tool-end', id: toolUse.id, name: toolUse.name, ok: !output.isError, ui: output.ui })
        }
        catch (error) {
          // Suggestions are a nice-to-have: never fail the answer for them.
          if (!abort.signal.aborted) console.warn('[AI Chat] Follow-up suggestions failed:', error instanceof Error ? error.message : error)
        }
      }

      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          send({ type: 'text', delta: FALLBACK_TEXT[locale] })
          send({ type: 'tool-end', id: 'contact', name: 'show_contact_options', ok: true, ui: { type: 'contact' } })
          return
        }

        const profile = await buildProfileContext(event, locale)
        const systemText = buildSystemPrompt(locale, profile)
        const system: Anthropic.Beta.BetaTextBlockParam[] = [{
          type: 'text',
          text: systemText,
          cache_control: { type: 'ephemeral' },
        }]

        const cacheKey = cacheable
          ? answerCacheKey(MODEL, locale, question, createHash('sha256').update(systemText).update(JSON.stringify(tools)).digest('hex'))
          : null
        const cached = cacheKey ? getCachedAnswer(cacheKey) : null
        if (cached) {
          cachedReplay = true
          answer = cached.filter(e => e.type === 'text').map(e => e.delta).join('')
          await replayAnswer(cached, send, abort.signal)
          return
        }

        const conversation = toApiMessages(messages)
        const isOpus = MODEL.startsWith('claude-opus-5') || MODEL.startsWith('claude-fable-5')
        let suggested = false
        let finalMessage: Anthropic.Beta.BetaMessage | null = null

        for (let step = 0; step < MAX_STEPS; step++) {
          const response = anthropic.beta.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools,
            messages: conversation,
            // Chat Q&A over a small knowledge base does not need deep reasoning.
            ...(MODEL.startsWith('claude-haiku') ? {} : { output_config: { effort: 'low' as const } }),
            // On a policy decline, let the API re-run the request on a fallback model.
            ...(isOpus ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
          }, { signal: abort.signal })

          // Server tools (web_fetch) run inside this request: surface them like our own tools.
          response.on('streamEvent', (streamEvent) => {
            if (streamEvent.type !== 'content_block_start') return
            const block = streamEvent.content_block
            // Only web_fetch is shown: its internal code_execution steps are an implementation detail.
            if (block.type === 'server_tool_use' && block.name === 'web_fetch') send({ type: 'tool-start', id: block.id, name: block.name })
            if (SERVER_TOOL_RESULTS.has(block.type) && 'tool_use_id' in block) {
              const failed = 'content' in block && typeof block.content === 'object' && block.content !== null && 'error_code' in block.content
              send({ type: 'tool-end', id: block.tool_use_id, name: 'web_fetch', ok: !failed })
            }
          })

          response.on('text', (delta) => {
            answer += delta
            send({ type: 'text', delta })
          })

          const message = await response.finalMessage()
          usage.input += message.usage.input_tokens
          usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0
          usage.cacheRead += message.usage.cache_read_input_tokens ?? 0
          usage.output += message.usage.output_tokens

          if (message.stop_reason === 'refusal') {
            send({ type: 'text', delta: locale === 'fr' ? '\n\nJe ne peux pas répondre à cette demande.' : '\n\nI can\'t help with that request.' })
            break
          }
          if (message.stop_reason === 'pause_turn') {
            conversation.push({ role: 'assistant', content: message.content })
            continue
          }

          const toolUses = message.content.filter((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use')
          // A tool input cut off at max_tokens is truncated: never run it.
          if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
            finalMessage = message
            break
          }

          conversation.push({ role: 'assistant', content: message.content })

          const results = await Promise.all(toolUses.map(async (toolUse) => {
            send({ type: 'tool-start', id: toolUse.id, name: toolUse.name })
            const output = await runTool(toolUse.name, toolUse.input, { event, locale })
            send({ type: 'tool-end', id: toolUse.id, name: toolUse.name, ok: !output.isError, ui: output.ui })
            if (output.ui?.type === 'suggestions') suggested = true
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: output.content,
              is_error: output.isError,
            }
          }))
          // Only follow-up suggestions this turn: the answer is complete, no need for another round trip.
          if (toolUses.every(toolUse => TERMINAL_TOOLS.has(toolUse.name))) break

          conversation.push({ role: 'user', content: results })

          if (step === MAX_STEPS - 1) {
            send({ type: 'text', delta: locale === 'fr' ? '\n\nJe n\'ai pas pu terminer ma réponse, pouvez-vous reformuler ?' : '\n\nI couldn\'t finish my answer, could you rephrase?' })
          }
        }

        // The model sometimes forgets the follow-ups: ask for them explicitly (cached prompt, tiny output).
        if (!suggested && finalMessage?.stop_reason === 'end_turn' && answer.trim()) {
          await suggestFollowUps([...conversation, { role: 'assistant', content: finalMessage.content }])
        }

        if (cacheKey && answer.trim() && !abort.signal.aborted) setCachedAnswer(cacheKey, recorded)
      }
      catch (error) {
        failed = true
        if (abort.signal.aborted) return
        if (error instanceof Anthropic.RateLimitError) console.warn('[AI Chat] Anthropic rate limit reached')
        else if (error instanceof Anthropic.APIError) console.error(`[AI Chat] Anthropic API error ${error.status}:`, error.message)
        else console.error('[AI Chat] Unexpected error:', error)
        send({ type: 'error', message: FALLBACK_TEXT[locale] })
        send({ type: 'tool-end', id: 'contact', name: 'show_contact_options', ok: true, ui: { type: 'contact' } })
      }
      finally {
        send({ type: 'done' })
        // Log before closing: serverless functions may be frozen once the response ends.
        if (!failed || answer) await logInteraction(question, answer, usage, cachedReplay)
        try {
          controller.close()
        }
        catch {
          // Stream already cancelled by the client.
        }
      }
    },
    cancel() {
      abort.abort()
    },
  })

  return sendStream(event, stream)
})

async function logInteraction(prompt: string, answer: string, usage: { input: number, cacheWrite: number, cacheRead: number, output: number }, cachedReplay = false) {
  const promptTokens = usage.input + usage.cacheWrite + usage.cacheRead
  const estimatedCost = estimateCost(usage)
  console.log(cachedReplay
    ? `[AI Chat] ${MODEL} | cached answer (welcome question) | $0`
    : `[AI Chat] ${MODEL} | in ${usage.input} + cache write ${usage.cacheWrite} + cache read ${usage.cacheRead} | out ${usage.output} | ~$${estimatedCost.toFixed(5)}`)

  const supabase = useServerSupabase()
  if (!supabase || !answer) return
  const { error } = await supabase.from('ai_chat_interactions').insert({
    prompt,
    answer,
    prompt_tokens: promptTokens,
    completion_token: usage.output,
    total_tokens: promptTokens + usage.output,
    estimated_cost: estimatedCost,
  })
  if (error) console.error('[AI Chat] Failed to log interaction:', error.message)
}
