import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

interface ContentCache {
    content: string
    timestamp: number
}

// Cache for loaded content (in-memory)
const contentCache = new Map<string, ContentCache>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Recursively loads all markdown files from a directory
 */
async function loadMarkdownFiles(dirPath: string, basePath: string = ''): Promise<string[]> {
    const contents: string[] = []

    try {
        const entries = await readdir(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name)
            const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

            if (entry.isDirectory()) {
                // Recursively load from subdirectories
                const subContents = await loadMarkdownFiles(fullPath, relativePath)
                contents.push(...subContents)
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                try {
                    let content = await readFile(fullPath, 'utf-8')

                    // Strip YAML frontmatter to avoid confusing the AI with JSON-like syntax
                    content = content.replace(/^---[\s\S]*?---\n/, '')

                    // Remove any potential invisible characters or encoding issues
                    content = content.replace(/\u0000/g, '') // Remove null bytes
                    content = content.trim()

                    // Skip empty files after frontmatter removal
                    if (content.length === 0) {
                        continue
                    }

                    // Add a header with the file path for context
                    const formattedContent = `\n## Content from: ${relativePath}\n\n${content}\n`
                    contents.push(formattedContent)
                }
                catch (error) {
                    console.warn(`Failed to read file ${fullPath}:`, error)
                }
            }
        }
    }
    catch (error) {
        console.warn(`Failed to read directory ${dirPath}:`, error)
    }

    return contents
}

/**
 * Loads all content for a given locale and returns it as a formatted string
 * Results are cached for performance
 */
export async function loadContentContext(locale: string = 'en'): Promise<string> {
    const cacheKey = `content_${locale}`

    // Check cache
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.content
    }

    // Load content from filesystem
    const contentDir = join(process.cwd(), 'content', locale)
    const markdownFiles = await loadMarkdownFiles(contentDir)

    // Also load the base AI context
    const baseContextPath = join(process.cwd(), 'content', 'ai-context.md')
    let baseContext = ''
    try {
        baseContext = await readFile(baseContextPath, 'utf-8')
    }
    catch (error) {
        console.warn('Failed to load base AI context:', error)
    }

    // Combine everything with a clear instruction
    const fullContext = `${baseContext}

---

# Additional Context from Portfolio Content

The following sections contain detailed information about Alex's work, projects, and experience.
Use ONLY this information to provide accurate responses. Never make up information not present in this context.

${markdownFiles.join('\n---\n')}
`

    // Cache the result
    contentCache.set(cacheKey, {
        content: fullContext,
        timestamp: Date.now(),
    })

    // Debug: Log context size
    console.log(`[Content Loader] Loaded context for locale '${locale}': ${fullContext.length} characters, ${markdownFiles.length} files`)

    return fullContext
}

/**
 * Clears the content cache (useful for development or when content is updated)
 */
export function clearContentCache() {
    contentCache.clear()
}
