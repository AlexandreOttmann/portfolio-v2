import { createHash } from 'node:crypto'
import type { ChatStreamEvent } from '../../../shared/types/chat'
import { PRESET_QUESTIONS } from '../../../shared/presets'
import type { Locale } from './knowledge'

/**
 * Answers to the welcome questions are the same for every visitor: generate
 * them once, then replay them for free. In memory, per server instance.
 *
 * The key includes the model and a hash of the system prompt and tools, so any
 * change to the content, the rules or the model invalidates it.
 */

const TTL_MS = 24 * 60 * 60 * 1000

interface Entry {
  events: ChatStreamEvent[]
  expiresAt: number
}

const cache = new Map<string, Entry>()

export function isPresetQuestion(locale: Locale, question: string): boolean {
  return PRESET_QUESTIONS.some(preset => preset[locale] === question.trim())
}

export function answerCacheKey(model: string, locale: Locale, question: string, promptFingerprint: string): string {
  return createHash('sha256').update([model, locale, question.trim(), promptFingerprint].join('\u0000')).digest('hex')
}

export function getCachedAnswer(key: string): ChatStreamEvent[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.events
}

/** Stores an answer, merging consecutive text deltas to keep it small. */
export function setCachedAnswer(key: string, events: ChatStreamEvent[]) {
  const merged: ChatStreamEvent[] = []
  for (const event of events) {
    const last = merged.at(-1)
    if (event.type === 'text' && last?.type === 'text') last.delta += event.delta
    else if (event.type !== 'done') merged.push(event.type === 'text' ? { ...event } : event)
  }
  cache.set(key, { events: merged, expiresAt: Date.now() + TTL_MS })
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Replays a cached answer at a natural typing pace (the avatar talks, cards pop in). */
export async function replayAnswer(events: ChatStreamEvent[], send: (event: ChatStreamEvent) => void, signal: AbortSignal) {
  for (const event of events) {
    if (signal.aborted) return
    if (event.type !== 'text') {
      await sleep(150)
      send(event)
      continue
    }
    for (let i = 0; i < event.delta.length && !signal.aborted; i += 24) {
      send({ type: 'text', delta: event.delta.slice(i, i + 24) })
      await sleep(18)
    }
  }
}
