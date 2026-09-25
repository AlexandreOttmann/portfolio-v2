import type { H3Event } from 'h3'

/**
 * Sliding-window rate limiter kept in memory.
 *
 * Best effort: on Vercel each function instance has its own memory, so this
 * caps abuse per instance, not globally. For a hard global limit, add a Vercel
 * Firewall rate-limit rule on /api/chat (see AI_CHAT_SETUP.md).
 */

interface Window {
  max: number
  ms: number
}

const hits = new Map<string, number[]>()
let lastSweep = Date.now()

function sweep(now: number, longestMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, timestamps] of hits) {
    if (!timestamps.some(t => now - t < longestMs)) hits.delete(key)
  }
}

export function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

/** Returns the number of seconds to wait, or 0 when the request is allowed. */
export function rateLimit(key: string, windows: Window[]): number {
  const now = Date.now()
  const longestMs = Math.max(...windows.map(w => w.ms))
  sweep(now, longestMs)

  const timestamps = (hits.get(key) ?? []).filter(t => now - t < longestMs)
  for (const { max, ms } of windows) {
    const inWindow = timestamps.filter(t => now - t < ms)
    if (inWindow.length >= max) {
      return Math.ceil((inWindow[0]! + ms - now) / 1000)
    }
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return 0
}

export function enforceRateLimit(event: H3Event, scope: string, windows: Window[]) {
  const retryAfter = rateLimit(`${scope}:${clientIp(event)}`, windows)
  if (retryAfter > 0) {
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
}
