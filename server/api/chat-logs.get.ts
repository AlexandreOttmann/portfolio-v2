import { createHash, timingSafeEqual } from 'node:crypto'
import { enforceRateLimit } from '../utils/rate-limit'
import { useServerSupabase } from '../utils/supabase'

function sameSecret(a: string, b: string) {
  // Hash both sides so the comparison is constant-time whatever the lengths.
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(a), digest(b))
}

export default defineEventHandler(async (event) => {
  // Slows down password guessing.
  enforceRateLimit(event, 'chat-logs', [{ max: 10, ms: 15 * 60_000 }])

  const validPassword = process.env.BEST_PASSWORD
  if (!validPassword) {
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error: Password not set' })
  }

  // Sent as a header, never in the URL (URLs end up in logs and history).
  const password = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!password || !sameSecret(password, validPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = useServerSupabase()
  if (!supabase) {
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error: Supabase key not set' })
  }

  const { data, error } = await supabase
    .from('ai_chat_interactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')
  return data
})
