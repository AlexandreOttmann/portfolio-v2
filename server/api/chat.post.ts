import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'
import { buildProfileContext, type Locale } from '../utils/ai/knowledge'
import { buildSystemPrompt } from '../utils/ai/prompt'
import { runTool, toolDefinitions } from '../utils/ai/tools'
import { enforceRateLimit } from '../utils/rate-limit'
import { useServerSupabase } from '../utils/supabase'
import type { ChatStreamEvent } from '../../shared/types/chat'

const MODEL = process.env.AI_CHAT_MODEL || 'claude-opus-5'
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

const bodySchema = z.object({
  locale: z.enum(['fr', 'en']),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().max(4000),
  })).min(1).max(24),
}).refine(({ messages }) => messages.at(-1)?.role === 'user', 'The last message must come from the user')
  .refine(({ messages }) => (messages.at(-1)?.content.length ?? 0) <= 1000, 'Message too long')
  .refine(({ messages }) => (messages.at(-1)?.content.length ?? 0) > 0, 'Empty message')

const FALLBACK_TEXT: Record<Locale, string> = {
  fr: 'Désolé, je ne suis pas disponible pour le moment. Vous pouvez contacter Alex directement :',
  en: 'Sorry, I\'m not available right now. You can reach Alex directly:',
}

const anthropic = new Anthropic()

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

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid chat request' })
  }
  const { locale, messages } = parsed.data
  const question = messages.at(-1)!.content

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
      const send = (payload: ChatStreamEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      }

      let answer = ''
      const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }

      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          send({ type: 'text', delta: FALLBACK_TEXT[locale] })
          send({ type: 'tool-end', id: 'contact', name: 'show_contact_options', ok: true, ui: { type: 'contact' } })
          return
        }

        const profile = await buildProfileContext(event, locale)
        const system: Anthropic.Beta.BetaTextBlockParam[] = [{
          type: 'text',
          text: buildSystemPrompt(locale, profile),
          cache_control: { type: 'ephemeral' },
        }]
        const conversation = toApiMessages(messages)
        const isOpus = MODEL.startsWith('claude-opus-5') || MODEL.startsWith('claude-fable-5')

        for (let step = 0; step < MAX_STEPS; step++) {
          const response = anthropic.beta.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: toolDefinitions,
            messages: conversation,
            // Chat Q&A over a small knowledge base does not need deep reasoning.
            ...(MODEL.startsWith('claude-haiku') ? {} : { output_config: { effort: 'low' as const } }),
            // On a policy decline, let the API re-run the request on a fallback model.
            ...(isOpus ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
          }, { signal: abort.signal })

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
          if (message.stop_reason !== 'tool_use' || toolUses.length === 0) break

          conversation.push({ role: 'assistant', content: message.content })

          const results = await Promise.all(toolUses.map(async (toolUse) => {
            send({ type: 'tool-start', id: toolUse.id, name: toolUse.name })
            const output = await runTool(toolUse.name, toolUse.input, { event, locale })
            send({ type: 'tool-end', id: toolUse.id, name: toolUse.name, ok: !output.isError, ui: output.ui })
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: output.content,
              is_error: output.isError,
            }
          }))
          conversation.push({ role: 'user', content: results })

          if (step === MAX_STEPS - 1) {
            send({ type: 'text', delta: locale === 'fr' ? '\n\nJe n\'ai pas pu terminer ma réponse, pouvez-vous reformuler ?' : '\n\nI couldn\'t finish my answer, could you rephrase?' })
          }
        }
      }
      catch (error) {
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
        await logInteraction(question, answer, usage)
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

async function logInteraction(prompt: string, answer: string, usage: { input: number, cacheWrite: number, cacheRead: number, output: number }) {
  const supabase = useServerSupabase()
  if (!supabase || !answer) return
  const promptTokens = usage.input + usage.cacheWrite + usage.cacheRead
  const estimatedCost = estimateCost(usage)
  console.log(`[AI Chat] ${MODEL} | in ${usage.input} + cache write ${usage.cacheWrite} + cache read ${usage.cacheRead} | out ${usage.output} | ~$${estimatedCost.toFixed(5)}`)
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
