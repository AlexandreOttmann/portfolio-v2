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
    const cacheKey = `storage_content_${locale}`

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

        // Load base AI context
        let baseContext = ''
        try {
            const aiContextContent = await storage.getItem<string>('content/ai-context.md')
            if (aiContextContent) {
                baseContext = aiContextContent
                console.log(`[Storage Loader] Loaded AI context: ${baseContext.length} characters`)
            }
        } catch (error) {
            console.warn('[Storage Loader] Failed to load base AI context:', error)
        }

        // Load all content files for the locale
        const contents: string[] = []

        try {
            // Get all keys for this locale
            const localePrefix = `content/${locale}/`
            const keys = await storage.getKeys(localePrefix)

            console.log(`[Storage Loader] Found ${keys.length} files for locale '${locale}'`)

            // Load each file
            for (const key of keys) {
                try {
                    // Only process markdown files
                    if (!key.endsWith('.md')) {
                        continue
                    }

                    const fileContent = await storage.getItem<string>(key)
                    if (fileContent && fileContent.trim().length > 0) {
                        // Extract the path for better context
                        const relativePath = key.replace('content/', '')
                        const formattedContent = `\n## Content from: /${relativePath}\n\n${fileContent}\n`
                        contents.push(formattedContent)
                    }
                } catch (fileError) {
                    console.warn(`[Storage Loader] Failed to load file ${key}:`, fileError)
                }
            }

            console.log(`[Storage Loader] Successfully loaded ${contents.length} content files`)
        } catch (error) {
            console.warn('[Storage Loader] Failed to load locale content:', error)
        }

        // Combine everything
        const fullContext = `${baseContext}

---

# Additional Context from Portfolio Content

The following sections contain detailed information about Alex's work, projects, and experience.
Use ONLY this information to provide accurate responses. Never make up information not present in this context.

${contents.join('\n---\n')}
`

        // Cache the result
        contentCache.set(cacheKey, {
            content: fullContext,
            timestamp: Date.now(),
        })

        return fullContext
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
