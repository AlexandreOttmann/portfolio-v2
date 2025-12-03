import type { H3Event } from 'h3'

interface ContentCache {
    content: string
    timestamp: number
}


// Cache for loaded content (in-memory)
const contentCache = new Map<string, ContentCache>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Loads all content for a given locale using Nuxt Content queryCollection
 * This works on both local and Vercel deployments
 * Results are cached for performance
 */
export async function loadContentContext(locale: string = 'en', event: H3Event): Promise<string> {
    const cacheKey = `content_${locale}`

    // Check cache
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // console.log(`[Content Loader] Using cached context for locale '${locale}'`)
        return cached.content
    }

    // console.log(`[Content Loader] Loading fresh content for locale '${locale}'`)

    try {
        // Load base AI context
        let baseContext = ''
        try {
            const aiContextDoc = await queryCollection(event, 'ai_context').first()
            if (aiContextDoc?.body) {
                baseContext = extractTextFromAST(aiContextDoc.body)
            }
        }
        catch (error) {
            console.warn('[Content Loader] Failed to load base AI context:', error)
        }

        // Load all content for the locale
        const contents: string[] = []

        try {
            // Query all content documents for this locale
            const docs = await queryCollection(event, `content_${locale}`).all()

            // console.log(`[Content Loader] Found ${docs.length} documents for locale '${locale}'`)
            // console.log('first doc', docs)
            for (const doc of docs) {
                if (doc.body) {
                    const textContent = extractTextFromAST(doc.body)

                    if (textContent.trim().length > 0) {
                        const formattedContent = `\n## Content from: ${doc._path}\n\n${textContent}\n`
                        contents.push(formattedContent)
                    }
                }
            }
        }
        catch (error) {
            console.warn('[Content Loader] Failed to load locale content:', error)
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
    }
    catch (error) {
        console.error('[Content Loader] Critical error loading content:', error)

        // Return minimal context on error
        return `# AI Assistant Context

You are an AI assistant on Alex's portfolio website. Due to a technical issue, detailed context is unavailable. 
Please inform users that you're experiencing technical difficulties and suggest they contact Alex directly.`
    }
}

/**
 * Recursively extracts plain text from Nuxt Content AST (minimark format)
 */
function extractTextFromAST(body: any): string {
    if (!body) return ''

    // Handle minimark format (Nuxt Content v3)
    if (body.type === 'minimark' && Array.isArray(body.value)) {
        return body.value
            .map((node: any) => extractTextFromNode(node))
            .filter(Boolean)
            .join('\n\n')
    }

    // Fallback for other formats
    if (body.children && Array.isArray(body.children)) {
        return body.children
            .map((child: any) => extractTextFromNode(child))
            .join('')
    }

    return ''
}

/**
 * Extracts text from individual content nodes
 */
function extractTextFromNode(node: any): string {
    if (!node) return ''

    // Handle text nodes
    if (typeof node === 'string') {
        return node
    }

    if (node.type === 'text') {
        return node.value || node.content || ''
    }

    // Handle nodes with children
    if (node.children && Array.isArray(node.children)) {
        const text = node.children
            .map((child: any) => extractTextFromNode(child))
            .join('')

        // Add spacing for block elements
        if (node.tag === 'p' || node.tag === 'div' || node.tag === 'li') {
            return text + '\n'
        }

        return text
    }

    // Handle nodes with content
    if (node.content) {
        return node.content
    }

    return ''
}

/**
 * Clears the content cache (useful for development or when content is updated)
 */
export function clearContentCache() {
    contentCache.clear()
    console.log('[Content Loader] Cache cleared')
}
