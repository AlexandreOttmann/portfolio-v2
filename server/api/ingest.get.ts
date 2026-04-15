import fs from 'node:fs/promises'
import path from 'node:path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import yaml from 'yaml'

/**
 * An API endpoint to ingest markdown, JSON and YAML content into Supabase pgvector
 * Run via: Visiting http://localhost:3000/api/ingest in your browser
 */

type JsonValue = string | number | boolean | null | undefined | JsonValue[] | { [key: string]: JsonValue }

// Convert any JS object/array into a readable flat text block for embedding
function objectToText(obj: JsonValue, depth = 0): string {
  if (obj === null || obj === undefined) return ''
  if (typeof obj !== 'object') return String(obj)
  const pad = '  '.repeat(depth)
  if (Array.isArray(obj)) {
    return obj
      .map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return `${pad}[${i + 1}]\n${objectToText(item, depth + 1)}`
        }
        return `${pad}- ${item}`
      })
      .join('\n')
  }
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => {
      if (typeof v === 'object' && v !== null) {
        return `${pad}${k}:\n${objectToText(v, depth + 1)}`
      }
      return `${pad}${k}: ${v}`
    })
    .join('\n')
}

function strProp(data: JsonValue, key: string): string {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const val = (data as Record<string, JsonValue>)[key]
    return typeof val === 'string' ? val : ''
  }
  return ''
}

export default defineEventHandler(async (event) => {
  console.log('[Ingest] Starting PGVector content ingestion...')

  // Init clients
  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_KEY) {
    console.error('[Ingest] Missing OPENAI_API_KEY or SUPABASE_KEY. Aborting.')
    return { result: 'Missing API keys' }
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    project: process.env.OPENAI_PROJECT,
    organization: process.env.OPENAI_ORGANIZATION,
  })

  const supabaseUrl = 'https://jobpwmdcwtsjsqwzfifb.supabase.co'
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_KEY)

  // Clear existing docs to prevent duplicates
  console.log('[Ingest] Clearing existing portfolio_chunks table...')
  const { error: deleteError } = await supabase.from('portfolio_chunks').delete().neq('id', -1)
  if (deleteError) {
    console.error('[Ingest] Error clearing table:', deleteError)
    return { result: 'Error clearing table', error: deleteError }
  }

  const docsToEmbed: { content: string, metadata: any }[] = []

  // 1. Ingest Main AI Context
  try {
    const aiContextPath = path.resolve(process.cwd(), 'server/assets/content/ai-context.md')
    const aiContext = await fs.readFile(aiContextPath, 'utf8')
    docsToEmbed.push({
      content: aiContext,
      metadata: { type: 'global_context', title: 'AI Context', source: aiContextPath },
    })
    console.log(`[Ingest] Loaded global AI context.`)
  }
  catch (err: unknown) {
    console.warn(`[Ingest] Could not load ai-context.md: ${err instanceof Error ? err.message : String(err)}`)
  }

  // 2. Recursive function to read directory
  async function walkAndIngest(dir: string, baseDir: string = dir) {
    try {
      const files = await fs.readdir(dir)
      for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = await fs.stat(fullPath)

        if (stat.isDirectory()) {
          await walkAndIngest(fullPath, baseDir)
        }
        else {
          const ext = path.extname(file).toLowerCase()
          const relPath = path.relative(baseDir, fullPath)

          if (ext === '.json') {
            const fileContent = await fs.readFile(fullPath, 'utf8')
            try {
              const data = JSON.parse(fileContent) as JsonValue
              const textBody = objectToText(data)
              const title = strProp(data, 'name') || strProp(data, 'title') || file
              docsToEmbed.push({
                content: `Context Type: JSON Data\nPath: ${relPath}\n\n${textBody}`,
                metadata: {
                  type: 'json_doc',
                  title,
                  image: strProp(data, 'image') || null,
                  source: fullPath,
                },
              })
              console.log(`[Ingest] Processed JSON: ${relPath}`)
            }
            catch (e) {
              console.warn(`[Ingest] Failed parsing JSON: ${fullPath}`)
            }
          }
          else if (ext === '.yml' || ext === '.yaml') {
            const fileContent = await fs.readFile(fullPath, 'utf8')
            try {
              const data = yaml.parse(fileContent) as JsonValue
              const textBody = objectToText(data)
              const title = strProp(data, 'title') || file
              docsToEmbed.push({
                content: `Context Type: YAML Data\nPath: ${relPath}\n\n${textBody}`,
                metadata: {
                  type: 'yaml_doc',
                  title,
                  source: fullPath,
                },
              })
              console.log(`[Ingest] Processed YAML: ${relPath}`)
            }
            catch (e) {
              console.warn(`[Ingest] Failed parsing YAML: ${fullPath}`)
            }
          }
          else if (ext === '.md') {
            const fileContent = await fs.readFile(fullPath, 'utf8')
            docsToEmbed.push({
              content: `Context Type: Markdown Document\nPath: ${relPath}\n\n${fileContent}`,
              metadata: {
                type: 'markdown_doc',
                source: fullPath,
              },
            })
            console.log(`[Ingest] Processed Markdown: ${relPath}`)
          }
        }
      }
    }
    catch (err: unknown) {
      console.warn(`[Ingest] Error walking directory ${dir}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Ingest both EN and FR content so French queries hit French chunks (higher cosine similarity).
  const contentDirs = [
    path.resolve(process.cwd(), 'content/en'),
    path.resolve(process.cwd(), 'content/fr'),
    path.resolve(process.cwd(), 'content/canvas'),
    path.resolve(process.cwd(), 'content/stack.json'),
    path.resolve(process.cwd(), 'content/red-wire.md'),
  ]

  for (const target of contentDirs) {
    try {
      const stat = await fs.stat(target)
      if (stat.isDirectory()) {
        await walkAndIngest(target, path.resolve(process.cwd(), 'content'))
      }
      else {
        // Single file — ingest directly
        const ext = path.extname(target).toLowerCase()
        const relPath = path.relative(path.resolve(process.cwd(), 'content'), target)
        const fileContent = await fs.readFile(target, 'utf8')
        if (ext === '.json') {
          const data = JSON.parse(fileContent) as JsonValue
          docsToEmbed.push({
            content: `Context Type: JSON Data\nPath: ${relPath}\n\n${objectToText(data)}`,
            metadata: { type: 'json_doc', title: strProp(data, 'name') || strProp(data, 'title') || relPath, source: target },
          })
          console.log(`[Ingest] Processed JSON: ${relPath}`)
        }
        else if (ext === '.md') {
          docsToEmbed.push({
            content: `Context Type: Markdown Document\nPath: ${relPath}\n\n${fileContent}`,
            metadata: { type: 'markdown_doc', source: target },
          })
          console.log(`[Ingest] Processed Markdown: ${relPath}`)
        }
      }
    }
    catch (err: unknown) {
      console.warn(`[Ingest] Skipping ${target}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Embed and Upload in Batches
  if (docsToEmbed.length === 0) {
    console.log('[Ingest] No documents found to embed.')
    return { result: 'No documents found' }
  }

  console.log(`[Ingest] Found ${docsToEmbed.length} chunks. Generating embeddings...`)

  // Process sequentially to respect OpenAI rate limits
  for (let i = 0; i < docsToEmbed.length; i++) {
    const doc = docsToEmbed[i]
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.content,
        dimensions: 1536,
      })

      const embedding = response.data[0].embedding

      const { error: insertError } = await supabase.from('portfolio_chunks').insert({
        content: doc.content,
        metadata: doc.metadata,
        embedding: embedding,
      })

      if (insertError) {
        console.error(`[Ingest] Failed to insert chunk ${i}:`, insertError)
      }
    }
    catch (embErr: any) {
      console.error(`[Ingest] Embedding error on chunk ${i}:`, embErr.message)
    }
  }

  console.log('[Ingest] Ingestion completed successfully!')
  return { result: 'Success', chunks: docsToEmbed.length }
})
