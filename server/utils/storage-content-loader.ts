import type { H3Event } from 'h3'

interface ContentCache {
    content: string
    timestamp: number
}

// Cache for loaded content (in-memory)
const contentCache = new Map<string, ContentCache>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Loads all content for a given locale using Nitro's storage API
 * This works on both local and serverless deployments (Vercel, Netlify, etc.)
 * Results are cached for performance
 */
export async function loadContentFromStorage(locale: string = 'en', event: H3Event): Promise<string> {
    // Locale kept for interface compatibility; currently unused beyond cache key
    const cacheKey = `storage_content_${locale}`
    console.log('CACHE KEY', cacheKey)
    // Check cache
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Storage Loader] Using cached context for locale '${locale}'`)
        return cached.content
    }

    console.log(`[Storage Loader] Loading fresh content for locale '${locale}'`)

    try {
        // Access the server assets storage
        const storage = useStorage('assets:server')

        // Load base AI context only
        const aiContextContent = await storage.getItem<string>('content/ai-context.md')
        if (!aiContextContent || aiContextContent.trim().length === 0) {
            console.warn('[Storage Loader] AI context is empty or missing')
            throw new Error('AI context missing')
        }

        const fullContext = aiContextContent
        console.log(`[Storage Loader] Loaded AI context: ${fullContext.length} characters`)

        // Add language directive based on locale
        const languageDirective = locale === 'fr'
            ? '\n\nIMPORTANT: Tu DOIS répondre en français. Le contexte ci-dessus est en anglais, mais ta réponse finale pour l\'utilisateur doit être en français.'
            : '\n\nIMPORTANT: You MUST answer in English.'

        const finalContext = fullContext + languageDirective

        // Cache the result
        contentCache.set(cacheKey, {
            content: finalContext,
            timestamp: Date.now(),
        })

        return finalContext
    } catch (error) {
        console.error('[Storage Loader] Critical error loading content:', error)

        // Return minimal context on error
        return `# AI Assistant Context

You are an AI assistant on Alex's portfolio website. Due to a technical issue, detailed context is unavailable.
Please inform users that you're experiencing technical difficulties and suggest they contact Alex directly.`
    }
}

/**
 * Clears the content cache (useful for development or when content is updated)
 */
export function clearStorageContentCache() {
    contentCache.clear()
    console.log('[Storage Loader] Cache cleared')
}
