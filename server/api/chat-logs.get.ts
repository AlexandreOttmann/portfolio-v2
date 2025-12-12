import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { password } = getQuery(event)

    // Simple security check
    const validPassword = process.env.BEST_PASSWORD

    if (!validPassword) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Server configuration error: Password not set',
        })
    }

    if (password !== validPassword) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    const supabaseUrl = 'https://jobpwmdcwtsjsqwzfifb.supabase.co'
    const supabaseKey = process.env.SUPABASE_KEY

    if (!supabaseKey) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Server configuration error: Supabase key not set',
        })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
        .from('ai_chat_interactions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data
})
