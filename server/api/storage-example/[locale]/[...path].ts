// Example API route demonstrating useStorage() with copied content files
export default defineEventHandler(async (event) => {
    const locale = getRouterParam(event, 'locale') || 'en'
    const path = getRouterParam(event, 'path') || ''

    // Access the server assets storage layer
    const storage = useStorage('assets:server')

    try {
        // Example 1: Read a specific markdown file
        const contentPath = `content/${locale}/${path}.md`
        const markdownContent = await storage.getItem<string>(contentPath)

        if (!markdownContent) {
            throw createError({
                statusCode: 404,
                message: `Content not found: ${contentPath}`
            })
        }

        // Example 2: Read the AI context
        const aiContext = await storage.getItem<string>('content/ai-context.md')

        // Example 3: Read JSON data
        const stackData = await storage.getItem('content/stack.json')

        // Example 4: List all available content keys
        const allKeys = await storage.getKeys('content/')

        return {
            content: markdownContent,
            aiContext: aiContext?.substring(0, 200) + '...', // Preview
            stack: stackData,
            availableFiles: allKeys,
            requestedPath: contentPath
        }
    } catch (error: any) {
        console.error('[Storage API] Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to load content from storage'
        })
    }
})
