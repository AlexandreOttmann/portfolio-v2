import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://jobpwmdcwtsjsqwzfifb.supabase.co'

let client: SupabaseClient | null | undefined

/** Server-side Supabase client, or null when `SUPABASE_KEY` is not configured. */
export function useServerSupabase(): SupabaseClient | null {
  if (client === undefined) {
    const key = process.env.SUPABASE_KEY
    client = key ? createClient(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL, key) : null
  }
  return client
}
